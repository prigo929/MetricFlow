-- ============================================================
-- MetricFlow B2B Platform — Atomic Order Creation
-- Migration: 005_create_order_rpc.sql
-- ============================================================
--
-- WHY THIS MIGRATION EXISTS:
-- Creating an order from the application previously meant two independent writes
-- (INSERT orders, then INSERT order_items) with a read-only stock check in between.
-- That left two correctness gaps:
--   1. RACE CONDITION / OVERSELLING — the stock check was read-then-write with no
--      lock and no decrement, so two concurrent orders could both pass and oversell.
--      Stock was also never actually reduced when an order was placed.
--   2. NON-ATOMIC WRITE — if the line-item insert failed, an orphan order header
--      (total_amount = 0, no lines) was left behind.
--
-- THE FIX:
-- A single PL/pgSQL function runs inside one transaction. It inserts the header,
-- and for each line it DECREMENTS stock with a guarded UPDATE
-- (`... where stock_qty >= qty`); if the guard matches no row, it raises, and the
-- whole transaction — header, prior decrements, audit rows — rolls back. PostgreSQL
-- row-level locking on the UPDATE serialises concurrent decrements, closing the race.
--
-- SECURITY DEFINER is required because the stock decrement writes to `products`,
-- which RLS otherwise restricts to admins; the function re-establishes authorization
-- explicitly (caller must be admin or sales_rep) before doing anything.

create or replace function public.create_order_atomic(
  p_company_id        uuid,
  p_assigned_to       uuid,
  p_status            order_status,
  p_order_date        date,
  p_expected_delivery date,
  p_notes             text,
  p_items             jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order      public.orders;
  v_item       jsonb;
  v_product_id uuid;
  v_quantity   integer;
  v_unit_price numeric;
  v_updated    integer;
begin
  -- Authorization (defence-in-depth, since SECURITY DEFINER bypasses table RLS).
  if public.get_user_role(auth.uid()) not in ('admin', 'sales_rep') then
    raise exception 'Access Denied: insufficient privileges to create orders';
  end if;

  -- 1. Insert the order header. total_amount stays 0 here; the sync_order_total
  --    trigger fills it in as line items are inserted below.
  insert into public.orders (
    company_id, assigned_to, status, order_date, expected_delivery, notes
  )
  values (
    p_company_id, p_assigned_to, p_status, p_order_date, p_expected_delivery, p_notes
  )
  returning * into v_order;

  -- 2. For each line: atomically decrement stock (guarded), then insert the line.
  --    The guarded UPDATE both reserves the units and locks the product row,
  --    serialising concurrent orders for the same product.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity   := (v_item ->> 'quantity')::integer;
    v_unit_price := (v_item ->> 'unit_price')::numeric;

    update public.products
    set stock_qty = stock_qty - v_quantity
    where id = v_product_id
      and stock_qty >= v_quantity;

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      -- Either the product vanished or there is not enough stock left.
      raise exception 'Insufficient stock for product %', v_product_id
        using errcode = 'check_violation';
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order.id, v_product_id, v_quantity, v_unit_price);
  end loop;

  -- 3. Re-read so the returned row carries the trigger-computed total_amount.
  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end;
$$;

grant execute on function public.create_order_atomic(uuid, uuid, order_status, date, date, text, jsonb)
  to authenticated;
