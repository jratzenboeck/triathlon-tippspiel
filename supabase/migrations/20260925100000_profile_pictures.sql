alter table public.profiles
  add column avatar_path text;

drop policy if exists "users can update own profile" on public.profiles;

create policy "users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (avatar_path is null or split_part(avatar_path, '/', 1) = auth.uid()::text)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "users can upload own profile pictures"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete own profile pictures"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-pictures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
