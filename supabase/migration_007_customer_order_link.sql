alter table customers add column if not exists order_token text;
update customers set order_token = encode(gen_random_bytes(9), 'hex') where order_token is null;
alter table customers alter column order_token set default encode(gen_random_bytes(9), 'hex');
create unique index if not exists customers_order_token_idx on customers (order_token);
