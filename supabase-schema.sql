-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  content_topic text,
  personality text,
  target_audience text,
  content_style text,
  platform text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scripts table
create table public.scripts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic text not null,
  hook text not null,
  main_content text not null,
  call_to_action text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.scripts enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own scripts" on public.scripts for select using (auth.uid() = user_id);
create policy "Users can insert own scripts" on public.scripts for insert with check (auth.uid() = user_id);
create policy "Users can view shared scripts" on public.scripts for select using (true);
