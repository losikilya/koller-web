begin;

create table app_private.avatar_operations (
  id uuid primary key,
  object_id uuid not null default gen_random_uuid() unique,
  owner_id uuid not null,
  kind text not null check (kind in ('upload', 'remove')),
  fingerprint text check (fingerprint is null or fingerprint ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('pending', 'ready', 'attached', 'cleanup', 'deleted', 'done')),
  created_at timestamptz not null default clock_timestamp(),
  reserved_at timestamptz,
  attached_revision bigint,
  deleted_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default clock_timestamp(),
  lease_token uuid,
  lease_until timestamptz,
  unique(owner_id, id),
  unique(owner_id, object_id),
  check (state <> 'deleted' or deleted_at is not null)
);
alter table app_private.avatar_operations enable row level security;
revoke all on app_private.avatar_operations from public, anon, authenticated, service_role;
create index avatar_owner_attempts on app_private.avatar_operations(owner_id, reserved_at);
create index avatar_cleanup_due on app_private.avatar_operations(state, next_attempt_at);
alter table public.profiles add column avatar_id uuid;
alter table public.profiles add constraint profiles_avatar_owner_fk
  foreign key (user_id, avatar_id) references app_private.avatar_operations(owner_id, object_id);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 1048576, array['image/webp']);
create policy avatar_no_raw_read on storage.objects as restrictive for select to anon, authenticated using (bucket_id <> 'profile-avatars');
create policy avatar_no_raw_insert on storage.objects as restrictive for insert to anon, authenticated with check (bucket_id <> 'profile-avatars');
create policy avatar_no_raw_update on storage.objects as restrictive for update to anon, authenticated using (bucket_id <> 'profile-avatars') with check (bucket_id <> 'profile-avatars');
create policy avatar_no_raw_delete on storage.objects as restrictive for delete to anon, authenticated using (bucket_id <> 'profile-avatars');

create function app_private.require_avatar_service() returns void
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Unavailable' using errcode = '42501'; end if;
end;
$$;
revoke all on function app_private.require_avatar_service() from public, anon, authenticated, service_role;

create function public.begin_own_avatar_upload(p_id uuid, p_fingerprint text) returns text
language plpgsql security definer set search_path = '' as $$
declare own uuid := app_private.lock_owner(); op app_private.avatar_operations%rowtype;
begin
  if p_id is null or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'Invalid operation' using errcode = '22023'; end if;
  select * into op from app_private.avatar_operations where id = p_id and owner_id = own for update;
  if found then
    if op.owner_id <> own or op.kind <> 'upload' or op.fingerprint is distinct from p_fingerprint then raise exception 'Unavailable' using errcode = '42501'; end if;
    if op.attached_revision is not null then return 'committed'; end if;
    if op.state in ('pending', 'ready') and op.created_at > clock_timestamp() - interval '24 hours' then return op.state; end if;
    raise exception 'Operation expired' using errcode = '22023';
  end if;
  if exists(select 1 from app_private.avatar_operations where id = p_id) then raise exception 'Unavailable' using errcode = '42501'; end if;
  if (select count(*) from app_private.avatar_operations where owner_id = own and reserved_at > clock_timestamp() - interval '1 minute') >= 5
    or (select count(*) from app_private.avatar_operations where owner_id = own and reserved_at > clock_timestamp() - interval '1 hour') >= 20
    or (select count(*) from app_private.avatar_operations where owner_id = own and state in ('pending', 'ready') and created_at > clock_timestamp() - interval '24 hours') >= 3
  then raise exception 'Upload limit' using errcode = '54000'; end if;
  insert into app_private.avatar_operations(id, owner_id, kind, fingerprint, state, reserved_at)
    values(p_id, own, 'upload', p_fingerprint, 'pending', clock_timestamp());
  return 'pending';
end;
$$;

