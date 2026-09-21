-- Seed fixtures for local development and e2e testing.
--
-- Deterministic baseline data, applied by `supabase db reset` (see [db.seed] in
-- supabase/config.toml) or manually via psql. Safe to re-run any time:
-- everything is truncated and re-inserted.
--
-- Two login users exist (password for both: password123):
--   alice@example.com  (display name "Alice" – creator/admin of Test Group)
--   bob@example.com    (display name "Bob" – member of Test Group)
--
-- Race dates are relative to the current date so the dashboard always shows
-- both "previous" and "upcoming" sections.

create extension if not exists pgcrypto;

begin;

truncate table
  public.bets,
  public.race_results,
  public.race_startlists,
  public.invites,
  public.groups,
  public.group_members,
  public.races,
  public.athletes,
  public.profiles
  cascade;

truncate table auth.identities, auth.users cascade;

-- auth users (the handle_new_user trigger creates the matching public.profiles rows)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'alice@example.com',
    crypt('password123', gen_salt('bf', 10)), now(),
    '', '', '', '', '', '', '', '',
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Alice", "language": "en"}', now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'bob@example.com',
    crypt('password123', gen_salt('bf', 10)), now(),
    '', '', '', '', '', '', '', '',
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Bob", "language": "en"}', now(), now()
  );

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    jsonb_build_object(
      'sub', '10000000-0000-0000-0000-000000000001',
      'email', 'alice@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    jsonb_build_object(
      'sub', '10000000-0000-0000-0000-000000000002',
      'email', 'bob@example.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

-- athletes
insert into public.athletes (id, slug, first_name, last_name, full_name, country, division, pto_points, ranking_position)
values
  ('30000000-0000-0000-0000-000000000001', 'max-keller',     'Max',    'Keller',    'Max Keller',    'DEU', 'MPRO', 4800, 3),
  ('30000000-0000-0000-0000-000000000002', 'jonas-weber',    'Jonas',  'Weber',     'Jonas Weber',   'DEU', 'MPRO', 4600, 5),
  ('30000000-0000-0000-0000-000000000003', 'liam-oconnor',   'Liam',   'O''Connor', 'Liam O''Connor', 'IRL', 'MPRO', 4400, 7),
  ('30000000-0000-0000-0000-000000000004', 'noah-van-dijk',  'Noah',   'Van Dijk',  'Noah Van Dijk', 'NLD', 'MPRO', 4200, 9),
  ('30000000-0000-0000-0000-000000000011', 'anna-schmidt',   'Anna',   'Schmidt',   'Anna Schmidt',  'DEU', 'FPRO', 4700, 2),
  ('30000000-0000-0000-0000-000000000012', 'mia-johansson',  'Mia',    'Johansson', 'Mia Johansson', 'SWE', 'FPRO', 4500, 4),
  ('30000000-0000-0000-0000-000000000013', 'sofia-rossi',    'Sofia',  'Rossi',     'Sofia Rossi',   'ITA', 'FPRO', 4300, 6),
  ('30000000-0000-0000-0000-000000000014', 'emma-kowalski',  'Emma',   'Kowalski',  'Emma Kowalski', 'POL', 'FPRO', 4100, 8);

-- races: two already finished (with results + scored bets), two upcoming (with startlists)
insert into public.races (id, slug, name, date, tier, brand, distance, location, country, prize_money, divisions, results_url, participants_url, crawled_at, results_crawled_at, startlist_crawled_at)
values
  (
    '40000000-0000-0000-0000-000000000001',
    't100-london', 'T100 London', current_date - 14, 'T100', 'T100', '100km',
    'London', 'GBR', 'US$ 500,000', '["FPRO","MPRO"]',
    'https://t100triathlon.com/london/results', 'https://t100triathlon.com/london/startlist',
    now(), now(), now()
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    't100-new-york', 'T100 New York', current_date - 3, 'T100', 'T100', '100km',
    'New York', 'USA', 'US$ 500,000', '["FPRO","MPRO"]',
    'https://t100triathlon.com/new-york/results', 'https://t100triathlon.com/new-york/startlist',
    now(), now(), NULL
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    't100-singapore', 'T100 Singapore', current_date + 21, 'T100', 'T100', '100km',
    'Singapore', 'SGP', 'US$ 500,000', '["FPRO","MPRO"]',
    'https://t100triathlon.com/singapore/results', 'https://t100triathlon.com/singapore/startlist',
    now(), NULL, now()
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    't100-miami', 'T100 Miami', current_date + 42, 'T100', 'T100', '100km',
    'Miami', 'USA', 'US$ 500,000', '["FPRO","MPRO"]',
    'https://t100triathlon.com/miami/results', 'https://t100triathlon.com/miami/startlist',
    now(), NULL, now()
  );

-- results for the finished races
insert into public.race_results (race_id, athlete_id, division, position, finish_time, pto_points)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'MPRO', 1, '3:12:44', 100),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'MPRO', 2, '3:15:02', 90),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'MPRO', 3, '3:19:31', 80),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'MPRO', 4, '3:23:58', 70),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', 'FPRO', 1, '3:41:20', 100),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000012', 'FPRO', 2, '3:44:17', 90),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000013', 'FPRO', 3, '3:50:05', 80),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000014', 'FPRO', 4, '3:55:49', 70),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'MPRO', 1, '3:09:10', 100),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'MPRO', 2, '3:13:44', 90),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'MPRO', 3, '3:16:29', 80),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'MPRO', 4, '3:21:48', 70),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000012', 'FPRO', 1, '3:40:02', 100),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011', 'FPRO', 2, '3:42:51', 90),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000014', 'FPRO', 3, '3:47:33', 80),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000013', 'FPRO', 4, '3:52:10', 70);

