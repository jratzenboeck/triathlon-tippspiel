create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_by uuid not null references public.profiles(id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  email text not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.races (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  date date not null,
  tier text,
  brand text,
  distance text,
  location text,
  country text,
  prize_money text,
  divisions jsonb,
  results_url text,
  participants_url text,
  crawled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  full_name text not null,
  country text,
  division text not null check (division in ('FPRO', 'MPRO')),
  pto_points numeric,
  ranking_position integer,
  created_at timestamptz not null default now()
);

create table public.race_results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id),
  division text not null check (division in ('FPRO', 'MPRO')),
  position integer,
  finish_time text,
  pto_points numeric,
  status text not null default 'finished' check (status in ('finished', 'dnf', 'dns')),
  created_at timestamptz not null default now(),
  unique (race_id, athlete_id, division)
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  race_id uuid not null references public.races(id),
  division text not null check (division in ('FPRO', 'MPRO')),
  athlete_id uuid not null references public.athletes(id),
  predicted_position integer not null check (predicted_position between 1 and 5),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, race_id, division, predicted_position),
  unique (user_id, race_id, division, athlete_id)
);

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invites enable row level security;
alter table public.races enable row level security;
alter table public.athletes enable row level security;
alter table public.race_results enable row level security;
alter table public.bets enable row level security;

create policy "anyone can read profiles"
  on public.profiles for select using (true);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "authenticated users can create groups"
  on public.groups for insert with check (auth.role() = 'authenticated');

create policy "members can view groups"
  on public.groups for select using (
    exists (select 1 from public.group_members where group_id = id and user_id = auth.uid())
    or created_by = auth.uid()
  );

create policy "authenticated users can create invites"
  on public.invites for insert with check (
    auth.role() = 'authenticated'
    and exists (select 1 from public.group_members where group_id = invites.group_id and user_id = auth.uid())
  );

create policy "members can view invites"
  on public.invites for select using (
    exists (select 1 from public.group_members where group_id = invites.group_id and user_id = auth.uid())
    or email = (select email from auth.users where id = auth.uid())
  );

create policy "authenticated users can read races"
  on public.races for select using (auth.role() = 'authenticated');

create policy "service role can manage races"
  on public.races for all using (true);

create policy "authenticated users can read athletes"
  on public.athletes for select using (auth.role() = 'authenticated');

create policy "service role can manage athletes"
  on public.athletes for all using (true);

create policy "authenticated users can read race results"
  on public.race_results for select using (auth.role() = 'authenticated');

create policy "service role can manage race results"
  on public.race_results for all using (true);

create policy "users can read own bets"
  on public.bets for select using (auth.uid() = user_id);

create policy "users can read bets in their groups"
  on public.bets for select using (
    exists (
      select 1 from public.group_members gm
      where gm.user_id = auth.uid()
      and exists (select 1 from public.group_members gm2 where gm2.group_id = gm.group_id and gm2.user_id = bets.user_id)
    )
  );

create policy "users can insert own bets"
  on public.bets for insert with check (auth.uid() = user_id);

create policy "users can update own bets"
  on public.bets for update using (auth.uid() = user_id);

create policy "users can delete own bets"
  on public.bets for delete using (auth.uid() = user_id);

create policy "service role can update bet points"
  on public.bets for update using (true);

create policy "members can view group members"
  on public.group_members for select using (user_id = auth.uid());

create policy "authenticated users can insert group members"
  on public.group_members for insert with check (auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
