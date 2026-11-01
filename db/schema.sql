-- IPO Tracker schema for Supabase
-- GMP is unofficial. Not investment advice.

create table ipos (
  id uuid primary key default gen_random_uuid(), -- unique row id
  company_name text not null unique,             -- company issuing the IPO
  segment text not null check (segment in ('mainboard', 'sme')), -- mainboard or SME
  status text not null check (status in ('upcoming', 'open', 'closed', 'listed')), -- current IPO stage
  open_date date,                                -- bidding start date
  close_date date,                               -- bidding last date
  allotment_date date,                           -- share allotment date
  listing_date date,                             -- stock exchange listing date
  price_band_low numeric,                        -- lower price of the issue (Rs)
  price_band_high numeric,                       -- upper price of the issue (Rs)
  lot_size integer,                              -- shares in one lot
  issue_size_cr numeric,                         -- total issue size in crore
  gmp numeric,                                   -- unofficial grey market premium (Rs)
  gmp_updated_at timestamptz,                    -- when GMP was last refreshed
  updated_at timestamptz not null default now(), -- when this IPO row last changed
  business_summary text,                         -- short plain summary of the business (from the RHP)
  strengths text[],                              -- short list of positives
  risks text[]                                   -- short list of risks
);

create table gmp_history (
  id uuid primary key default gen_random_uuid(), -- unique history row id
  ipo_id uuid not null references ipos (id) on delete cascade, -- which IPO this GMP belongs to
  gmp numeric not null,                          -- GMP value recorded that day
  recorded_at timestamptz not null default now() -- when this GMP snapshot was stored
);

create table subscribers (
  chat_id bigint primary key,                    -- Telegram chat that receives alerts
  username text,                                 -- Telegram @username, if the user has one
  active boolean not null default true,          -- false after the user sends /stop
  created_at timestamptz not null default now(), -- when they first sent /start
  updated_at timestamptz not null default now()  -- when they last started or stopped
);

-- Only the server (secret key) may read or write subscribers.
-- RLS on with no policies blocks the public publishable key.
alter table subscribers enable row level security;
