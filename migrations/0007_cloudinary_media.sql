-- Store the Cloudinary public id separately so admin deletion can remove remote assets too.
alter table media_library add column if not exists cloudinary_public_id text;
alter table media_library add column if not exists cloudinary_resource_type text;

create index if not exists media_library_cloudinary_idx
  on media_library (cloudinary_public_id)
  where cloudinary_public_id is not null;
