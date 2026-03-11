-- Create profiles table to store user voice samples
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  voice_samples text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can only read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Auto-update updated_at on change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
