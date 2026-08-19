-- SGN Machinery CMS schema. Idempotent. No extensions.

create table if not exists admin_users (
  user_id text primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists media_library (
  id text primary key,
  filename text not null,
  original_name text not null,
  mime_type text not null,
  kind text not null,
  size_bytes integer not null,
  storage text not null default 'db',
  public_url text,
  alt_text text,
  caption text,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists media_blobs (
  media_id text primary key references media_library(id) on delete cascade,
  bytes bytea not null
);

create table if not exists media_usage (
  id text primary key,
  media_id text not null references media_library(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  field text not null default ''
);

create index if not exists media_usage_media_idx on media_usage (media_id);
create index if not exists media_library_kind_idx on media_library (kind);

create table if not exists company_settings (
  id text primary key default 'default',
  company_name text not null,
  business_line text not null default '',
  tagline text not null default '',
  about_short text not null default '',
  about_full text not null default '',
  engineering_focus text not null default '',
  manufacturing_capabilities text not null default '',
  logo_url text not null default '/logo.svg',
  favicon_url text not null default '/favicon.svg',
  phones text not null default '[]',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  maps_url text not null default '',
  business_hours text not null default '',
  hero_title text not null default '',
  hero_description text not null default '',
  hero_image_url text not null default '/media/hero-workshop.jpg',
  hero_video_url text not null default '',
  hero_cta_primary text not null default 'Explore Machines',
  hero_cta_secondary text not null default 'Request a Quote',
  why_choose_us text not null default '[]',
  social_links text not null default '[]',
  seo_title text not null default '',
  seo_description text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists machines (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text,
  model text,
  short_description text,
  full_description text,
  featured boolean not null default false,
  published boolean not null default false,
  archived boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  brochure_media_id text references media_library(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists machine_specs (
  id text primary key,
  machine_id text not null references machines(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  published boolean not null default true
);

create table if not exists machine_features (
  id text primary key,
  machine_id text not null references machines(id) on delete cascade,
  body text not null,
  sort_order integer not null default 0
);

create table if not exists machine_applications (
  id text primary key,
  machine_id text not null references machines(id) on delete cascade,
  body text not null,
  sort_order integer not null default 0
);

create table if not exists machine_media (
  id text primary key,
  machine_id text not null references machines(id) on delete cascade,
  media_id text not null references media_library(id) on delete cascade,
  role text not null,
  sort_order integer not null default 0
);

create table if not exists services (
  id text primary key,
  title text not null,
  slug text not null unique,
  summary text,
  body text,
  image_url text,
  published boolean not null default false,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  title text not null,
  slug text not null unique,
  description text,
  machine_name text,
  client_name text,
  location text,
  year_label text,
  published boolean not null default false,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_media (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  media_id text not null references media_library(id) on delete cascade,
  role text not null default 'gallery',
  sort_order integer not null default 0
);

create table if not exists gallery_items (
  id text primary key,
  media_id text not null references media_library(id) on delete cascade,
  caption text,
  category text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id text primary key,
  quote text not null,
  attribution text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id text primary key,
  kind text not null,
  full_name text not null,
  company_name text,
  phone text not null,
  whatsapp text,
  email text,
  machine_name text,
  quantity text,
  location text,
  requirements text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists enquiry_files (
  id text primary key,
  enquiry_id text not null references enquiries(id) on delete cascade,
  media_id text not null references media_library(id) on delete cascade
);

create table if not exists page_seo (
  path text primary key,
  title text,
  description text
);

create index if not exists machines_published_idx on machines (published, archived, sort_order);
create index if not exists services_published_idx on services (published, archived, sort_order);
create index if not exists projects_published_idx on projects (published, archived, sort_order);
create index if not exists gallery_published_idx on gallery_items (published, sort_order);
create index if not exists enquiries_status_idx on enquiries (status, created_at desc);

insert into company_settings (
  id, company_name, business_line, tagline,
  about_short, about_full, engineering_focus, manufacturing_capabilities,
  logo_url, favicon_url, phones, whatsapp, email, address, maps_url, business_hours,
  hero_title, hero_description, hero_image_url, hero_video_url,
  hero_cta_primary, hero_cta_secondary, why_choose_us, social_links,
  seo_title, seo_description
) values (
  'default',
  'Shree Guru Nanak Dev Machinery Company',
  'Corrugated Board & Allied Machinery',
  'Built to Perform. Made to Last.',
  'Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery at its Amritsar workshop.',
  'Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery from its workshop in Amritsar, Punjab. The company supplies equipment used in corrugated box and carton manufacturing, including corrugation machines, sheet pasting machines, and printer slotter machines. The works are at 320, Baba Budha Ji Avenue, opposite ITBPF Camp, G.T. Road, Amritsar-143006. Further company history and certifications can be added from the administrator panel as they are confirmed.',
  'The company manufactures corrugated board box making plant machinery, printing packaging, and allied equipment at its Amritsar workshop.',
  '',
  '/logo.svg',
  '/favicon.svg',
  '["7009950622","7809099995"]',
  '7009950622',
  'shreegurunanakdevmachineryco@gmail.com',
  '320, Baba Budha Ji Avenue, Opp. ITBPF Camp, G.T. Road, Amritsar-143006 (Punjab), India',
  'https://maps.google.com/maps?q=320+Baba+Budha+Ji+Avenue,+Opp.+ITBPF+Camp,+G.T.+Road,+Amritsar-143006&output=embed',
  '',
  'Corrugated Board & Allied Machinery',
  'Shree Guru Nanak Dev Machinery Company manufactures machinery for corrugated box and carton production. Request specifications and a quotation for the machines listed on this site.',
  '/media/hero-workshop.jpg',
  '',
  'Explore Machines',
  'Request a Quote',
  '[{"id":"w1","title":"Corrugated board machinery","body":"The company manufactures corrugated board and allied machinery for box and carton production."},{"id":"w2","title":"Built to perform. Made to last.","body":"Every enquiry is handled against the published machine specifications — not invented claims."},{"id":"w3","title":"Direct quotation","body":"Speak with the company by phone, WhatsApp, or the quotation form. Contact details update site-wide from the admin panel."},{"id":"w4","title":"Published specifications only","body":"Machine pages list confirmed data. Incomplete fields stay off the public site until they are filled in."}]',
  '[]',
  'Shree Guru Nanak Dev Machinery Company | Corrugated Board Machinery',
  'Corrugated board and allied machinery from Shree Guru Nanak Dev Machinery Company, Amritsar. Corrugation, sheet pasting, and printer slotter machines. Request a quotation.'
) on conflict (id) do nothing;

insert into machines (
  id, name, slug, category, model, short_description, full_description,
  featured, published, archived, sort_order, seo_title, seo_description
) values (
  'machine-printer-slotter-cf2c',
  'Chain Feed 2 Colour Printer Slotter Machine',
  'chain-feed-2-colour-printer-slotter',
  'Printer Slotter',
  'Chain Feed 2 Colour Printer Slotter',
  'Chain feed two-colour printer slotter for corrugated box and carton manufacturing.',
  'The Chain Feed 2 Colour Printer Slotter is offered for corrugated box and carton manufacturing. Confirmed details currently include the model name, a sheet size of 1400mm × 2800mm, two-colour printing, and chain feed. Additional specifications, features, photographs, and brochures can be published from the administrator panel as they are confirmed.',
  true,
  true,
  false,
  10,
  'Chain Feed 2 Colour Printer Slotter | SGN Machinery',
  'Chain feed 2 colour printer slotter machine. Sheet size 1400mm × 2800mm. For corrugated box and carton manufacturing. Request a quotation from Shree Guru Nanak Dev Machinery Company.'
) on conflict (id) do nothing;

insert into machine_specs (id, machine_id, label, value, sort_order, published) values
  ('spec-cf2c-model', 'machine-printer-slotter-cf2c', 'Model', 'Chain Feed 2 Colour Printer Slotter', 10, true),
  ('spec-cf2c-sheet', 'machine-printer-slotter-cf2c', 'Sheet Size', '1400mm × 2800mm', 20, true),
  ('spec-cf2c-colors', 'machine-printer-slotter-cf2c', 'Printing Colors', '2 Colour', 30, true),
  ('spec-cf2c-feed', 'machine-printer-slotter-cf2c', 'Feed Type', 'Chain Feed', 40, true),
  ('spec-cf2c-app', 'machine-printer-slotter-cf2c', 'Application', 'Corrugated Box / Carton Manufacturing', 50, true),
  ('spec-cf2c-auto', 'machine-printer-slotter-cf2c', 'Automation Level', '', 60, false)
on conflict (id) do nothing;

insert into machine_applications (id, machine_id, body, sort_order) values
  ('app-cf2c-1', 'machine-printer-slotter-cf2c', 'Corrugated box and carton manufacturing', 10)
on conflict (id) do nothing;

insert into services (id, title, slug, summary, body, published, sort_order) values
  (
    'svc-manufacturing',
    'Machinery Manufacturing',
    'machinery-manufacturing',
    'Manufacture of corrugated board and allied machinery.',
    'Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery, including printer slotter equipment for box and carton production.',
    true,
    10
  ),
  (
    'svc-custom',
    'Custom Machinery',
    'custom-machinery',
    'Custom machinery work — publish this service only if the company offers it.',
    'Use this entry if the company supplies custom or modified machinery. It stays unpublished until confirmed.',
    false,
    20
  ),
  (
    'svc-engineering',
    'Engineering Solutions',
    'engineering-solutions',
    'Engineering support — publish only if offered.',
    'Unpublished until the owner confirms this service.',
    false,
    30
  ),
  (
    'svc-repair',
    'Machine Repair',
    'machine-repair',
    'Repair work — publish only if offered.',
    'Unpublished until the owner confirms this service.',
    false,
    40
  ),
  (
    'svc-maintenance',
    'Machine Maintenance',
    'machine-maintenance',
    'Maintenance — publish only if offered.',
    'Unpublished until the owner confirms this service.',
    false,
    50
  ),
  (
    'svc-modification',
    'Machine Modification',
    'machine-modification',
    'Modification — publish only if offered.',
    'Unpublished until the owner confirms this service.',
    false,
    60
  ),
  (
    'svc-servicing',
    'Machine Servicing',
    'machine-servicing',
    'Servicing — publish only if offered.',
    'Unpublished until the owner confirms this service.',
    false,
    70
  ),
  (
    'svc-installation',
    'Installation',
    'installation',
    'Installation — publish only if offered.',
    'Unpublished until the owner confirms this service.',
    false,
    80
  )
on conflict (id) do nothing;

insert into page_seo (path, title, description) values
  ('/', 'Shree Guru Nanak Dev Machinery Company | Corrugated Board Machinery', 'Corrugated board and allied machinery. Explore machines and request a quotation from Shree Guru Nanak Dev Machinery Company.'),
  ('/machines', 'Machines | Shree Guru Nanak Dev Machinery Company', 'Catalogue of corrugated board and allied machinery. View specifications and request a quotation.'),
  ('/services', 'Services | Shree Guru Nanak Dev Machinery Company', 'Machinery manufacturing and related services from Shree Guru Nanak Dev Machinery Company.'),
  ('/projects', 'Projects | Shree Guru Nanak Dev Machinery Company', 'Selected machinery projects. Details are published only when confirmed by the company.'),
  ('/gallery', 'Gallery | Shree Guru Nanak Dev Machinery Company', 'Workshop, machinery, and project photographs from Shree Guru Nanak Dev Machinery Company.'),
  ('/about', 'About | Shree Guru Nanak Dev Machinery Company', 'Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery.'),
  ('/contact', 'Contact | Shree Guru Nanak Dev Machinery Company', 'Call, WhatsApp, or email Shree Guru Nanak Dev Machinery Company. Request a quotation.'),
  ('/quote', 'Request a Quote | Shree Guru Nanak Dev Machinery Company', 'Request a quotation for corrugated board and allied machinery.')
on conflict (path) do nothing;
