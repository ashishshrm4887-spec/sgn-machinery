-- Factory photographs and confirmed works address from company nameplates.
-- Photos live in public/media (storage = public). Idempotent.

insert into media_library (
  id, filename, original_name, mime_type, kind, size_bytes, storage, public_url, alt_text, caption
) values
  (
    'media-corrugation-rolls',
    'corrugation-machine.jpg',
    'corrugation-machine.jpg',
    'image/jpeg',
    'image',
    501232,
    'public',
    '/media/corrugation-machine.jpg',
    'Corrugation machine rolls at Shree Guru Nanak Dev Machinery Company, Amritsar',
    'Corrugation machine — fluted rolls, Amritsar workshop'
  ),
  (
    'media-sheet-pasting-rollers',
    'sheet-pasting-machine.jpg',
    'sheet-pasting-machine.jpg',
    'image/jpeg',
    'image',
    427710,
    'public',
    '/media/sheet-pasting-machine.jpg',
    'Sheet pasting machine rollers at Shree Guru Nanak Dev Machinery Company, Amritsar',
    'Sheet pasting machine — Amritsar workshop'
  ),
  (
    'media-machine-nameplate',
    'machine-nameplate.jpg',
    'machine-nameplate.jpg',
    'image/jpeg',
    'image',
    298883,
    'public',
    '/media/machine-nameplate.jpg',
    'SGN Machinery nameplate on a machine at the Amritsar workshop',
    'Company nameplate — Amritsar workshop'
  ),
  (
    'media-workshop-dispatch',
    'workshop-dispatch.jpg',
    'workshop-dispatch.jpg',
    'image/jpeg',
    'image',
    513415,
    'public',
    '/media/workshop-dispatch.jpg',
    'Machinery on the workshop floor at Shree Guru Nanak Dev Machinery Company, Amritsar',
    'Workshop floor — Amritsar'
  )
on conflict (id) do nothing;

insert into machines (
  id, name, slug, category, model, short_description, full_description,
  featured, published, archived, sort_order, seo_title, seo_description
) values
  (
    'machine-corrugation',
    'Corrugation Machine',
    'corrugation-machine',
    'Corrugation',
    null,
    'Corrugation machine for producing corrugated board. Photographed at the Amritsar workshop.',
    'This corrugation machine is manufactured by Shree Guru Nanak Dev Machinery Company for corrugated board production. The photograph shows the fluted corrugating rolls at the Amritsar workshop. Width, speed, and other order-specific details are confirmed at quotation. Request current specifications from the company.',
    true,
    true,
    false,
    5,
    'Corrugation Machine | SGN Machinery',
    'Corrugation machine for corrugated board production from Shree Guru Nanak Dev Machinery Company, Amritsar. Request a quotation.'
  ),
  (
    'machine-sheet-pasting',
    'Sheet Pasting Machine',
    'sheet-pasting-machine',
    'Pasting',
    null,
    'Roller pasting machine used to apply adhesive in corrugated board production.',
    'Sheet pasting machinery from Shree Guru Nanak Dev Machinery Company, photographed at the Amritsar workshop. Used in corrugated board and carton manufacturing to apply adhesive between layers. Request current specifications and a quotation — sizes and drive details vary by order.',
    true,
    true,
    false,
    20,
    'Sheet Pasting Machine | SGN Machinery',
    'Sheet pasting machine for corrugated board production from Shree Guru Nanak Dev Machinery Company, Amritsar. Request a quotation.'
  )
on conflict (id) do nothing;

insert into machine_specs (id, machine_id, label, value, sort_order, published) values
  ('spec-corr-type', 'machine-corrugation', 'Type', 'Corrugation machine', 10, true),
  ('spec-corr-app', 'machine-corrugation', 'Application', 'Corrugated board manufacturing', 20, true),
  ('spec-paste-type', 'machine-sheet-pasting', 'Type', 'Sheet pasting / roller applicator', 10, true),
  ('spec-paste-app', 'machine-sheet-pasting', 'Application', 'Corrugated board / carton manufacturing', 20, true)
on conflict (id) do nothing;

insert into machine_applications (id, machine_id, body, sort_order) values
  ('app-corr-1', 'machine-corrugation', 'Corrugated board manufacturing', 10),
  ('app-paste-1', 'machine-sheet-pasting', 'Corrugated board and carton manufacturing', 10)
on conflict (id) do nothing;

insert into machine_media (id, machine_id, media_id, role, sort_order) values
  ('mm-corr-main', 'machine-corrugation', 'media-corrugation-rolls', 'main', 10),
  ('mm-paste-main', 'machine-sheet-pasting', 'media-sheet-pasting-rollers', 'main', 10)
on conflict (id) do nothing;

insert into gallery_items (id, media_id, caption, category, published, sort_order) values
  ('gal-corrugation', 'media-corrugation-rolls', 'Corrugation machine rolls at the Amritsar workshop.', 'Machines', true, 10),
  ('gal-pasting', 'media-sheet-pasting-rollers', 'Sheet pasting machine at the Amritsar workshop.', 'Machines', true, 20),
  ('gal-nameplate', 'media-machine-nameplate', 'SGN Machinery nameplate on workshop equipment.', 'Workshop', true, 30),
  ('gal-dispatch', 'media-workshop-dispatch', 'Machinery on the workshop floor, Amritsar.', 'Workshop', true, 40)
on conflict (id) do nothing;

insert into media_usage (id, media_id, entity_type, entity_id, field) values
  ('use-corr-machine', 'media-corrugation-rolls', 'machine', 'machine-corrugation', 'main'),
  ('use-paste-machine', 'media-sheet-pasting-rollers', 'machine', 'machine-sheet-pasting', 'main'),
  ('use-gal-corr', 'media-corrugation-rolls', 'gallery', 'gal-corrugation', ''),
  ('use-gal-paste', 'media-sheet-pasting-rollers', 'gallery', 'gal-pasting', ''),
  ('use-gal-name', 'media-machine-nameplate', 'gallery', 'gal-nameplate', ''),
  ('use-gal-disp', 'media-workshop-dispatch', 'gallery', 'gal-dispatch', '')
on conflict (id) do nothing;

update company_settings
   set address = '320, Baba Budha Ji Avenue, Opp. ITBPF Camp, G.T. Road, Amritsar-143006 (Punjab), India',
       maps_url = 'https://maps.google.com/maps?q=320+Baba+Budha+Ji+Avenue,+Opp.+ITBPF+Camp,+G.T.+Road,+Amritsar-143006&output=embed',
       about_short = 'Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery at its Amritsar workshop.',
       about_full = 'Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery from its workshop in Amritsar, Punjab. The company supplies equipment used in corrugated box and carton manufacturing, including corrugation machines, sheet pasting machines, and printer slotter machines. The works are at 320, Baba Budha Ji Avenue, opposite ITBPF Camp, G.T. Road, Amritsar-143006. Further company history and certifications can be added from the administrator panel as they are confirmed.',
       engineering_focus = 'The company manufactures corrugated board box making plant machinery, printing packaging, and allied equipment at its Amritsar workshop.',
       hero_image_url = '/media/hero-workshop.jpg',
       seo_description = 'Corrugated board and allied machinery from Shree Guru Nanak Dev Machinery Company, Amritsar. Corrugation, sheet pasting, and printer slotter machines. Request a quotation.',
       updated_at = now()
 where id = 'default';
