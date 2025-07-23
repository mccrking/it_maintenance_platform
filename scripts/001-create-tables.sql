
-- Table for user profiles, linked to Supabase Auth users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade not null,
  updated_at timestamp with time zone default now(),
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text default 'client' not null check (role in ('client', 'technician', 'admin')) -- enforce allowed roles
);
-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select using (true);

create policy "Users can insert their own profile."
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile."
  on profiles for update using (auth.uid() = id);
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', 'client');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Trigger to auto-update updated_at on row changes
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
create trigger set_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

-- ...existing code...
-- Table for support tickets
create table tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  user_id uuid not null references profiles(id) on delete cascade constraint tickets_user_id_fkey,
  title text not null,
  description text not null,
  category text, -- e.g., 'hardware', 'software', 'network', 'other'
  priority text default 'Normal' not null check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  status text default 'Pending' not null check (status in ('Pending', 'In Progress', 'Resolved', 'Closed')),
  assigned_to uuid references profiles(id) constraint tickets_assigned_to_fkey, -- Technician assigned to the ticket
  comments jsonb default '[]'::jsonb, -- Array of { user_id, comment, created_at }
  solution text,
  attachment_url text
);
create index idx_profiles_username on profiles(username);
create index idx_tickets_user_id on tickets(user_id);
create index idx_tickets_assigned_to on tickets(assigned_to);
create index idx_tickets_status on tickets(status);

alter table tickets enable row level security;

create policy "Clients can view their own tickets."
  on tickets for select using (auth.uid() = user_id);

create policy "Technicians can view assigned and pending tickets."
  on tickets for select using (
    (select role from profiles where id = auth.uid()) = 'technician'
    and (assigned_to = auth.uid() or status = 'Pending')
  );

create policy "Admins can view all tickets."
  on tickets for select using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Clients can create tickets."
  on tickets for insert with check (auth.uid() = user_id);

create policy "Technicians can update tickets."
  on tickets for update using (
    (select role from profiles where id = auth.uid()) = 'technician'
    and (assigned_to = auth.uid() or status = 'Pending') -- Can update if assigned or if pending (to assign themselves)
  ) with check (
    (select role from profiles where id = auth.uid()) = 'technician'
  );

create policy "Admins can update all tickets."
  on tickets for update using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can delete tickets."
  on tickets for delete using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
