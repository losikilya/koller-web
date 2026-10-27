begin;

-- Acknowledgment reports confirmed deletion, not merely accepted retry bookkeeping.
create or replace function public.avatar_service_finish_cleanup(p_id uuid, p_lease uuid, p_success boolean) returns boolean
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
    return true;
  end if;
  update app_private.avatar_operations set attempts = attempts + 1,
    next_attempt_at = clock_timestamp() + make_interval(secs => least(3600, 10 * power(2, least(attempts, 8))::integer)),
    lease_token = null, lease_until = null where id = p_id;
  return false;
end;
$$;

commit;
