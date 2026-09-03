-- Synthetic Reports, Values, Prescriptions, Medications, and Timeline for Arjun Mehta

insert into public.medical_reports (id, patient_id, report_date, hospital_or_lab, doctor_name, test_name, document_type, extraction_confidence)
values
  ('66666666-6666-6666-6666-666666666601', '33333333-3333-4333-8333-333333333333', '2026-08-10', 'Demo Diagnostics Lab', 'Dr. Ananya Sharma', 'Complete Blood Count', 'Blood Test', 0.96),
  ('66666666-6666-6666-6666-666666666602', '33333333-3333-4333-8333-333333333333', '2026-09-01', 'Demo Diagnostics Lab', 'Dr. Ananya Sharma', 'Complete Blood Count', 'Blood Test', 0.98)
on conflict (id) do nothing;

insert into public.report_values (id, report_id, test_name, value, unit, reference_range, confidence)
values
  ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', 'Hemoglobin', '13.1', 'g/dL', '13.0-17.0', 0.97),
  ('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666601', 'WBC', '7.2', 'x10^9/L', '4.0-11.0', 0.95),
  ('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666601', 'Platelets', '215', 'x10^9/L', '150-400', 0.94),
  ('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666602', 'Hemoglobin', '13.8', 'g/dL', '13.0-17.0', 0.98),
  ('77777777-7777-7777-7777-777777777705', '66666666-6666-6666-6666-666666666602', 'WBC', '7.0', 'x10^9/L', '4.0-11.0', 0.96),
  ('77777777-7777-7777-7777-777777777706', '66666666-6666-6666-6666-666666666602', 'Platelets', '228', 'x10^9/L', '150-400', 0.95)
on conflict (id) do nothing;

insert into public.prescriptions (id, patient_id, doctor_id, issued_at, notes)
values
  ('88888888-8888-8888-8888-888888888801', '33333333-3333-4333-8333-333333333333', '55555555-5555-5555-5555-555555555501', '2026-08-28', 'Take with food. Monitor blood pressure weekly.')
on conflict (id) do nothing;

insert into public.medications (id, prescription_id, patient_id, name, dose, frequency, duration, instructions)
values
  ('99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888801', '33333333-3333-4333-8333-333333333333', 'Atorvastatin (Demo)', '10 mg', 'Once daily at bedtime', '30 days', 'Take 1 tablet at night after dinner.'),
  ('99999999-9999-9999-9999-999999999902', '88888888-8888-8888-8888-888888888801', '33333333-3333-4333-8333-333333333333', 'Vitamin D3 (Demo)', '60,000 IU', 'Once weekly', '8 weeks', 'Take with breakfast with milk.')
on conflict (id) do nothing;

insert into public.health_timeline_events (id, patient_id, event_type, title, occurred_at, source_table, source_id, icon)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'report', 'Complete Blood Count uploaded & analyzed', '2026-09-01T10:30:00Z', 'medical_reports', '66666666-6666-6666-6666-666666666602', 'document'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '33333333-3333-4333-8333-333333333333', 'prescription', 'Prescription added after Cardiology consultation', '2026-08-28T17:15:00Z', 'prescriptions', '88888888-8888-8888-8888-888888888801', 'pill'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '33333333-3333-4333-8333-333333333333', 'consultation', 'Consultation with Dr. Ananya Sharma', '2026-08-28T16:30:00Z', 'appointments', null, 'stethoscope'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '33333333-3333-4333-8333-333333333333', 'report', 'Baseline Complete Blood Count report', '2026-08-10T09:00:00Z', 'medical_reports', '66666666-6666-6666-6666-666666666601', 'document')
on conflict (id) do nothing;
