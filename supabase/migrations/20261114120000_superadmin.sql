-- Super admins can hand-edit race results, start lists and players' bets from the
-- admin UI. The role lives in its own table, not on profiles: players may update their
-- own profile row, so a flag there could be switched on by anyone. Nothing but SQL run
-- with the service role (or the dashboard) can write this table.
--
--   insert into public.superadmins (user_id) values ('<auth user id>');
create table public.superadmins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.superadmins enable row level security;

create policy "users can see whether they are a superadmin"
  on public.superadmins for select using (auth.uid() = user_id);

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.superadmins where user_id = auth.uid());
$$;

grant execute on function public.is_superadmin() to authenticated;

-- The "service role can ..." policies below were `using (true)` without a role check,
-- which let every client write these tables. The service role bypasses RLS anyway, so
-- the crawlers and score-race keep working without them.
drop policy "service role can manage races" on public.races;
drop policy "service role can manage athletes" on public.athletes;
drop policy "service role can manage race results" on public.race_results;
drop policy "service role can manage startlists" on public.race_startlists;
drop policy "service role can update bet points" on public.bets;

create policy "superadmins can update races"
  on public.races for update using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmins can manage race results"
  on public.race_results for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmins can manage startlists"
  on public.race_startlists for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmins can insert bets"
  on public.bets for insert with check (public.is_superadmin());

create policy "superadmins can update bets"
  on public.bets for update using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmins can delete bets"
  on public.bets for delete using (public.is_superadmin());

-- crawl-startlists replaces a race's start list on every run. Once a super admin has
-- edited it by hand, the crawler leaves that race alone until this is cleared again.
alter table public.races add column startlist_edited_at timestamptz;

-- Admin edits replace a whole division at once (one race's results or start list, one
-- player's picks). Doing that as a delete plus an insert from the browser could leave a
-- division empty when the insert fails, so each replace runs inside one function call.
-- They run as the caller: the superadmin policies above still decide who may write.
create or replace function public.admin_replace_race_results(
  p_race_id uuid, p_division text, p_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can edit race results';
  end if;

  delete from public.race_results where race_id = p_race_id and division = p_division;

  insert into public.race_results (race_id, athlete_id, division, position, finish_time, status, pto_points)
  select p_race_id, x.athlete_id, p_division, x.position, nullif(x.finish_time, ''),
         coalesce(x.status, 'finished'), x.pto_points
  from jsonb_to_recordset(p_rows)
    as x(athlete_id uuid, position integer, finish_time text, status text, pto_points numeric);

  -- Counts as having results: the crawler stops looking for them and score-race picks
  -- the race up.
  update public.races
  set results_crawled_at = coalesce(results_crawled_at, now())
  where id = p_race_id;
end;
$$;

create or replace function public.admin_replace_startlist(
  p_race_id uuid, p_division text, p_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can edit start lists';
  end if;

  delete from public.race_startlists where race_id = p_race_id and division = p_division;

  insert into public.race_startlists (race_id, athlete_id, division, bib)
  select p_race_id, x.athlete_id, p_division, nullif(x.bib, '')
  from jsonb_to_recordset(p_rows) as x(athlete_id uuid, bib text);

  update public.races set startlist_edited_at = now() where id = p_race_id;
end;
$$;

create or replace function public.admin_replace_bets(
  p_user_id uuid, p_race_id uuid, p_division text, p_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can edit bets';
  end if;

  delete from public.bets
  where user_id = p_user_id and race_id = p_race_id and division = p_division;

  insert into public.bets (user_id, race_id, division, athlete_id, predicted_position, points)
  select p_user_id, p_race_id, p_division, x.athlete_id, x.predicted_position, coalesce(x.points, 0)
  from jsonb_to_recordset(p_rows) as x(athlete_id uuid, predicted_position integer, points integer);
end;
$$;

create or replace function public.admin_set_bet_points(p_points jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can change bet points';
  end if;

  update public.bets b
  set points = x.points
  from jsonb_to_recordset(p_points) as x(id uuid, points integer)
  where b.id = x.id;
end;
$$;

grant execute on function public.admin_replace_race_results(uuid, text, jsonb) to authenticated;
grant execute on function public.admin_replace_startlist(uuid, text, jsonb) to authenticated;
grant execute on function public.admin_replace_bets(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.admin_set_bet_points(jsonb) to authenticated;
