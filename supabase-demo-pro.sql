create table if not exists public.webforge_demo_pro (
  user_id uuid primary key,
  email text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.webforge_demo_pro
  add column if not exists plan text not null default 'pro';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'webforge_demo_pro_plan_check'
      and conrelid = 'public.webforge_demo_pro'::regclass
  ) then
    alter table public.webforge_demo_pro
      add constraint webforge_demo_pro_plan_check
      check (plan in ('pro', 'premium'));
  end if;
end $$;

alter table public.webforge_demo_pro enable row level security;

notify pgrst, 'reload schema';
