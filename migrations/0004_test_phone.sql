-- Temporary test phone for site verification. Replace from Admin → Company when done.
update company_settings
set
  phones = '["8777737115"]',
  whatsapp = '8777737115',
  updated_at = now()
where id = 'default';
