-- Run this in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query)

create table if not exists public.profiles (
  id          uuid not null references auth.users on delete cascade,
  niche       text,
  personality text,
  audience    text,
  style       text,
  platform    text,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable Row Level Security so users can only see their own data
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);
