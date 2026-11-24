-- Event image storage (Supabase Storage). Files are stored under <org_id>/<file>.
-- Public read so images can be shown on reports; writes limited to org members.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "org members upload event images" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images' and public.is_org_member(((storage.foldername(name))[1])::uuid));
create policy "org members update event images" on storage.objects for update to authenticated
  using (bucket_id = 'event-images' and public.is_org_member(((storage.foldername(name))[1])::uuid));
create policy "org members delete event images" on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and public.is_org_member(((storage.foldername(name))[1])::uuid));
