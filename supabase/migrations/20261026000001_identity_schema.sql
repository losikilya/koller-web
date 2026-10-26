begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text not null default '',
  avatar_path text,
  bio text not null default '',
  revision bigint not null default 1 check (revision > 0),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_valid check (username is null or (
    username ~ '^[a-z][a-z0-9_]{2,29}$' and username not in ('admin', 'support', 'system')
  )),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_bio_length check (char_length(bio) <= 500),
  constraint profiles_avatar_path_length check (avatar_path is null or char_length(avatar_path) <= 512)
);
create unique index profiles_username_ci on public.profiles (lower(username)) where username is not null;

create table public.profile_privacy (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  discoverable boolean not null default false,
  show_activity boolean not null default false check (show_activity = false),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint private_not_discoverable check (visibility = 'public' or discoverable = false)
);
create index profile_privacy_discovery on public.profile_privacy(user_id)
  where visibility = 'public' and discoverable = true;

create table public.user_preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  locale text not null default 'en' check (locale in ('en', 'ru')),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

create table public.playground_user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  app_key text not null check (app_key = 'practice-timer'),
  data_key text not null check (data_key ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1 check (schema_version = 1),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, app_key, data_key),
  constraint playground_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint playground_payload_bytes check (octet_length(payload::text) <= 16384),
  constraint playground_payload_v1 check (payload = '{}'::jsonb)
);
create index playground_owner_app_updated on public.playground_user_data(user_id, app_key, updated_at desc, id desc);

create function app_private.touch_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  new.revision := old.revision + 1;
  return new;
end;
$$;
revoke all on function app_private.touch_revision() from public, anon, authenticated;
create trigger profiles_updated before update on public.profiles for each row execute function app_private.touch_revision();
create trigger privacy_updated before update on public.profile_privacy for each row execute function app_private.touch_revision();
create trigger preferences_updated before update on public.user_preferences for each row execute function app_private.touch_revision();
create trigger playground_updated before update on public.playground_user_data for each row execute function app_private.touch_revision();

alter table public.profiles enable row level security;
alter table public.profile_privacy enable row level security;
alter table public.user_preferences enable row level security;
alter table public.playground_user_data enable row level security;
revoke all on public.profiles, public.profile_privacy, public.user_preferences, public.playground_user_data from public, anon, authenticated;
grant select on public.profiles, public.profile_privacy, public.user_preferences, public.playground_user_data to authenticated;
create policy profiles_owner_read on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy privacy_owner_read on public.profile_privacy for select to authenticated using ((select auth.uid()) = user_id);
create policy preferences_owner_read on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy playground_owner_read on public.playground_user_data for select to authenticated using ((select auth.uid()) = user_id);

commit;
