create table if not exists public.webforge_demo_pro (
  user_id uuid primary key,
  email text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.webforge_demo_pro enable row level security;
