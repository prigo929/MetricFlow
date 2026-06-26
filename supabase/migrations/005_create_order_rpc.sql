-- ============================================================
-- Platforma B2B MetricFlow: crearea atomică a comenzii
-- Migrarea: 005_create_order_rpc.sql
-- ============================================================
--
-- DE CE EXISTĂ ACEASTĂ MIGRARE:
-- Crearea unei comenzi din aplicație însemna anterior două scrieri independente
-- (INSERT orders, apoi INSERT order_items) cu o verificare de stoc doar-citire între ele.
-- Asta lăsa două probleme de corectitudine:
-- 1. CONDIȚIE DE CURSĂ / OVERSELLING: verificarea de stoc era citire-apoi-scriere fără
-- blocare și fără decrementare, deci două comenzi concurente puteau trece amândouă.
-- În plus, stocul nu era niciodată redus efectiv la plasarea unei comenzi.
-- 2. SCRIERE NON-ATOMICĂ: dacă inserarea liniilor eșua, rămânea un antet de comandă orfan
-- (total_amount = 0, fără linii).
--
-- SOLUȚIA:
-- O singură funcție PL/pgSQL rulează într-o tranzacție. Inserează antetul,
-- iar pentru fiecare linie DECREMENTEAZĂ stocul printr-un UPDATE protejat
-- (... where stock_qty >= qty); dacă nu se potrivește niciun rând, ridică excepție, iar
-- toată tranzacția (antet, decrementări anterioare, rânduri de audit) se anulează. Blocarea
-- la nivel de rând pe UPDATE serializează decrementările concurente, eliminând cursa.
--
-- SECURITY DEFINER e necesar fiindcă decrementarea scrie în products,
-- pe care RLS o restricționează altfel la admini; funcția restabilește autorizarea
-- explicit (apelantul trebuie să fie admin sau sales_rep) înainte de orice.

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
  -- Autorizare (apărare în adâncime, fiindcă SECURITY DEFINER ocolește RLS-ul tabelelor).
  if public.get_user_role(auth.uid()) not in ('admin', 'sales_rep') then
    raise exception 'Access Denied: insufficient privileges to create orders';
  end if;

  -- 1. Inserează antetul comenzii. total_amount rămâne 0 aici; trigger-ul sync_order_total
  -- îl completează pe măsură ce se inserează liniile mai jos.
  insert into public.orders (
    company_id, assigned_to, status, order_date, expected_delivery, notes
  )
  values (
    p_company_id, p_assigned_to, p_status, p_order_date, p_expected_delivery, p_notes
  )
  returning * into v_order;

  -- 2. Pentru fiecare linie: decrementează atomic stocul (protejat), apoi inserează linia.
  -- UPDATE-ul protejat rezervă unitățile și blochează rândul produsului,
  -- serializând comenzile concurente pentru același produs.
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
      -- Fie produsul nu mai există, fie stocul rămas e insuficient.
      raise exception 'Insufficient stock for product %', v_product_id
        using errcode = 'check_violation';
    end if;

    insert into public.order_items (order_id, product_id, quantity, unit_price)
    values (v_order.id, v_product_id, v_quantity, v_unit_price);
  end loop;

  -- 3. Recitește, ca rândul returnat să conțină total_amount calculat de trigger.
  select * into v_order from public.orders where id = v_order.id;
  return v_order;
end;
$$;

grant execute on function public.create_order_atomic(uuid, uuid, order_status, date, date, text, jsonb)
  to authenticated;
