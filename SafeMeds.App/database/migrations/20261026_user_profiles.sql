create table if not exists public.user_profiles (
  firebase_uid text primary key,
  role text not null check (role in ('consumer', 'owner')),
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  email text not null,
  phone text,
  pharmacy_name text,
  job_title text,
  branch text,
  pharmacy_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_profile_required_fields check (
    role <> 'owner' or (
      nullif(trim(pharmacy_name), '') is not null
      and nullif(trim(job_title), '') is not null
    )
  )
);

alter table public.user_profiles enable row level security;
-- No browser-facing policies: the server verifies Firebase ID tokens and accesses this table with its private Supabase service key.