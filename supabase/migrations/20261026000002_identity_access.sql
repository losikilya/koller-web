begin;

create function public.ensure_profile() returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Unauthenticated' using errcode = '42501'; end if;
  insert into public.profiles(user_id) values (owner_id) on conflict (user_id) do nothing;
  perform 1 from public.profiles where user_id = owner_id and deletion_requested_at is null for update;
  if not found then raise exception 'Account unavailable' using errcode = '42501'; end if;
  insert into public.profile_privacy(user_id) values (owner_id) on conflict (user_id) do nothing;
  insert into public.user_preferences(user_id) values (owner_id) on conflict (user_id) do nothing;
end;
$$;

create function app_private.lock_owner() returns uuid
language plpgsql set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Unauthenticated' using errcode = '42501'; end if;
  perform 1 from public.profiles where user_id = owner_id and deletion_requested_at is null for update;
  if not found then raise exception 'Account unavailable; initialize profile first' using errcode = '42501'; end if;
  return owner_id;
end;
$$;
revoke all on function app_private.lock_owner() from public, anon, authenticated;

create function public.update_own_profile(p_patch jsonb, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner();
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb
    or exists (select 1 from jsonb_object_keys(p_patch) as k where k not in ('username', 'displayName', 'bio'))
    or exists (select 1 from jsonb_each(p_patch) as e where jsonb_typeof(e.value) <> 'string' and not (e.key = 'username' and e.value = 'null'::jsonb))
  then raise exception 'Invalid profile patch' using errcode = '22023'; end if;
  if p_patch ? 'displayName' and btrim(p_patch->>'displayName') = ''
    and exists (select 1 from public.profile_privacy where user_id = owner_id and visibility = 'public')
  then raise exception 'Public display name required' using errcode = '23514'; end if;
  update public.profiles set
    username = case when p_patch ? 'username' then p_patch->>'username' else username end,
    display_name = case when p_patch ? 'displayName' then p_patch->>'displayName' else display_name end,
    bio = case when p_patch ? 'bio' then p_patch->>'bio' else bio end
    where user_id = owner_id and revision = p_expected_revision;
  if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
end;
$$;

create function public.set_own_privacy(p_visibility text, p_discoverable boolean, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner();
begin
  if p_visibility = 'public' and not exists (select 1 from public.profiles where user_id = owner_id and btrim(display_name) <> '')
  then raise exception 'Public display name required' using errcode = '23514'; end if;
  update public.profile_privacy set visibility = p_visibility,
    discoverable = case when p_visibility = 'private' then false else p_discoverable end
    where user_id = owner_id and revision = p_expected_revision;
  if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
end;
$$;

create function public.set_own_preferences(p_locale text, p_theme text, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner();
begin
  update public.user_preferences set locale = p_locale, theme = p_theme
    where user_id = owner_id and revision = p_expected_revision;
  if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
end;
$$;

create function public.put_own_playground_data(p_app_key text, p_data_key text, p_payload jsonb, p_schema_version integer, p_expected_revision bigint default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner(); record_id uuid;
begin
  if p_expected_revision is null then
    if (select count(*) from public.playground_user_data where user_id = owner_id and app_key = p_app_key) >= 50
      or (select count(*) from public.playground_user_data where user_id = owner_id) >= 200
    then raise exception 'Quota exceeded' using errcode = '54000'; end if;
    insert into public.playground_user_data(user_id, app_key, data_key, payload, schema_version)
      values(owner_id, p_app_key, p_data_key, p_payload, p_schema_version) returning id into record_id;
  else
    update public.playground_user_data set payload = p_payload, schema_version = p_schema_version
      where user_id = owner_id and app_key = p_app_key and data_key = p_data_key and revision = p_expected_revision returning id into record_id;
    if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
  end if;
  return record_id;
end;
$$;

create function public.delete_own_playground_data(p_app_key text, p_data_key text, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := app_private.lock_owner();
begin
  delete from public.playground_user_data where user_id = owner_id and app_key = p_app_key and data_key = p_data_key and revision = p_expected_revision;
  if not found and exists(select 1 from public.playground_user_data where user_id = owner_id and app_key = p_app_key and data_key = p_data_key)
  then raise exception 'Revision conflict' using errcode = '40001'; end if;
end;
$$;

do $$ begin
  if not exists(select 1 from pg_roles where rolname = 'dance_profile_reader') then
    create role dance_profile_reader nologin noinherit nobypassrls;
  end if;
end $$;
grant dance_profile_reader to postgres;
grant usage, create on schema public to dance_profile_reader;
grant select(user_id, username, display_name, bio, deletion_requested_at) on public.profiles to dance_profile_reader;
grant select(user_id, visibility, discoverable) on public.profile_privacy to dance_profile_reader;
create policy profiles_projection_read on public.profiles for select to dance_profile_reader using (true);
create policy privacy_projection_read on public.profile_privacy for select to dance_profile_reader using (true);

create function public.get_public_profile(p_user_id uuid)
returns table(user_id uuid, username text, display_name text, bio text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.bio from public.profiles as p
  join public.profile_privacy as v on v.user_id = p.user_id
  where p.user_id = p_user_id and v.visibility = 'public' and p.deletion_requested_at is null;
$$;
create function public.list_public_profiles(p_after uuid default null, p_limit integer default 20)
returns table(user_id uuid, username text, display_name text, bio text)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.username, p.display_name, p.bio from public.profiles as p
  join public.profile_privacy as v on v.user_id = p.user_id
  where v.visibility = 'public' and v.discoverable and p.deletion_requested_at is null
    and (p_after is null or p.user_id > p_after)
  order by p.user_id limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;
alter function public.get_public_profile(uuid) owner to dance_profile_reader;
alter function public.list_public_profiles(uuid, integer) owner to dance_profile_reader;
revoke create on schema public from dance_profile_reader;

revoke all on function public.ensure_profile(), public.update_own_profile(jsonb, bigint), public.set_own_privacy(text, boolean, bigint),
  public.set_own_preferences(text, text, bigint), public.put_own_playground_data(text, text, jsonb, integer, bigint),
  public.delete_own_playground_data(text, text, bigint), public.get_public_profile(uuid), public.list_public_profiles(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.ensure_profile(), public.update_own_profile(jsonb, bigint), public.set_own_privacy(text, boolean, bigint),
  public.set_own_preferences(text, text, bigint), public.put_own_playground_data(text, text, jsonb, integer, bigint),
  public.delete_own_playground_data(text, text, bigint) to authenticated;
grant execute on function public.get_public_profile(uuid), public.list_public_profiles(uuid, integer) to anon, authenticated;

commit;