-- startlists for the upcoming races (bib is nullable; Miami keeps some NULL like real T100 lists)
insert into public.race_startlists (race_id, athlete_id, division, bib)
values
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'MPRO', '1'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'MPRO', '2'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'MPRO', '3'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', 'MPRO', '4'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000011', 'FPRO', '11'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000012', 'FPRO', '12'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000013', 'FPRO', '13'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000014', 'FPRO', '14'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'MPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'MPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'MPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'MPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000011', 'FPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000012', 'FPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000013', 'FPRO', NULL),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000014', 'FPRO', NULL);

-- a group with an admin and a regular member
insert into public.groups (id, name, created_by)
values ('20000000-0000-0000-0000-000000000001', 'Test Group', '10000000-0000-0000-0000-000000000001');

insert into public.group_members (group_id, user_id, is_admin)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', false);

insert into public.invites (group_id, invited_by, email)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'carol@example.com');

-- bets (points pre-scored for the finished races, matching the results above)
insert into public.bets (id, user_id, race_id, division, athlete_id, predicted_position, points)
values
  -- Alice on London (MPRO: Max 1, Jonas 2 / FPRO: Anna 1) -> 3 + 3 + 3 = 9 points
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'MPRO', '30000000-0000-0000-0000-000000000001', 1, 3),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'MPRO', '30000000-0000-0000-0000-000000000002', 2, 3),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'FPRO', '30000000-0000-0000-0000-000000000011', 1, 3),
  -- Bob on London (Jonas predicted 1 -> 1, Max predicted 3 -> 1, Liam 2 -> 1, Noah 4 -> 3) = 6 points
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MPRO', '30000000-0000-0000-0000-000000000002', 1, 1),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MPRO', '30000000-0000-0000-0000-000000000001', 3, 1),
  ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MPRO', '30000000-0000-0000-0000-000000000003', 2, 1),
  ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MPRO', '30000000-0000-0000-0000-000000000004', 4, 3),
  -- Bob on New York (Liam 2 exact -> 3, Max 1 -> 1) = 4 points
  ('50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'MPRO', '30000000-0000-0000-0000-000000000003', 2, 3),
  ('50000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'MPRO', '30000000-0000-0000-0000-000000000001', 1, 1),
  -- Alice on upcoming Singapore (unscored)
  ('50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'MPRO', '30000000-0000-0000-0000-000000000001', 1, 0),
  ('50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'MPRO', '30000000-0000-0000-0000-000000000002', 2, 0),
  ('50000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'MPRO', '30000000-0000-0000-0000-000000000003', 3, 0),
  ('50000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 'FPRO', '30000000-0000-0000-0000-000000000011', 1, 0),
  -- Bob on upcoming Singapore (unscored)
  ('50000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', 'MPRO', '30000000-0000-0000-0000-000000000002', 1, 0),
  ('50000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', 'MPRO', '30000000-0000-0000-0000-000000000001', 2, 0);

commit;