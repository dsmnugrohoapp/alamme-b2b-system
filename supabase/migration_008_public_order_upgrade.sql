alter table products add column if not exists commercial_name text;
alter table products add column if not exists image_url text;
alter table products add column if not exists description text;
alter table products add column if not exists variant_group text;
alter table products add column if not exists variant_label text;
alter table orders add column if not exists shipping_preference text;
alter table orders add column if not exists payment_method_preference text;
insert into app_settings (key, value) values ('public_order_company', '"sda"') on conflict (key) do nothing;
