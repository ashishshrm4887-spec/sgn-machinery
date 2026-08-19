# Shree Guru Nanak Dev Machinery Company

Production website and administrator CMS for **Shree Guru Nanak Dev Machinery Company** — corrugated board and allied machinery.

The public site is driven entirely by the database. Phone numbers, email, WhatsApp, machines, services, projects, gallery, and homepage copy are edited in `/admin`. No source change is required for normal business updates.

## What is included

- Public pages: Home, Machines, Machine detail, Services, Projects, Gallery, About, Contact, Request a Quote
- Secure administrator CMS at `/admin`
- Enquiry and quotation forms with optional file attachments
- Persistent media storage independent of GitHub repository visibility
- SEO: titles, descriptions, Open Graph, sitemap, robots.txt, Organization and Product schema

## Confirmed company facts used on the site

Only information supplied by the company is published:

- Company: Shree Guru Nanak Dev Machinery Company
- Business: Corrugated Board & Allied Machinery
- Tagline: Built to Perform. Made to Last.
- Phone: 7009950622 / 7809099995
- Email: shreegurunanakdevmachineryco@gmail.com
- Address: 320, Baba Budha Ji Avenue, Opp. ITBPF Camp, G.T. Road, Amritsar-143006 (Punjab), India
- Machine: Chain Feed 2 Colour Printer Slotter — sheet size 1400mm × 2800mm, 2 colour, chain feed, corrugated box / carton manufacturing
- Machine: Corrugation Machine — photographed at the Amritsar workshop (fluted rolls)
- Machine: Sheet Pasting Machine — photographed at the Amritsar workshop (roller applicator)

Unspecified claims (speeds, horsepower, automation level, certifications) are **not published**. They can be added from the admin panel when confirmed.

Hero and about photographs are from the company workshop. Additional machine photographs can be uploaded from **Admin → Machines**.

## First administrator

1. Open `/login`
2. Create the first administrator account (email + password)
3. That account is stored in `admin_users` and can sign in at `/admin`
4. Change the password from **Admin → Account**

Later visitors can sign in but cannot reach `/admin` unless they are listed as administrators.

## Media storage (GitHub public or private)

Uploaded images, videos, and PDFs are **not** read from the GitHub repository at runtime.

1. Admin (or a quotation form) uploads a file
2. The file is stored in the application database (`media_blobs`) — or in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is present
3. The public site loads it from `/api/media/{id}` or the Blob CDN URL

Changing the repository from public to private does not break production media. Seed images in `public/` ship with the deployed application; they are application assets, not a GitHub-hosted CDN.

## Environment

Do not commit secrets. On this platform, `DATABASE_URL` and auth credentials are injected at deploy time. Live preview uses an embedded Postgres (PGLite) automatically.

Optional process environment (set in the host, not in the repo):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon / Postgres in production |
| `BLOB_READ_WRITE_TOKEN` | Optional Vercel Blob for large files |
| `VITE_PUBLIC_HOSTNAME` | Public hostname for canonical URLs and Open Graph |
| `BETTER_AUTH_SECRET` | Session signing (injected on deploy) |

## Local / preview

```bash
git clone https://github.com/ashishshrm4887-spec/sgn-machinery.git
cd sgn-machinery
npm install
npm run dev
```

The app listens on port 8080. Open `/` for the website and `/login` to create the admin account.

```bash
npm run build
npm run typecheck
```

Schema lives in `migrations/`. `0001_auth.sql` is the Better Auth schema. `0002_cms.sql` and `0003_factory_photos.sql` seed the CMS, workshop photographs, and confirmed company address.

## Admin checklist

- Company: name, phones, WhatsApp, email, address, maps, hours, logo
- Homepage: hero title, text, image/video, why-choose-us
- Machines: add / edit / publish / feature / archive, specs, features, applications, photos, videos, brochure
- Services, projects, gallery, media library, enquiries (status + CSV), SEO, account password

If an image or video fails to load, the site shows a branded SGN placeholder instead of a broken frame.
