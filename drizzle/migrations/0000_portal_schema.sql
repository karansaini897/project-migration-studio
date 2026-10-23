do $$ begin create type public.app_role as enum ('admin','institution','faculty','student'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_status as enum ('active','suspended','pending'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  username text not null check (username ~ '^[a-z0-9._]{3,30}$'),
  phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  contact_email text check (contact_email is null or char_length(contact_email) <= 255),
  date_of_birth date,
  gender text check (gender is null or gender in ('female','male','non_binary','prefer_not_to_say')),
  photo_url text,
  status public.account_status not null default 'active',
  roll_number text, institution_name text, institution_code text, course text, department text,
  year_semester text, employee_id text, designation text, joining_date date,
  authorization_status text check (authorization_status is null or authorization_status in ('pending','authorized','revoked')),
  permission_level text check (permission_level is null or permission_level in ('reviewer','senior_reviewer','super_admin')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (username);
create unique index if not exists profiles_phone_key on public.profiles (phone);
create unique index if not exists profiles_contact_email_key on public.profiles (lower(contact_email)) where contact_email is not null;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.app_role not null
);

create table if not exists public.app_setup (
  id int primary key check (id = 1),
  completed_at timestamptz not null default now()
);
comment on table public.app_setup is 'Single-row marker set once the first admin account is created.';

grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant all on public.app_setup to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.app_setup enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Users read own role" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();