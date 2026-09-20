-- Name/country mirror the linked athlete row; drop them from race_startlists.
-- bib and division are race-scoped and stay (bib is not in athletes).
alter table public.race_startlists
  drop column first_name,
  drop column last_name,
  drop column country;