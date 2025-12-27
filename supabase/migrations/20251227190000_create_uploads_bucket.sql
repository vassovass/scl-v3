-- Create uploads bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Set up RLS policies for uploads bucket
-- Allow public read access (for viewing screenshots)
create policy "Public Read Access"
  on storage.objects for select
  using ( bucket_id = 'uploads' );

-- Note: Uploads are handled by the generic API using service_role, so no insert policy needed for anon/auth users directly.
