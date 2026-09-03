-- Synthetic seed for Arjun Mehta (Patient)

insert into public.users (id, email, role, is_active)
values
  ('11111111-1111-4111-8111-111111111111', 'demo.patient@carenav.demo', 'PATIENT', true)
on conflict (id) do nothing;

insert into public.profiles (id, user_id, full_name, date_of_birth, phone, preferred_language, accessibility_preferences)
values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Arjun Mehta', '1992-04-15', '+91 98765 43210', 'en', '{"high_contrast": false, "screen_reader": false}')
on conflict (user_id) do nothing;

insert into public.patients (id, user_id, emergency_contact_name, emergency_contact_phone)
values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Pooja Mehta', '+91 98765 43211')
on conflict (user_id) do nothing;
