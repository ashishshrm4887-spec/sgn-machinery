-- Restore original confirmed company phone numbers.
update company_settings
set
  phones = '["7009950622","7809099995"]',
  whatsapp = '7009950622',
  updated_at = now()
where id = 'default';
