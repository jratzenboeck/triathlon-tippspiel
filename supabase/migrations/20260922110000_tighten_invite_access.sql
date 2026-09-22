-- Invite tokens are unguessable capability URLs. Expose them only through a
-- token-scoped RPC instead of a blanket table read, so anonymous clients can
-- neither enumerate invites nor read emails/tokens.
create or replace function public.fetch_invite(invite_token text)
returns table (invite_id uuid, group_id uuid, group_name text, used boolean)
language sql stable security definer set search_path = public
as $$
  select i.id, i.group_id, g.name, i.used
  from public.invites i
  join public.groups g on g.id = i.group_id
  where i.token = invite_token
$$;

drop policy if exists "anyone can read invites by token" on public.invites;
drop policy if exists "invite holders can view invited groups" on public.groups;

create policy "members can view group invites"
  on public.invites for select using (
    exists (select 1 from public.group_members where group_id = invites.group_id and user_id = auth.uid())
  );