-- T100 start lists have no bib numbers, only the confirmed participants.
alter table public.race_startlists
  alter column bib drop not null;