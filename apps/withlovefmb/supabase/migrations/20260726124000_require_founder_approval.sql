-- Every completed work order passes through the evidence and founder approval
-- workflow. This keeps the approval surface operational instead of optional.
update public.work_orders
set approval_required = true
where approval_required is false;

alter table public.work_orders
  drop constraint if exists work_orders_approval_required_must_be_true;

alter table public.work_orders
  add constraint work_orders_approval_required_must_be_true
  check (approval_required);
