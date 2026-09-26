-- Public bucket for contestant photos.
insert into storage.buckets (id, name, public)
values ('contestant-images', 'contestant-images', true)
on conflict (id) do nothing;

-- Anyone can view contestant images (public bucket, public voting site needs to render them).
create policy "public read contestant images"
  on storage.objects for select
  using (bucket_id = 'contestant-images');

-- Only authenticated admins can upload/manage contestant images.
create policy "admin upload contestant images"
  on storage.objects for insert
  with check (
    bucket_id = 'contestant-images'
    and exists (select 1 from public.profiles where id = auth.uid())
  );

create policy "admin update contestant images"
  on storage.objects for update
  using (
    bucket_id = 'contestant-images'
    and exists (select 1 from public.profiles where id = auth.uid())
  );

create policy "admin delete contestant images"
  on storage.objects for delete
  using (
    bucket_id = 'contestant-images'
    and exists (select 1 from public.profiles where id = auth.uid())
  );
