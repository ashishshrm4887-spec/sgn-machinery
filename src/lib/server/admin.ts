import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSessionUser } from "@/lib/auth/verify.server";
import {
  claimFirstAdmin,
  countAdmins,
  isAdminUser,
  requireAdmin,
} from "@/lib/server/admin-guard";
import {
  clearUsage,
  deleteMedia,
  getMediaById,
  listMediaUsage,
  recordUsage,
  rowToMedia,
} from "@/lib/server/media";
import { loadCompany, mapCompany } from "@/lib/server/site";
import { newId, slugify } from "@/lib/utils";
import type { CompanyPublic, EnquiryStatus, MediaRecord } from "@/lib/types";

type AdminRow = Record<string, string | number | boolean | null>;

function asRow(value: unknown): AdminRow {
  return value as AdminRow;
}
function asRows(value: unknown[]): AdminRow[] {
  return value as AdminRow[];
}

async function admin(userId: string) {
  await requireAdmin(userId);
}

export async function tryAdmin<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const getSetupState = createServerFn({ method: "GET" }).handler(async () => {
  const n = await countAdmins();
  return { hasAdmins: n > 0 };
});

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const user = await getSessionUser();
    const isAdmin = await isAdminUser(context.userId);
    const hasAdmins = (await countAdmins()) > 0;
    return {
      userId: context.userId,
      email: user?.email ?? null,
      isAdmin,
      hasAdmins,
    };
  });

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const user = await getSessionUser();
    await claimFirstAdmin(context.userId, user?.email ?? null, user?.email ?? null);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    const [machines, published, services, projects, gallery, enquiries, fresh] = await Promise.all([
      sql.query<{ n: number }>(`select count(*)::int as n from machines where archived = false`),
      sql.query<{ n: number }>(
        `select count(*)::int as n from machines where published = true and archived = false`,
      ),
      sql.query<{ n: number }>(`select count(*)::int as n from services where archived = false`),
      sql.query<{ n: number }>(`select count(*)::int as n from projects where archived = false`),
      sql.query<{ n: number }>(`select count(*)::int as n from gallery_items`),
      sql.query<{ n: number }>(`select count(*)::int as n from enquiries`),
      sql.query<{ n: number }>(`select count(*)::int as n from enquiries where status = 'new'`),
    ]);
    const recent = await sql.query(
      `select id, kind, full_name, company_name, phone, machine_name, status, created_at
         from enquiries order by created_at desc limit 8`,
    );
    return {
      totals: {
        machines: Number(machines[0]?.n ?? 0),
        publishedMachines: Number(published[0]?.n ?? 0),
        services: Number(services[0]?.n ?? 0),
        projects: Number(projects[0]?.n ?? 0),
        gallery: Number(gallery[0]?.n ?? 0),
        enquiries: Number(enquiries[0]?.n ?? 0),
        newEnquiries: Number(fresh[0]?.n ?? 0),
      },
      recent: recent.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: String(row.id),
          kind: String(row.kind),
          fullName: String(row.full_name),
          companyName: (row.company_name as string | null) ?? null,
          phone: String(row.phone),
          machineName: (row.machine_name as string | null) ?? null,
          status: String(row.status),
          createdAt: String(row.created_at),
        };
      }),
    };
  });

export const getCompanyAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    return loadCompany();
  });

const companySchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  businessLine: z.string().trim().max(200),
  tagline: z.string().trim().max(200),
  aboutShort: z.string().max(600),
  aboutFull: z.string().max(8000),
  engineeringFocus: z.string().max(2000),
  manufacturingCapabilities: z.string().max(2000),
  logoUrl: z.string().max(400),
  faviconUrl: z.string().max(400),
  phones: z.array(z.string().trim().min(6).max(20)).min(1).max(6),
  whatsapp: z.string().trim().max(20),
  email: z.string().trim().email(),
  address: z.string().max(400),
  mapsUrl: z.string().max(800),
  businessHours: z.string().max(400),
  heroTitle: z.string().max(200),
  heroDescription: z.string().max(800),
  heroImageUrl: z.string().max(400),
  heroVideoUrl: z.string().max(400),
  heroCtaPrimary: z.string().max(60),
  heroCtaSecondary: z.string().max(60),
  whyChooseUs: z
    .array(z.object({ id: z.string(), title: z.string().max(80), body: z.string().max(400) }))
    .max(8),
  socialLinks: z
    .array(z.object({ id: z.string(), label: z.string().max(40), url: z.string().max(300) }))
    .max(8),
  seoTitle: z.string().max(80),
  seoDescription: z.string().max(200),
});

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => companySchema.parse(input))
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(
      `update company_settings set
        company_name=$1, business_line=$2, tagline=$3, about_short=$4, about_full=$5,
        engineering_focus=$6, manufacturing_capabilities=$7, logo_url=$8, favicon_url=$9,
        phones=$10, whatsapp=$11, email=$12, address=$13, maps_url=$14, business_hours=$15,
        hero_title=$16, hero_description=$17, hero_image_url=$18, hero_video_url=$19,
        hero_cta_primary=$20, hero_cta_secondary=$21, why_choose_us=$22, social_links=$23,
        seo_title=$24, seo_description=$25, updated_at=now()
       where id='default'`,
      [
        data.companyName,
        data.businessLine,
        data.tagline,
        data.aboutShort,
        data.aboutFull,
        data.engineeringFocus,
        data.manufacturingCapabilities,
        data.logoUrl,
        data.faviconUrl,
        JSON.stringify(data.phones),
        data.whatsapp,
        data.email,
        data.address,
        data.mapsUrl,
        data.businessHours,
        data.heroTitle,
        data.heroDescription,
        data.heroImageUrl,
        data.heroVideoUrl,
        data.heroCtaPrimary,
        data.heroCtaSecondary,
        JSON.stringify(data.whyChooseUs),
        JSON.stringify(data.socialLinks),
        data.seoTitle,
        data.seoDescription,
      ],
    );
    return loadCompany();
  });

export const listMachinesAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    return asRows(await sql.query(
      `select id, name, slug, category, model, featured, published, archived, sort_order, updated_at
         from machines order by archived asc, sort_order, name`,
    ));
  });

const machineInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  model: z.string().trim().max(120).optional().or(z.literal("")),
  shortDescription: z.string().max(400).optional().or(z.literal("")),
  fullDescription: z.string().max(12000).optional().or(z.literal("")),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.number().int(),
  seoTitle: z.string().max(80).optional().or(z.literal("")),
  seoDescription: z.string().max(200).optional().or(z.literal("")),
  brochureMediaId: z.string().nullable().optional(),
  specs: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1).max(80),
      value: z.string().max(200),
      sortOrder: z.number().int(),
      published: z.boolean(),
    }),
  ),
  features: z.array(
    z.object({ id: z.string().optional(), body: z.string().min(1).max(400), sortOrder: z.number().int() }),
  ),
  applications: z.array(
    z.object({ id: z.string().optional(), body: z.string().min(1).max(400), sortOrder: z.number().int() }),
  ),
  media: z.array(
    z.object({
      id: z.string().optional(),
      mediaId: z.string(),
      role: z.enum(["main", "gallery", "video"]),
      sortOrder: z.number().int(),
    }),
  ),
});

export const getMachineAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await admin(context.userId);
    const sql = await getSql();
    const rows = await sql.query(`select * from machines where id = $1`, [id]);
    if (!rows[0]) return null;
    const specs = await sql.query(
      `select * from machine_specs where machine_id = $1 order by sort_order`,
      [id],
    );
    const features = await sql.query(
      `select * from machine_features where machine_id = $1 order by sort_order`,
      [id],
    );
    const applications = await sql.query(
      `select * from machine_applications where machine_id = $1 order by sort_order`,
      [id],
    );
    const media = await sql.query(
      `select mm.*, l.original_name, l.kind, l.public_url, l.storage
         from machine_media mm join media_library l on l.id = mm.media_id
        where mm.machine_id = $1 order by mm.sort_order`,
      [id],
    );
    return {
      machine: asRow(rows[0]),
      specs: asRows(specs),
      features: asRows(features),
      applications: asRows(applications),
      media: asRows(media),
    };
  });

