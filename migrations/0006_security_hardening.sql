-- Security hardening for public enquiry uploads and first-admin bootstrap.
-- Idempotent so preview and production can apply it safely.

alter table media_library
  add column if not exists public_enquiry boolean not null default false;

create index if not exists media_library_public_enquiry_idx
  on media_library (public_enquiry, created_at desc);

-- Only one non-revoked administrator may exist. Revoked historical admin rows
-- remain allowed. This closes the race where two first-admin requests could both
-- observe zero admins before inserting.
create unique index if not exists admin_users_one_active_idx
  on admin_users ((1))
  where revoked_at is null;
