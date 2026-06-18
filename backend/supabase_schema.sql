-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- After running: Table Editor > transactions > Replication > enable INSERT

-- allocation_rules
create table if not exists allocation_rules (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  account_id text not null,
  buckets jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (sender_id, account_id)
);
create index if not exists idx_alloc_sender  on allocation_rules(sender_id);
create index if not exists idx_alloc_account on allocation_rules(account_id);

-- transactions  (ENABLE REALTIME ON THIS TABLE)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,
  merchant text not null,
  amount_lkr numeric not null,
  bucket_id text,
  bucket_label text,
  txn_date timestamptz default now(),
  source text default 'mock'
);
create index if not exists idx_txn_account on transactions(account_id);
create index if not exists idx_txn_date    on transactions(txn_date desc);

-- sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  language text default 'en',
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_sessions_user on sessions(user_id);

-- demo_state  (single row)
create table if not exists demo_state (
  id int primary key check (id = 1),
  scenario text default 'idle',
  last_spend jsonb,
  updated_at timestamptz default now()
);
insert into demo_state (id, scenario) values (1, 'idle')
  on conflict (id) do nothing;

-- tax_jar_rules
create table if not exists tax_jar_rules (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  from_account_id text not null,
  to_account_id text not null,
  percentage numeric not null,
  label text default 'Tax Savings',
  status text default 'ACTIVE',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, from_account_id)
);
create index if not exists idx_tax_jar_user on tax_jar_rules(user_id);

-- Pre-seed default tax jar rule for demo
insert into tax_jar_rules (user_id, from_account_id, to_account_id, percentage, label, status)
values ('SEY-BIZ-001', 'SEY-BIZ-001', 'SEY-SAV-001', 10, 'Tax Savings', 'ACTIVE')
  on conflict (user_id, from_account_id) do nothing;

-- payments (MPGS Hosted Checkout)
CREATE TABLE IF NOT EXISTS payments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         text        UNIQUE NOT NULL,
  session_id       text,
  amount_lkr       numeric     NOT NULL,
  currency         text        DEFAULT 'LKR',
  purpose          text        NOT NULL,
  description      text,
  status           text        DEFAULT 'PENDING',
  metadata         jsonb       DEFAULT '{}'::jsonb,
  gateway_response jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);