export const saveMachine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => machineInput.parse(input))
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    const id = data.id || newId();
    let slug = slugify(data.slug || data.name);
    if (!slug) slug = `machine-${id.slice(0, 8)}`;
    const existing = await sql.query<{ id: string }>(
      `select id from machines where slug = $1 and id <> $2`,
      [slug, id],
    );
    if (existing[0]) slug = `${slug}-${id.slice(0, 6)}`;

    const found = await sql.query(`select id from machines where id = $1`, [id]);
    if (found[0]) {
      await sql.query(
        `update machines set
          name=$2, slug=$3, category=$4, model=$5, short_description=$6, full_description=$7,
          featured=$8, published=$9, sort_order=$10, seo_title=$11, seo_description=$12,
          brochure_media_id=$13, updated_at=now()
         where id=$1`,
        [
          id,
          data.name,
          slug,
          data.category || null,
          data.model || null,
          data.shortDescription || null,
          data.fullDescription || null,
          data.featured,
          data.published,
          data.sortOrder,
          data.seoTitle || null,
          data.seoDescription || null,
          data.brochureMediaId || null,
        ],
      );
    } else {
      await sql.query(
        `insert into machines
          (id, name, slug, category, model, short_description, full_description, featured, published, archived, sort_order, seo_title, seo_description, brochure_media_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10,$11,$12,$13)`,
        [
          id,
          data.name,
          slug,
          data.category || null,
          data.model || null,
          data.shortDescription || null,
          data.fullDescription || null,
          data.featured,
          data.published,
          data.sortOrder,
          data.seoTitle || null,
          data.seoDescription || null,
          data.brochureMediaId || null,
        ],
      );
    }

    await sql.query(`delete from machine_specs where machine_id = $1`, [id]);
    await sql.query(`delete from machine_features where machine_id = $1`, [id]);
    await sql.query(`delete from machine_applications where machine_id = $1`, [id]);
    await sql.query(`delete from machine_media where machine_id = $1`, [id]);
    await clearUsage("machine", id);

    for (const spec of data.specs) {
      await sql.query(
        `insert into machine_specs (id, machine_id, label, value, sort_order, published)
         values ($1,$2,$3,$4,$5,$6)`,
        [spec.id || newId(), id, spec.label, spec.value, spec.sortOrder, spec.published],
      );
    }
    for (const f of data.features) {
      await sql.query(
        `insert into machine_features (id, machine_id, body, sort_order) values ($1,$2,$3,$4)`,
        [f.id || newId(), id, f.body, f.sortOrder],
      );
    }
    for (const f of data.applications) {
      await sql.query(
        `insert into machine_applications (id, machine_id, body, sort_order) values ($1,$2,$3,$4)`,
        [f.id || newId(), id, f.body, f.sortOrder],
      );
    }
    for (const m of data.media) {
      await sql.query(
        `insert into machine_media (id, machine_id, media_id, role, sort_order) values ($1,$2,$3,$4,$5)`,
        [m.id || newId(), id, m.mediaId, m.role, m.sortOrder],
      );
      await recordUsage(m.mediaId, "machine", id, m.role);
    }
    if (data.brochureMediaId) {
      await recordUsage(data.brochureMediaId, "machine", id, "brochure");
    }
    return { id, slug };
  });

export const archiveMachine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; archived: boolean }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(`update machines set archived = $2, published = case when $2 then false else published end, updated_at = now() where id = $1`, [
      data.id,
      data.archived,
    ]);
    return { ok: true };
  });

export const toggleMachineFlag = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; field: "published" | "featured"; value: boolean }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    if (data.field === "published") {
      await sql.query(`update machines set published = $2, updated_at = now() where id = $1`, [
        data.id,
        data.value,
      ]);
    } else {
      await sql.query(`update machines set featured = $2, updated_at = now() where id = $1`, [
        data.id,
        data.value,
      ]);
    }
    return { ok: true };
  });

const serviceInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(120),
  slug: z.string().optional(),
  summary: z.string().max(300).optional().or(z.literal("")),
  body: z.string().max(4000).optional().or(z.literal("")),
  imageUrl: z.string().max(400).optional().or(z.literal("")),
  published: z.boolean(),
  sortOrder: z.number().int(),
});

export const listServicesAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    return asRows(await sql.query(`select * from services order by archived, sort_order, title`));
  });

