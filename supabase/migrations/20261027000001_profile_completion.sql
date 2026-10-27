begin;

-- Existing records require a new explicit owner completion action; no inference/backfill.
alter table public.profiles add column completed_at timestamptz;
alter table public.profiles add constraint completed_profile_required_fields check (
  completed_at is null or (
    username is not null and
    btrim(display_name, U&'\0009\000A\000B\000C\000D\0020\0085\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000') <> ''
  )
);

create or replace function public.ensure_profile() returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); completion timestamptz;
begin
  if owner_id is null then raise exception 'Unauthenticated' using errcode = '42501'; end if;
  insert into public.profiles(user_id) values(owner_id) on conflict(user_id) do nothing;
  select completed_at into completion from public.profiles where user_id = owner_id and deletion_requested_at is null for update;
  if not found then raise exception 'Account unavailable' using errcode = '42501'; end if;
  insert into public.profile_privacy(user_id, visibility) values(owner_id, case when completion is null then 'private' else 'public' end) on conflict(user_id) do nothing;
  insert into public.user_preferences(user_id) values(owner_id) on conflict(user_id) do nothing;
end;
$$;

create function public.complete_own_profile(p_patch jsonb, p_expected_profile_revision bigint, p_expected_privacy_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner(); current_privacy bigint;
begin
  select revision into current_privacy from public.profile_privacy where user_id = owner_id for update;
  if not found then raise exception 'Initialize profile first' using errcode = '42501'; end if;
  if current_privacy is distinct from p_expected_privacy_revision
    or not exists(select 1 from public.profiles where user_id = owner_id and revision = p_expected_profile_revision)
  then raise exception 'Revision conflict' using errcode = '40001'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object'
    or not (p_patch ? 'username' and p_patch ? 'displayName')
    or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('username','displayName','bio'))
    or exists(select 1 from jsonb_each(p_patch) e where jsonb_typeof(e.value) <> 'string')
  then raise exception 'Invalid completion patch' using errcode = '22023'; end if;
  update public.profiles set username = p_patch->>'username', display_name = p_patch->>'displayName',
    bio = case when p_patch ? 'bio' then p_patch->>'bio' else bio end,
    completed_at = coalesce(completed_at, clock_timestamp()) where user_id = owner_id;
  update public.profile_privacy set visibility = 'public', discoverable = false where user_id = owner_id;
end;
$$;
revoke all on function public.complete_own_profile(jsonb,bigint,bigint) from public,anon,authenticated;
grant execute on function public.complete_own_profile(jsonb,bigint,bigint) to authenticated;

create or replace function public.set_own_privacy(p_visibility text, p_discoverable boolean, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner(); completed boolean;
begin
  select completed_at is not null into completed from public.profiles where user_id = owner_id;
  if (p_visibility = 'public') is distinct from completed
  then raise exception 'Completion visibility policy' using errcode = '23514'; end if;
  update public.profile_privacy set visibility = p_visibility,
    discoverable = case when p_visibility = 'private' then false else p_discoverable end
    where user_id = owner_id and revision = p_expected_revision;
  if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
end;
$$;

create function app_private.check_completed_visibility() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.profiles p join public.profile_privacy v on v.user_id = p.user_id
    where p.user_id = new.user_id and p.completed_at is not null and v.visibility <> 'public')
  then raise exception 'Completed profiles are public' using errcode = '23514'; end if;
  return null;
end;
$$;
revoke all on function app_private.check_completed_visibility() from public,anon,authenticated;
create constraint trigger completed_profile_visibility after insert or update on public.profiles
  deferrable initially deferred for each row execute function app_private.check_completed_visibility();
create constraint trigger completed_privacy_visibility after insert or update on public.profile_privacy
  deferrable initially deferred for each row execute function app_private.check_completed_visibility();

create function app_private.require_completed_owner() returns uuid
language plpgsql set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner();
begin
  if not exists(select 1 from public.profiles where user_id = owner_id and completed_at is not null)
  then raise exception 'Profile incomplete' using errcode = '42501'; end if;
  return owner_id;
end;
$$;
revoke all on function app_private.require_completed_owner() from public,anon,authenticated;

create or replace function public.put_own_playground_data(p_app_key text, p_data_key text, p_payload jsonb, p_schema_version integer, p_expected_revision bigint default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.require_completed_owner(); record_id uuid;
begin
  if p_expected_revision is null then
    if (select count(*) from public.playground_user_data where user_id = owner_id and app_key = p_app_key) >= 50
      or (select count(*) from public.playground_user_data where user_id = owner_id) >= 200
    then raise exception 'Quota exceeded' using errcode = '54000'; end if;
    insert into public.playground_user_data(user_id,app_key,data_key,payload,schema_version)
      values(owner_id,p_app_key,p_data_key,p_payload,p_schema_version) returning id into record_id;
  else
    update public.playground_user_data set payload = p_payload, schema_version = p_schema_version
      where user_id = owner_id and app_key = p_app_key and data_key = p_data_key and revision = p_expected_revision returning id into record_id;
    if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
  end if;
  return record_id;
end;
$$;
create or replace function public.delete_own_playground_data(p_app_key text,p_data_key text,p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.require_completed_owner();
begin
  delete from public.playground_user_data where user_id = owner_id and app_key = p_app_key and data_key = p_data_key and revision = p_expected_revision;
  if not found and exists(select 1 from public.playground_user_data where user_id = owner_id and app_key = p_app_key and data_key = p_data_key)
  then raise exception 'Revision conflict' using errcode = '40001'; end if;
end;
$$;

grant select(completed_at) on public.profiles to dance_profile_reader;
create or replace function public.get_public_profile(p_user_id uuid)
returns table(user_id uuid,username text,display_name text,bio text)
language sql stable security definer set search_path = '' as $$
  select p.user_id,p.username,p.display_name,p.bio from public.profiles p
  join public.profile_privacy v on v.user_id = p.user_id
  where p.user_id = p_user_id and p.completed_at is not null and v.visibility = 'public' and p.deletion_requested_at is null;
$$;
create or replace function public.list_public_profiles(p_after uuid default null,p_limit integer default 20)
returns table(user_id uuid,username text,display_name text,bio text)
language sql stable security definer set search_path = '' as $$
  select p.user_id,p.username,p.display_name,p.bio from public.profiles p
  join public.profile_privacy v on v.user_id = p.user_id
  where p.completed_at is not null and v.visibility = 'public' and v.discoverable and p.deletion_requested_at is null
    and (p_after is null or p.user_id > p_after)
  order by p.user_id limit greatest(1,least(coalesce(p_limit,20),50));
$$;
grant create on schema public to dance_profile_reader;
create function public.get_public_profile_by_username(p_username text)
returns table(user_id uuid,username text,display_name text,bio text)
language sql stable security definer set search_path = '' as $$
  select p.user_id,p.username,p.display_name,p.bio from public.profiles p
  join public.profile_privacy v on v.user_id = p.user_id
  where p.username = lower(p_username) and p.completed_at is not null and v.visibility = 'public' and p.deletion_requested_at is null;
$$;
alter function public.get_public_profile_by_username(text) owner to dance_profile_reader;
revoke create on schema public from dance_profile_reader;
revoke all on function public.get_public_profile_by_username(text) from public,anon,authenticated;
grant execute on function public.get_public_profile_by_username(text) to anon,authenticated;

commit;
