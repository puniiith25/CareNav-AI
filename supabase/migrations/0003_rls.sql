-- Row Level Security. Authorization is enforced in the database, not only the UI.

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.uid()::text, '')::uuid
$$;

create or replace function public.current_role()
returns user_role
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
as $$
  select id from public.patients where user_id = auth.uid()
$$;

create or replace function public.current_doctor_id()
returns uuid
language sql
stable
as $$
  select id from public.doctors where user_id = auth.uid()
$$;

create or replace function public.current_admin_hospital_id()
returns uuid
language sql
stable
as $$
  select hospital_id from public.hospital_admins where user_id = auth.uid()
$$;

create or replace function public.doctor_has_active_consent(p_patient uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.consents c
    where c.patient_id = p_patient
      and c.doctor_id = public.current_doctor_id()
      and c.status = 'ACTIVE'
      and (c.expires_at is null or c.expires_at > now())
  )
$$;

-- Immutable-style audit log
create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are append-only';
end;
$$;

create trigger audit_logs_no_update
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_mutation();

do $$
declare
  t text;
begin
  foreach t in array array[
    'users','profiles','patients','doctors','hospitals','hospital_admins',
    'departments','specialties','services','hospital_services','doctor_availability',
    'appointments','appointment_documents','medical_documents','medical_reports',
    'report_values','prescriptions','medications','medication_schedules',
    'consultation_notes','health_records','health_timeline_events',
    'ai_conversations','ai_messages','health_journal','consents','consent_items',
    'caregivers','caregiver_permissions','recovery_plans','recovery_tasks',
    'notifications','audit_logs','hospital_facilities','hospital_maps',
    'hospital_floors','hospital_rooms','hospital_routes','knowledge_documents','embeddings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Users: own row
create policy users_self on public.users
  for select using (id = auth.uid() or public.current_role() = 'SYSTEM_ADMIN');

create policy profiles_self on public.profiles
  for select using (user_id = auth.uid() or public.current_role() = 'SYSTEM_ADMIN');

create policy profiles_update_self on public.profiles
  for update using (user_id = auth.uid());

-- Patients own their clinical data
create policy patients_self on public.patients
  for select using (user_id = auth.uid() or public.doctor_has_active_consent(id));

create policy medical_documents_patient on public.medical_documents
  for all using (
    patient_id = public.current_patient_id()
    or public.doctor_has_active_consent(patient_id)
  )
  with check (patient_id = public.current_patient_id() or uploaded_by = auth.uid());

create policy reports_patient on public.medical_reports
  for select using (
    patient_id = public.current_patient_id()
    or public.doctor_has_active_consent(patient_id)
  );

create policy report_values_via_report on public.report_values
  for select using (
    exists (
      select 1 from public.medical_reports r
      where r.id = report_id
        and (r.patient_id = public.current_patient_id() or public.doctor_has_active_consent(r.patient_id))
    )
  );

create policy prescriptions_access on public.prescriptions
  for select using (
    patient_id = public.current_patient_id()
    or public.doctor_has_active_consent(patient_id)
  );

create policy medications_access on public.medications
  for select using (
    patient_id = public.current_patient_id()
    or public.doctor_has_active_consent(patient_id)
  );

create policy timeline_patient on public.health_timeline_events
  for select using (patient_id = public.current_patient_id());

create policy health_records_patient on public.health_records
  for select using (
    patient_id = public.current_patient_id()
    or public.doctor_has_active_consent(patient_id)
  );

create policy journal_patient on public.health_journal
  for all using (patient_id = public.current_patient_id())
  with check (patient_id = public.current_patient_id());

create policy ai_conv_patient on public.ai_conversations
  for all using (patient_id = public.current_patient_id())
  with check (patient_id = public.current_patient_id());

create policy ai_msg_patient on public.ai_messages
  for all using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.patient_id = public.current_patient_id()
    )
  );

create policy consents_patient_manage on public.consents
  for all using (
    patient_id = public.current_patient_id()
    or doctor_id = public.current_doctor_id()
  )
  with check (patient_id = public.current_patient_id());

create policy consent_items_via_consent on public.consent_items
  for all using (
    exists (
      select 1 from public.consents c
      where c.id = consent_id
        and (c.patient_id = public.current_patient_id() or c.doctor_id = public.current_doctor_id())
    )
  );

create policy appointments_parties on public.appointments
  for select using (
    patient_id = public.current_patient_id()
    or doctor_id = public.current_doctor_id()
    or hospital_id = public.current_admin_hospital_id()
  );

create policy appointments_patient_write on public.appointments
  for insert with check (patient_id = public.current_patient_id());

create policy notifications_self on public.notifications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy audit_patient_view on public.audit_logs
  for select using (
    actor_user_id = auth.uid()
    or exists (
      select 1 from public.patients p
      where p.user_id = auth.uid()
        and (
          (resource_type in ('medical_document','medical_report','consent','appointment','prescription')
           and resource_id is not null)
        )
    )
    or public.current_role() = 'SYSTEM_ADMIN'
  );

-- Directory data is readable to authenticated users (demo facilities are labeled)
create policy hospitals_read on public.hospitals for select using (true);
create policy departments_read on public.departments for select using (true);
create policy services_read on public.services for select using (true);
create policy hospital_services_read on public.hospital_services for select using (true);
create policy doctors_read on public.doctors for select using (true);
create policy availability_read on public.doctor_availability for select using (true);
create policy specialties_read on public.specialties for select using (true);
create policy facilities_read on public.hospital_facilities for select using (true);
create policy maps_read on public.hospital_maps for select using (true);
create policy floors_read on public.hospital_floors for select using (true);
create policy rooms_read on public.hospital_rooms for select using (true);
create policy routes_read on public.hospital_routes for select using (true);
create policy knowledge_read on public.knowledge_documents for select using (true);

-- Hospital admins manage their hospital operational data only
create policy admin_hospital_update on public.hospitals
  for update using (id = public.current_admin_hospital_id());

create policy admin_departments on public.departments
  for all using (hospital_id = public.current_admin_hospital_id())
  with check (hospital_id = public.current_admin_hospital_id());

create policy admin_schedules on public.doctor_availability
  for all using (
    exists (
      select 1 from public.doctors d
      where d.id = doctor_id and d.hospital_id = public.current_admin_hospital_id()
    )
  );

-- Caregivers: only explicitly granted patients
create policy caregiver_patient on public.patients
  for select using (
    exists (
      select 1 from public.caregivers cg
      where cg.patient_id = patients.id and cg.user_id = auth.uid()
    )
  );

create policy recovery_patient on public.recovery_plans
  for select using (patient_id = public.current_patient_id());

create policy recovery_tasks_patient on public.recovery_tasks
  for select using (
    exists (
      select 1 from public.recovery_plans p
      where p.id = plan_id and p.patient_id = public.current_patient_id()
    )
  );
