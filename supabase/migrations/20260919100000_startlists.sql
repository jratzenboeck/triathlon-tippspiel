alter table public.races
  add column startlist_crawled_at timestamptz;

create table public.race_startlists (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete set null,
  division text not null check (division in ('FPRO', 'MPRO')),
  bib text not null,
  first_name text not null,
  last_name text not null,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (race_id, division, bib)
);

alter table public.race_startlists enable row level security;

create policy "authenticated users can read startlists"
  on public.race_startlists for select using (auth.role() = 'authenticated');

create policy "service role can manage startlists"
  on public.race_startlists for all using (true);

create index race_startlists_race_id_idx on public.race_startlists (race_id);
create index race_startlists_athlete_id_idx on public.race_startlists (athlete_id);