export const saveService = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => serviceInput.parse(input))
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    const id = data.id || newId();
    const slug = slugify(data.slug || data.title) || `service-${id.slice(0, 6)}`;
    const found = await sql.query(`select id from services where id = $1`, [id]);
    if (found[0]) {
      await sql.query(
        `update services set title=$2, slug=$3, summary=$4, body=$5, image_url=$6, published=$7, sort_order=$8, updated_at=now() where id=$1`,
        [id, data.title, slug, data.summary || null, data.body || null, data.imageUrl || null, data.published, data.sortOrder],
      );
    } else {
      await sql.query(
        `insert into services (id, title, slug, summary, body, image_url, published, archived, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,false,$8)`,
        [id, data.title, slug, data.summary || null, data.body || null, data.imageUrl || null, data.published, data.sortOrder],
      );
    }
    return { id };
  });

export const archiveService = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; archived: boolean }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(
      `update services set archived=$2, published=case when $2 then false else published end, updated_at=now() where id=$1`,
      [data.id, data.archived],
    );
    return { ok: true };
  });

const projectInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(160),
  slug: z.string().optional(),
  description: z.string().max(4000).optional().or(z.literal("")),
  machineName: z.string().max(160).optional().or(z.literal("")),
  clientName: z.string().max(160).optional().or(z.literal("")),
  location: z.string().max(160).optional().or(z.literal("")),
  yearLabel: z.string().max(20).optional().or(z.literal("")),
  published: z.boolean(),
  sortOrder: z.number().int(),
  mediaIds: z.array(z.string()).optional(),
});

export const listProjectsAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    return asRows(await sql.query(`select * from projects order by archived, sort_order, created_at desc`));
  });

export const getProjectAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await admin(context.userId);
    const sql = await getSql();
    const rows = await sql.query(`select * from projects where id = $1`, [id]);
    if (!rows[0]) return null;
    const media = await sql.query(
      `select pm.*, l.original_name, l.kind, l.public_url, l.storage
         from project_media pm join media_library l on l.id = pm.media_id
        where pm.project_id = $1 order by pm.sort_order`,
      [id],
    );
    return { project: asRow(rows[0]), media: asRows(media) };
  });

export const saveProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => projectInput.parse(input))
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    const id = data.id || newId();
    const slug = slugify(data.slug || data.title) || `project-${id.slice(0, 6)}`;
    const found = await sql.query(`select id from projects where id = $1`, [id]);
    if (found[0]) {
      await sql.query(
        `update projects set title=$2, slug=$3, description=$4, machine_name=$5, client_name=$6, location=$7, year_label=$8, published=$9, sort_order=$10, updated_at=now() where id=$1`,
        [
          id,
          data.title,
          slug,
          data.description || null,
          data.machineName || null,
          data.clientName || null,
          data.location || null,
          data.yearLabel || null,
          data.published,
          data.sortOrder,
        ],
      );
    } else {
      await sql.query(
        `insert into projects (id, title, slug, description, machine_name, client_name, location, year_label, published, archived, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,$10)`,
        [
          id,
          data.title,
          slug,
          data.description || null,
          data.machineName || null,
          data.clientName || null,
          data.location || null,
          data.yearLabel || null,
          data.published,
          data.sortOrder,
        ],
      );
    }
    await sql.query(`delete from project_media where project_id = $1`, [id]);
    await clearUsage("project", id);
    let order = 0;
    for (const mediaId of data.mediaIds ?? []) {
      await sql.query(
        `insert into project_media (id, project_id, media_id, role, sort_order) values ($1,$2,$3,'gallery',$4)`,
        [newId(), id, mediaId, order],
      );
      await recordUsage(mediaId, "project", id, "gallery");
      order += 10;
    }
    return { id };
  });

export const archiveProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; archived: boolean }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(
      `update projects set archived=$2, published=case when $2 then false else published end, updated_at=now() where id=$1`,
      [data.id, data.archived],
    );
    return { ok: true };
  });

export const listGalleryAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    return asRows(await sql.query(
      `select g.*, l.original_name, l.kind, l.public_url, l.storage, l.size_bytes
         from gallery_items g join media_library l on l.id = g.media_id
        order by g.sort_order, g.created_at desc`,
    ));
  });

