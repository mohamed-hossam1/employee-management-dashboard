create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar text,
  phone text not null default '',
  bio text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login timestamptz not null default timezone('utc', now()),
  settings jsonb not null default jsonb_build_object(
    'theme', 'light',
    'notifications', jsonb_build_object(
      'email', true,
      'inApp', true,
      'attendanceAlerts', true
    )
  )
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#3b82f6',
  icon text not null default 'briefcase',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text not null default '',
  manager_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, name)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  department_id text not null default '',
  position text not null,
  salary numeric(12, 2) not null default 0,
  hire_date date not null,
  status text not null check (status in ('active', 'inactive', 'on-leave')),
  avatar text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, email)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null check (status in ('present', 'late', 'absent')),
  hours_worked numeric(6, 2),
  notes text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  unique (employee_id, date)
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  action text not null,
  description text not null,
  timestamp timestamptz not null default timezone('utc', now()),
  user_id uuid references auth.users (id) on delete set null
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists departments_project_id_idx on public.departments (project_id);
create index if not exists employees_project_id_idx on public.employees (project_id);
create index if not exists attendance_project_id_idx on public.attendance (project_id);
create index if not exists attendance_employee_id_idx on public.attendance (employee_id);
create index if not exists activity_project_id_idx on public.activity (project_id);
create index if not exists activity_user_id_idx on public.activity (user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

drop trigger if exists set_departments_updated_at on public.departments;
create trigger set_departments_updated_at
before update on public.departments
for each row execute procedure public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute procedure public.set_updated_at();

drop trigger if exists set_attendance_updated_at on public.attendance;
create trigger set_attendance_updated_at
before update on public.attendance
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    avatar,
    created_at,
    updated_at,
    last_login
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'User'),
    null,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  insert into public.projects (
    user_id,
    name,
    description,
    color,
    icon
  )
  values (
    new.id,
    'My Workspace',
    'Default workspace created for your account.',
    '#3b82f6',
    'briefcase'
  );

  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = coalesce(new.email, email)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.sync_profile_email();

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users
  where id = (select auth.uid());
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
revoke all on function public.sync_profile_email() from public;
revoke all on function public.sync_profile_email() from anon;
revoke all on function public.sync_profile_email() from authenticated;
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
revoke all on function public.delete_my_account() from authenticated;
grant execute on function public.delete_my_account() to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.departments to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.activity to authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.activity enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "departments_select_owned_project" on public.departments;
create policy "departments_select_owned_project"
on public.departments
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = departments.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "departments_insert_owned_project" on public.departments;
create policy "departments_insert_owned_project"
on public.departments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = departments.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "departments_update_owned_project" on public.departments;
create policy "departments_update_owned_project"
on public.departments
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = departments.project_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = departments.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "departments_delete_owned_project" on public.departments;
create policy "departments_delete_owned_project"
on public.departments
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = departments.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "employees_select_owned_project" on public.employees;
create policy "employees_select_owned_project"
on public.employees
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = employees.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "employees_insert_owned_project" on public.employees;
create policy "employees_insert_owned_project"
on public.employees
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = employees.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "employees_update_owned_project" on public.employees;
create policy "employees_update_owned_project"
on public.employees
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = employees.project_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = employees.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "employees_delete_owned_project" on public.employees;
create policy "employees_delete_owned_project"
on public.employees
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = employees.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "attendance_select_owned_project" on public.attendance;
create policy "attendance_select_owned_project"
on public.attendance
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = attendance.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "attendance_insert_owned_project" on public.attendance;
create policy "attendance_insert_owned_project"
on public.attendance
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = attendance.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "attendance_update_owned_project" on public.attendance;
create policy "attendance_update_owned_project"
on public.attendance
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = attendance.project_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = attendance.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "attendance_delete_owned_project" on public.attendance;
create policy "attendance_delete_owned_project"
on public.attendance
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = attendance.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "activity_select_owned_project" on public.activity;
create policy "activity_select_owned_project"
on public.activity
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = activity.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "activity_insert_owned_project" on public.activity;
create policy "activity_insert_owned_project"
on public.activity
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = activity.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "activity_update_owned_project" on public.activity;
create policy "activity_update_owned_project"
on public.activity
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = activity.project_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = activity.project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "activity_delete_owned_project" on public.activity;
create policy "activity_delete_owned_project"
on public.activity
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = activity.project_id
      and p.user_id = (select auth.uid())
  )
);
