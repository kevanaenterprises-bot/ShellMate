-- ================================================
-- ShellMate Database Schema
-- Run this in Supabase > SQL Editor
-- ================================================

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  stripe_customer_id text unique,
  plan text default 'free',          -- 'free' | 'terminal' | 'companion' | 'bundle'
  subscription_status text,          -- 'active' | 'canceled' | 'past_due'
  companion_personality text default 'nova',  -- 'nova' | 'axel'
  created_at timestamptz default now()
);

-- Usage tracking (per user per day)
create table public.usage (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  product text not null,             -- 'terminal' | 'companion'
  tokens_used integer default 0,
  questions_asked integer default 0,
  date date default current_date,
  unique(user_id, product, date)
);

-- Subscriptions log (for auditing)
create table public.subscriptions (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row level security
alter table public.profiles enable row level security;
alter table public.usage enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can view own usage" on public.usage for select using (auth.uid() = user_id);
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