export const saveGalleryItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    id?: string;
    mediaId: string;
    caption?: string;
    category?: string;
    published: boolean;
    sortOrder: number;
  }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    const id = data.id || newId();
    const found = await sql.query(`select id from gallery_items where id = $1`, [id]);
    if (found[0]) {
      await sql.query(
        `update gallery_items set media_id=$2, caption=$3, category=$4, published=$5, sort_order=$6 where id=$1`,
        [id, data.mediaId, data.caption || null, data.category || null, data.published, data.sortOrder],
      );
    } else {
      await sql.query(
        `insert into gallery_items (id, media_id, caption, category, published, sort_order)
         values ($1,$2,$3,$4,$5,$6)`,
        [id, data.mediaId, data.caption || null, data.category || null, data.published, data.sortOrder],
      );
    }
    await clearUsage("gallery", id);
    await recordUsage(data.mediaId, "gallery", id, "item");
    return { id };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await admin(context.userId);
    const sql = await getSql();
    await clearUsage("gallery", id);
    await sql.query(`delete from gallery_items where id = $1`, [id]);
    return { ok: true };
  });

export const listMediaAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((q?: string) => q ?? "")
  .handler(async ({ context, data: q }) => {
    await admin(context.userId);
    const sql = await getSql();
    const rows = q
      ? await sql.query(
          `select * from media_library
            where original_name ilike $1 or filename ilike $1 or kind ilike $1
            order by created_at desc limit 200`,
          [`%${q}%`],
        )
      : await sql.query(`select * from media_library order by created_at desc limit 200`);
    const items: (MediaRecord & { usage: { entity_type: string; entity_id: string; field: string }[] })[] =
      [];
    for (const row of rows) {
      const rec = rowToMedia(row as Record<string, unknown>);
      const usage = await listMediaUsage(rec.id);
      items.push({ ...rec, usage });
    }
    return items;
  });

export const renameMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; name: string; altText?: string; caption?: string }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(
      `update media_library set original_name=$2, filename=$2, alt_text=$3, caption=$4 where id=$1`,
      [data.id, data.name.trim(), data.altText ?? null, data.caption ?? null],
    );
    return getMediaById(data.id);
  });

export const removeMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; force?: boolean }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    return deleteMedia(data.id, Boolean(data.force));
  });

export const listEnquiriesAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    return asRows(await sql.query(
      `select id, kind, full_name, company_name, phone, whatsapp, email, machine_name, quantity, location, status, created_at
         from enquiries order by created_at desc`,
    ));
  });

export const getEnquiryAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await admin(context.userId);
    const sql = await getSql();
    const rows = await sql.query(`select * from enquiries where id = $1`, [id]);
    if (!rows[0]) return null;
    const files = await sql.query(
      `select l.id, l.original_name, l.mime_type, l.size_bytes, l.storage, l.public_url
         from enquiry_files ef join media_library l on l.id = ef.media_id
        where ef.enquiry_id = $1`,
      [id],
    );
    return { enquiry: asRow(rows[0]), files: asRows(files) };
  });

export const updateEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: EnquiryStatus }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(`update enquiries set status = $2 where id = $1`, [data.id, data.status]);
    return { ok: true };
  });

export const exportEnquiriesCsv = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    const rows = await sql.query(`select * from enquiries order by created_at desc`);
    const header = [
      "id",
      "kind",
      "full_name",
      "company_name",
      "phone",
      "whatsapp",
      "email",
      "machine_name",
      "quantity",
      "location",
      "requirements",
      "message",
      "status",
      "created_at",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [header.join(",")];
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      lines.push(header.map((h) => esc(r[h])).join(","));
    }
    return { csv: lines.join("\n") };
  });

export const listPageSeoAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const sql = await getSql();
    return asRows(await sql.query(`select * from page_seo order by path`));
  });

export const savePageSeo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { path: string; title: string; description: string }) => input)
  .handler(async ({ context, data }) => {
    await admin(context.userId);
    const sql = await getSql();
    await sql.query(
      `insert into page_seo (path, title, description) values ($1,$2,$3)
       on conflict (path) do update set title = excluded.title, description = excluded.description`,
      [data.path, data.title, data.description],
    );
    return { ok: true };
  });

export type { CompanyPublic };
