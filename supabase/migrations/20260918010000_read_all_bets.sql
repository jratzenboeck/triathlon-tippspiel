create policy "authenticated users can read all bets"
  on public.bets for select using (auth.role() = 'authenticated');