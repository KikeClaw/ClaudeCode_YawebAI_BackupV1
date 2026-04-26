-- yaweb platform schema

create extension if not exists "uuid-ossp";

-- Verticals supported
create type vertical_type as enum (
  'generic', 'restaurant', 'bar', 'salon', 'clinic', 'academy', 'shop', 'workshop'
);

-- Client status
create type client_status as enum (
  'demo', 'active', 'inactive', 'expired'
);

-- Lead status
create type lead_status as enum (
  'new', 'demo_generating', 'demo_ready', 'email_sent', 'demo_visited', 'converted', 'rejected'
);

-- Plan type
create type plan_type as enum ('basic', 'premium');

-- Clients (paying customers)
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  status client_status default 'demo',
  plan plan_type default 'basic',
  vertical vertical_type default 'generic',
  google_business_url text,
  google_place_id text,
  email text,
  phone text,
  whatsapp text,
  paid_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  annual_amount numeric(10,2) default 99.00,
  notes text,
  github_repo_url text,
  custom_domain text,
  channel text default 'admin',
  model text,
  is_internal boolean default false,
  is_portfolio boolean default false,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10,6),
  created_by uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Admin users (team members with access to the dashboard)
create table if not exists admin_users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'comercial' check (role in ('superadmin', 'comercial')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Site content (AI-generated, versioned)
create table site_content (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  version int default 1,
  content jsonb not null,
  template_id text default 'default',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Leads (prospects for cold outreach)
create table leads (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  google_business_url text,
  google_place_id text,
  email text,
  phone text,
  address text,
  city text,
  vertical vertical_type default 'generic',
  has_website boolean default false,
  existing_website text,
  demo_slug text,
  demo_generated_at timestamptz,
  status lead_status default 'new',
  email_sent_at timestamptz,
  email_opened_at timestamptz,
  demo_visited_at timestamptz,
  converted_at timestamptz,
  campaign_id uuid,
  notes text,
  created_at timestamptz default now()
);

-- Email campaigns
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  body_html text not null,
  body_text text,
  leads_count int default 0,
  sent_count int default 0,
  opened_count int default 0,
  visited_count int default 0,
  converted_count int default 0,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Add campaign FK to leads
alter table leads add constraint leads_campaign_fk
  foreign key (campaign_id) references campaigns(id) on delete set null;

-- indexes
create index on clients(slug);
create index on clients(status);
create index on site_content(client_id);
create index on leads(status);
create index on leads(city);
create index on leads(campaign_id);
