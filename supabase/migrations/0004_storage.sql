-- Private buckets for medical data. Never use permanent public URLs for patient files.

insert into storage.buckets (id, name, public)
values
  ('medical-documents', 'medical-documents', false),
  ('medical-images', 'medical-images', false),
  ('prescriptions', 'prescriptions', false),
  ('discharge-documents', 'discharge-documents', false),
  ('hospital-assets', 'hospital-assets', true),
  ('profile-images', 'profile-images', false)
on conflict (id) do nothing;

create policy medical_documents_owner
  on storage.objects for select
  using (
    bucket_id in ('medical-documents', 'medical-images', 'prescriptions', 'discharge-documents')
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_role() = 'SYSTEM_ADMIN'
    )
  );

create policy medical_documents_insert
  on storage.objects for insert
  with check (
    bucket_id in ('medical-documents', 'medical-images', 'prescriptions', 'discharge-documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
