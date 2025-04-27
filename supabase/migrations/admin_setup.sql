-- Create user_roles table if it doesn't exist
create table if not exists user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  role text not null check (role in ('admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table user_roles enable row level security;

-- Create policy to allow users to read their own roles
create policy "Users can read their own roles"
  on user_roles for select
  using (auth.uid() = user_id);

-- Create policy to allow admins to manage all roles
create policy "Admins can manage roles"
  on user_roles for all
  using (exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'admin'
  ));

-- Add admin role for your user
insert into user_roles (user_id, role)
values ('32820eff-8c80-4fa4-916b-a2116d3e351a', 'admin')
on conflict (user_id) do update set role = 'admin';
