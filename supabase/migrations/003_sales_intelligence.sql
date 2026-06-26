-- ─── Segmentare clienți RFM ───
-- Recency: zile de la ultima comandă
-- Frequency: numărul total de comenzi
-- Monetary: valoarea totală a comenzilor
-- Clasificarea se face cu NTILE(4) pe comenzile care nu sunt draft/anulate.
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
    ntile(4) over (order by recency desc) as r_score, -- datele mai vechi primesc 1, cele mai recente 4
    ntile(4) over (order by frequency asc) as f_score, -- mai puține comenzi primesc 1, mai multe primesc 4
    ntile(4) over (order by monetary asc) as m_score   -- cheltuieli mai mici primesc 1, mai mari primesc 4
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

-- ─── Detecție automată a riscului de churn ───
-- Compară zilele de la ultima comandă cu intervalele istorice.
-- Marchează clientul ca risc dacă days_since_last_order > media_intervalelor * 1.5.
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
  coalesce(nullif(oi.avg_days_between, 0), 45) as avg_days_between, -- valoare implicită de 45 de zile pentru clienții cu o singură comandă SAU cu toate comenzile în aceeași zi (medie = 0), evitând împărțirea la zero
  (oi.days_since_last_order > (coalesce(nullif(oi.avg_days_between, 0), 45) * 1.5)) as is_at_risk,
  round(oi.days_since_last_order::numeric / coalesce(nullif(oi.avg_days_between, 0), 45)::numeric, 2) as risk_factor
from public.companies c
join order_intervals oi on oi.company_id = c.id;

-- ─── Viteza de vânzare și predicția epuizării stocului ───
-- Evaluează ritmul zilnic din ultimele 30 de zile pentru a estima epuizarea.
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
      999 -- viteză mică / fără risc
  end as days_to_stockout
from public.products p
left join sales_last_30_days s on s.product_id = p.id
where p.is_active = true;
