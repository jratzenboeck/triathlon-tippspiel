alter table public.group_members
  add column is_admin boolean not null default false;

update public.group_members gm
set is_admin = true
from public.groups g
where g.id = gm.group_id
  and g.created_by = gm.user_id;

create or replace function public.is_group_member(check_group_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = check_group_id
      and user_id = check_user_id
  );
$$;

grant execute on function public.is_group_member(uuid, uuid) to authenticated;

drop policy "members can view group members" on public.group_members;

create policy "members can view group members"
  on public.group_members for select using (
    public.is_group_member(group_members.group_id, auth.uid())
  );

drop policy "authenticated users can create invites" on public.invites;

create policy "group admins can create invites"
  on public.invites for insert with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = invites.group_id
        and gm.user_id = auth.uid()
        and gm.is_admin
    )
  );

drop policy "authenticated users can insert group members" on public.group_members;

create policy "group creators can join their own groups"
  on public.group_members for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and g.created_by = auth.uid()
    )
  );

create or replace function public.grant_group_admin(group_id uuid, user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = grant_group_admin.group_id
      and gm.user_id = auth.uid()
      and gm.is_admin
  ) then
    raise exception 'Only group admins can grant admin permission';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = grant_group_admin.group_id
      and gm.user_id = grant_group_admin.user_id
  ) then
    raise exception 'Target user is not a member of this group';
  end if;

  update public.group_members gm
  set is_admin = true
  where gm.group_id = grant_group_admin.group_id
    and gm.user_id = grant_group_admin.user_id;
end;
$$;

grant execute on function public.grant_group_admin(uuid, uuid) to authenticated;
