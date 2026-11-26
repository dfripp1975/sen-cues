-- Regional pricing: remember which currency each subscription is charged in.
-- Written only by the Stripe webhook (service role), like the rest of the table.
alter table public.subscriptions
  add column if not exists currency text check (currency is null or currency ~ '^[A-Z]{3}$');
