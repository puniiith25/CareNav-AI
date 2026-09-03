-- Synthetic Hospitals in Bengaluru

insert into public.hospitals (id, name, slug, is_demo, ownership, address, phone, latitude, longitude, emergency_available, rating, description)
values
  ('44444444-4444-4444-4444-444444444401', 'Bengaluru Heart & Multispecialty Hospital (Demo)', 'bengaluru-heart-multispecialty', true, 'private', '104 Residency Road, Richmond Town, Bengaluru 560025', '+91 80 2222 0101', 12.9716, 77.6012, true, 4.8, 'Premier cardiovascular care, 24/7 emergency trauma center, and advanced diagnostic imaging.'),
  ('44444444-4444-4444-4444-444444444402', 'South City Orthopedic & Spine Center (Demo)', 'south-city-ortho', true, 'private', '45 100ft Ring Road, JP Nagar 6th Phase, Bengaluru 560078', '+91 80 2665 0202', 12.9081, 77.5855, false, 4.6, 'Specialized joint replacements, sports injury rehabilitation, and minimally invasive spine surgery.'),
  ('44444444-4444-4444-4444-444444444403', 'Bengaluru Neuro & Wellness Hospital (Demo)', 'bengaluru-neuro-wellness', true, 'private', '12 HAL Airport Road, Indiranagar, Bengaluru 560008', '+91 80 2520 0303', 12.9620, 77.6438, true, 4.7, 'Comprehensive neurological evaluations, stroke intervention suite, and cognitive care unit.'),
  ('44444444-4444-4444-4444-444444444404', 'VisionCare Bengaluru Eye Hospital (Demo)', 'visioncare-bengaluru', true, 'private', '78 11th Main Road, Jayanagar 4th Block, Bengaluru 560011', '+91 80 2654 0404', 12.9288, 77.5830, false, 4.5, 'Cataract laser surgery, retina clinics, pediatric ophthalmology, and advanced refractive diagnostics.'),
  ('44444444-4444-4444-4444-444444444405', 'CityCare General & Pediatric Hospital (Demo)', 'citycare-general', true, 'private', '22 Malleshwaram 8th Cross, Bengaluru 560003', '+91 80 2334 0505', 12.9982, 77.5704, true, 4.4, 'Round-the-clock general medical ward, pediatric ICU, neonatal unit, and pathology lab.')
on conflict (id) do nothing;
