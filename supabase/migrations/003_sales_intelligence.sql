-- ─── RFM Customer Segmentation ───────────────────────────────────────────────
-- Recency: Days since last order
-- Frequency: Total order count
-- Monetary: Total order amount
-- Ranking is performed using NTILE(4) over non-cancelled/non-draft orders.
create or replace view public.v_rfm_segments as
with raw_metrics as (
  select
    c.id as company_id,
    c.name as company_name,
    c.tier,
    (current_date - max(o.order_date))::integer as recency,
    count(o.id)::integer as frequency,
    coalesce(sum(o.total_amount), 0) as monetary
  from public.companies c
  join public.orders o on o.company_id = c.id
  where o.status not in ('draft', 'cancelled')
  group by c.id, c.name, c.tier
),
scores as (
  select
    *,
    ntile(4) over (order by recency desc) as r_score, -- Older last dates get 1, more recent gets 4
    ntile(4) over (order by frequency asc) as f_score, -- Fewer orders gets 1, more orders gets 4
    ntile(4) over (order by monetary asc) as m_score   -- Smaller spend gets 1, larger spend gets 4
  from raw_metrics
)
select
  *,
  (r_score || '-' || f_score || '-' || m_score) as rfm_code,
  case
    when r_score >= 3 and f_score >= 3 and m_score >= 3 then 'Champions'
    when r_score >= 3 and f_score >= 1 and m_score >= 3 then 'Loyal Customers'
    when r_score >= 3 and f_score >= 3 and m_score >= 1 then 'Promising'
    when r_score >= 3 and f_score >= 1 and m_score >= 1 then 'New Customers'
    when r_score <= 2 and f_score >= 3 and m_score >= 3 then 'Can''t Lose Them'
    when r_score <= 2 and f_score >= 2 and m_score >= 2 then 'At Risk'
    when r_score <= 2 and f_score <= 2 and m_score >= 2 then 'About to Sleep'
    else 'Lost / Hibernating'
  end as rfm_segment
from scores;

-- ─── Automated Churn Risk Detection ──────────────────────────────────────────
-- Compares current days since last order against historical intervals.
-- Flags company as risk if days_since_last_order > average_days_between_orders * 1.5.
create or replace view public.v_churn_risk as
with order_intervals as (
  select
    company_id,
    (current_date - max(order_date))::integer as days_since_last_order,
    case
      when count(id) > 1 then
        (max(order_date) - min(order_date))::integer / (count(id) - 1)
      else
        null
    end as avg_days_between
  from public.orders
  where status not in ('draft', 'cancelled')
  group by company_id
)
select
  c.id as company_id,
  c.name as company_name,
  c.tier,
  oi.days_since_last_order,
  coalesce(oi.avg_days_between, 45) as avg_days_between, -- Default fallback of 45 days for single order clients
  (oi.days_since_last_order > (coalesce(oi.avg_days_between, 45) * 1.5)) as is_at_risk,
  round(oi.days_since_last_order::numeric / coalesce(oi.avg_days_between, 45)::numeric, 2) as risk_factor
from public.companies c
join order_intervals oi on oi.company_id = c.id;

-- ─── Product Velocity and Stockout Prediction ───────────────────────────────
-- Evaluates daily run rate over the last 30 days to predict depletion.
create or replace view public.v_product_velocity as
with sales_last_30_days as (
  select
    product_id,
    coalesce(sum(quantity), 0) as total_units_sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status not in ('draft', 'cancelled')
    and o.order_date >= (current_date - interval '30 days')
  group by product_id
)
select
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.category,
  p.stock_qty,
  coalesce(s.total_units_sold, 0)::integer as units_sold_30d,
  round(coalesce(s.total_units_sold, 0)::numeric / 30.0, 2) as avg_daily_velocity,
  case
    when coalesce(s.total_units_sold, 0) > 0 then
      least(round(p.stock_qty::numeric / (coalesce(s.total_units_sold, 0)::numeric / 30.0), 0), 999)
    else
      999 -- Low velocity / No risk
  end as days_to_stockout
from public.products p
left join sales_last_30_days s on s.product_id = p.id
where p.is_active = true;
