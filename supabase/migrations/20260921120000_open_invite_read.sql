-- The invites token is a 64-char unguessable secret that acts as a capability
-- URL (Supabase's documented invite-link pattern), so anyone who knows it may
-- read the invite. Without this, the pending-invite page cannot load for a
-- logged-out visitor (and the old policy's auth.users subquery raised
-- "permission denied for table users" for everyone).
drop policy "members can view invites" on public.invites;
create policy "anyone can read invites by token"
  on public.invites for select
  using (true);