create function public.avatar_service_ready(p_owner uuid, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare object_id uuid;
begin
  perform app_private.require_avatar_service();
  perform 1 from public.profiles where user_id = p_owner and deletion_requested_at is null for update;
  if not found then raise exception 'Unavailable' using errcode = '42501'; end if;
  select o.object_id into object_id from app_private.avatar_operations o where o.id = p_id and o.owner_id = p_owner for update;
  if not exists(select 1 from storage.objects where bucket_id = 'profile-avatars' and name = p_owner::text || '/' || object_id::text || '.webp')
    then raise exception 'Object unavailable' using errcode = '22023'; end if;
  update app_private.avatar_operations set state = 'ready'
    where id = p_id and owner_id = p_owner and kind = 'upload' and state in ('pending', 'ready')
      and attached_revision is null and created_at > clock_timestamp() - interval '24 hours';
  if not found then raise exception 'Operation unavailable' using errcode = '22023'; end if;
end;
$$;

create function public.attach_own_avatar(p_id uuid, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare own uuid := app_private.lock_owner(); op app_private.avatar_operations%rowtype; old_id uuid; new_revision bigint;
begin
  select * into op from app_private.avatar_operations where id = p_id and owner_id = own for update;
  if not found or op.owner_id <> own or op.kind <> 'upload' then raise exception 'Unavailable' using errcode = '42501'; end if;
  if op.attached_revision is not null then return; end if;
  if op.state <> 'ready' or op.created_at <= clock_timestamp() - interval '24 hours' then raise exception 'Operation unavailable' using errcode = '22023'; end if;
  select avatar_id into old_id from public.profiles where user_id = own;
  update public.profiles set avatar_id = op.object_id where user_id = own and revision = p_expected_revision returning revision into new_revision;
  if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
  update app_private.avatar_operations set state = 'attached', attached_revision = new_revision where id = p_id;
  update app_private.avatar_operations set state = 'cleanup', next_attempt_at = clock_timestamp(), lease_token = null, lease_until = null
    where object_id = old_id and owner_id = own and id <> p_id;
end;
$$;

create function public.remove_own_avatar(p_id uuid, p_expected_revision bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare own uuid := app_private.lock_owner(); op app_private.avatar_operations%rowtype; old_id uuid; new_revision bigint;
begin
  if p_id is null then raise exception 'Invalid operation' using errcode = '22023'; end if;
  select * into op from app_private.avatar_operations where id = p_id and owner_id = own for update;
  if found then
    if op.owner_id <> own or op.kind <> 'remove' then raise exception 'Unavailable' using errcode = '42501'; end if;
    if op.attached_revision is not null then return; end if;
  end if;
  if exists(select 1 from app_private.avatar_operations where id = p_id) then raise exception 'Unavailable' using errcode = '42501'; end if;
  if (select count(*) from app_private.avatar_operations where owner_id = own and reserved_at > clock_timestamp() - interval '1 minute') >= 5
    or (select count(*) from app_private.avatar_operations where owner_id = own and reserved_at > clock_timestamp() - interval '1 hour') >= 20
  then raise exception 'Avatar limit' using errcode = '54000'; end if;
  select avatar_id into old_id from public.profiles where user_id = own;
  update public.profiles set avatar_id = null where user_id = own and revision = p_expected_revision returning revision into new_revision;
  if not found then raise exception 'Revision conflict' using errcode = '40001'; end if;
  insert into app_private.avatar_operations(id, owner_id, kind, state, attached_revision, deleted_at, reserved_at)
    values(p_id, own, 'remove', 'done', new_revision, clock_timestamp(), clock_timestamp());
  update app_private.avatar_operations set state = 'cleanup', next_attempt_at = clock_timestamp(), lease_token = null, lease_until = null
    where object_id = old_id and owner_id = own;
end;
$$;

create function public.avatar_service_abandon(p_owner uuid, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.require_avatar_service();
  perform 1 from public.profiles where user_id = p_owner for update;
  perform 1 from app_private.avatar_operations where id = p_id and owner_id = p_owner for update;
  if exists(select 1 from public.profiles where user_id = p_owner and avatar_id = (select object_id from app_private.avatar_operations where id = p_id and owner_id = p_owner)) then return; end if;
  update app_private.avatar_operations set state = 'cleanup', next_attempt_at = clock_timestamp()
    where id = p_id and owner_id = p_owner and kind = 'upload' and state in ('pending', 'ready') and attached_revision is null;
end;
$$;

create function public.get_public_avatar_id(p_user_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select p.avatar_id from public.profiles p join public.profile_privacy v on v.user_id = p.user_id
  where p.user_id = p_user_id and p.completed_at is not null and p.deletion_requested_at is null and v.visibility = 'public';
$$;
grant select(avatar_id) on public.profiles to dance_profile_reader;
grant create on schema public to dance_profile_reader;
alter function public.get_public_avatar_id(uuid) owner to dance_profile_reader;
revoke create on schema public from dance_profile_reader;

create function public.avatar_service_resolve(p_id uuid, p_viewer uuid default null)
returns table(owner_id uuid, object_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.require_avatar_service();
  return query select p.user_id, p.avatar_id from public.profiles p
    join public.profile_privacy v on v.user_id = p.user_id
    join app_private.avatar_operations o on o.owner_id = p.user_id and o.object_id = p.avatar_id
    where p.avatar_id = p_id and p.deletion_requested_at is null and o.kind = 'upload' and o.state = 'attached'
      and (p.user_id = p_viewer or (p.completed_at is not null and v.visibility = 'public'));
end;
$$;

create function public.avatar_service_reconcile() returns void
language plpgsql security definer set search_path = '' as $$
declare item record; own uuid; orphan_object_id uuid; current_id uuid; op app_private.avatar_operations%rowtype;
begin
  perform app_private.require_avatar_service();
  -- Metadata is inspected only; physical bytes are removed through Storage API.
  for item in select s.name, s.created_at from storage.objects s where s.bucket_id = 'profile-avatars'
    and s.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
    and not exists(select 1 from app_private.avatar_operations o where o.object_id::text = split_part(split_part(s.name, '/', 2), '.', 1))
    order by s.created_at limit 100
  loop
    own := split_part(item.name, '/', 1)::uuid;
    orphan_object_id := split_part(split_part(item.name, '/', 2), '.', 1)::uuid;
    select p.avatar_id into current_id from public.profiles p where p.user_id = own for update skip locked;
    if not found and exists(select 1 from public.profiles where user_id = own) then continue; end if;
    if current_id = orphan_object_id then continue; end if;
    insert into app_private.avatar_operations(id, object_id, owner_id, kind, state, created_at)
      values(gen_random_uuid(), orphan_object_id, own, 'upload', 'cleanup', item.created_at) on conflict(object_id) do nothing;
  end loop;
  for item in select id, owner_id from app_private.avatar_operations
    where state in ('deleted', 'done') and deleted_at <= clock_timestamp() - interval '7 days' order by deleted_at limit 100
  loop
    select p.avatar_id into current_id from public.profiles p where p.user_id = item.owner_id for update skip locked;
    if not found and exists(select 1 from public.profiles where user_id = item.owner_id) then continue; end if;
    select * into op from app_private.avatar_operations where id = item.id for update skip locked;
    if not found or current_id = op.object_id then continue; end if;
    if op.state in ('deleted', 'done') and op.deleted_at <= clock_timestamp() - interval '7 days'
      and not exists(select 1 from storage.objects where bucket_id = 'profile-avatars' and name = op.owner_id::text || '/' || op.object_id::text || '.webp')
    then delete from app_private.avatar_operations where id = op.id; end if;
  end loop;
end;
$$;

create function public.avatar_service_claim_cleanup(p_limit integer default 20)
returns table(id uuid, owner_id uuid, lease_token uuid, object_id uuid)
language plpgsql security definer set search_path = '' as $$
declare item record; op app_private.avatar_operations%rowtype; current_id uuid; token uuid; claimed integer := 0;
begin
  perform app_private.require_avatar_service();
  for item in select o.id, o.owner_id from app_private.avatar_operations o where o.kind = 'upload' and (
    (o.state = 'cleanup' and o.next_attempt_at <= clock_timestamp() and (o.lease_until is null or o.lease_until <= clock_timestamp()))
    or (o.state in ('pending', 'ready') and o.created_at <= clock_timestamp() - interval '24 hours')
    or (o.state = 'attached' and not exists(select 1 from public.profiles p where p.user_id = o.owner_id and p.avatar_id = o.object_id))
    or (o.state = 'deleted' and exists(select 1 from storage.objects s where s.bucket_id = 'profile-avatars' and s.name = o.owner_id::text || '/' || o.object_id::text || '.webp')))
    order by o.next_attempt_at, o.id limit 200
  loop
    select p.avatar_id into current_id from public.profiles p where p.user_id = item.owner_id for update skip locked;
    if not found and exists(select 1 from public.profiles where user_id = item.owner_id) then continue; end if;
    select o.* into op from app_private.avatar_operations o where o.id = item.id for update skip locked;
    if not found or current_id = op.object_id then continue; end if;
    if op.state = 'cleanup' and (op.next_attempt_at > clock_timestamp() or op.lease_until > clock_timestamp()) then continue; end if;
    if op.state in ('pending', 'ready') and op.created_at > clock_timestamp() - interval '24 hours' then continue; end if;
    if op.state not in ('cleanup', 'pending', 'ready', 'attached', 'deleted') then continue; end if;
    token := gen_random_uuid();
    update app_private.avatar_operations o set state = 'cleanup', deleted_at = null, lease_token = token, lease_until = clock_timestamp() + interval '2 minutes' where o.id = op.id;
    return query select op.id, op.owner_id, token, op.object_id;
    claimed := claimed + 1;
    exit when claimed >= greatest(1, least(coalesce(p_limit, 20), 50));
  end loop;
end;
$$;

create function public.avatar_service_cleanup_authorized(p_id uuid, p_lease uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  perform app_private.require_avatar_service();
  return exists(select 1 from app_private.avatar_operations o where o.id = p_id and o.state = 'cleanup' and o.lease_token = p_lease and o.lease_until > clock_timestamp()
    and not exists(select 1 from public.profiles p where p.avatar_id = o.object_id));
end;
$$;

create function public.avatar_service_finish_cleanup(p_id uuid, p_lease uuid, p_success boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare own uuid; op app_private.avatar_operations%rowtype;
begin
  perform app_private.require_avatar_service();
  select owner_id into own from app_private.avatar_operations where id = p_id;
  perform 1 from public.profiles where user_id = own for update;
  select * into op from app_private.avatar_operations where id = p_id for update;
  if not found or op.state <> 'cleanup' or p_lease is null or op.lease_token is null or op.lease_until is null
    or op.lease_token is distinct from p_lease or op.lease_until <= clock_timestamp()
    or exists(select 1 from public.profiles where avatar_id = op.object_id) then return false; end if;
  if p_success is true and not exists(select 1 from storage.objects where bucket_id = 'profile-avatars' and name = op.owner_id::text || '/' || op.object_id::text || '.webp') then
    update app_private.avatar_operations set state = 'deleted', deleted_at = clock_timestamp(), lease_token = null, lease_until = null where id = p_id;
  else
    update app_private.avatar_operations set attempts = attempts + 1,
      next_attempt_at = clock_timestamp() + make_interval(secs => least(3600, 10 * power(2, least(attempts, 8))::integer)),
      lease_token = null, lease_until = null where id = p_id;
  end if;
  return true;
end;
$$;

create function public.avatar_service_upload_object(p_owner uuid, p_id uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare object_id uuid;
begin
  perform app_private.require_avatar_service();
  select o.object_id into object_id from app_private.avatar_operations o join public.profiles p on p.user_id = o.owner_id
    where o.id = p_id and o.owner_id = p_owner and o.state in ('pending', 'ready') and o.created_at > clock_timestamp() - interval '24 hours' and p.deletion_requested_at is null;
  if not found then raise exception 'Operation unavailable' using errcode = '22023'; end if;
  return object_id;
end;
$$;

revoke all on function public.begin_own_avatar_upload(uuid,text), public.attach_own_avatar(uuid,bigint), public.remove_own_avatar(uuid,bigint), public.get_public_avatar_id(uuid),
  public.avatar_service_ready(uuid,uuid), public.avatar_service_abandon(uuid,uuid), public.avatar_service_resolve(uuid,uuid), public.avatar_service_reconcile(),
  public.avatar_service_claim_cleanup(integer), public.avatar_service_cleanup_authorized(uuid,uuid), public.avatar_service_finish_cleanup(uuid,uuid,boolean), public.avatar_service_upload_object(uuid,uuid) from public, anon, authenticated;
grant execute on function public.begin_own_avatar_upload(uuid,text), public.attach_own_avatar(uuid,bigint), public.remove_own_avatar(uuid,bigint) to authenticated;
grant execute on function public.get_public_avatar_id(uuid) to anon, authenticated;
grant execute on function public.avatar_service_ready(uuid,uuid), public.avatar_service_abandon(uuid,uuid), public.avatar_service_resolve(uuid,uuid), public.avatar_service_reconcile(),
  public.avatar_service_claim_cleanup(integer), public.avatar_service_cleanup_authorized(uuid,uuid), public.avatar_service_finish_cleanup(uuid,uuid,boolean), public.avatar_service_upload_object(uuid,uuid) to service_role;

commit;
