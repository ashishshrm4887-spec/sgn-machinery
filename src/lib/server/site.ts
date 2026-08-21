import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { resolveMediaUrl } from "@/lib/server/media";
import type {
  CompanyPublic,
  GalleryItem,
  MachineCard,
  MachineDetail,
  ProjectItem,
  ServiceItem,
  SocialLink,
  SpecRow,
  WhyChooseItem,
} from "@/lib/types";

type CompanyRow = {
  company_name: string;
  business_line: string;
  tagline: string;
  about_short: string;
  about_full: string;
  engineering_focus: string;
  manufacturing_capabilities: string;
  logo_url: string;
  favicon_url: string;
  phones: string;
  whatsapp: string;
  email: string;
  address: string;
  maps_url: string;
  business_hours: string;
  hero_title: string;
  hero_description: string;
  hero_image_url: string;
  hero_video_url: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  why_choose_us: string;
  social_links: string;
  seo_title: string;
  seo_description: string;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function mapCompany(row: CompanyRow): CompanyPublic {
  return {
    companyName: row.company_name,
    businessLine: row.business_line,
    tagline: row.tagline,
    aboutShort: row.about_short,
    aboutFull: row.about_full,
    engineeringFocus: row.engineering_focus,
    manufacturingCapabilities: row.manufacturing_capabilities,
    logoUrl: row.logo_url || "/logo.svg",
    faviconUrl: row.favicon_url || "/favicon.svg",
    phones: parseJson<string[]>(row.phones, []),
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    mapsUrl: row.maps_url,
    businessHours: row.business_hours,
    heroTitle: row.hero_title,
    heroDescription: row.hero_description,
    heroImageUrl: row.hero_image_url || "/media/hero-workshop.jpg",
    heroVideoUrl: row.hero_video_url,
    heroCtaPrimary: row.hero_cta_primary || "Explore Machines",
    heroCtaSecondary: row.hero_cta_secondary || "Request a Quote",
    whyChooseUs: parseJson<WhyChooseItem[]>(row.why_choose_us, []),
    socialLinks: parseJson<SocialLink[]>(row.social_links, []),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

export async function loadCompany(): Promise<CompanyPublic> {
  const sql = await getSql();
  const rows = await sql.query<CompanyRow>(`select * from company_settings where id = 'default'`);
  if (!rows[0]) {
    throw new Error("Company settings are missing.");
  }
  return mapCompany(rows[0]);
}

async function highlightSpec(machineId: string): Promise<SpecRow | null> {
  const sql = await getSql();
  const rows = await sql.query<SpecRow & { sort_order: number }>(
    `select id, label, value, sort_order as "sortOrder", published
       from machine_specs
      where machine_id = $1 and published = true and value <> ''
      order by sort_order asc
      limit 1`,
    [machineId],
  );
  return rows[0]
    ? {
        id: String(rows[0].id),
        label: String((rows[0] as unknown as { label: string }).label),
        value: String((rows[0] as unknown as { value: string }).value),
        sortOrder: Number((rows[0] as unknown as { sortOrder: number }).sortOrder),
        published: true,
      }
    : null;
}

async function mainImageUrl(machineId: string): Promise<string | null> {
  const sql = await getSql();
  // Featured machine cards must use only the explicitly assigned `main` image.
  // Never select an arbitrary gallery image as the card image.
  const rows = await sql.query<{ storage: string; public_url: string | null; id: string }>(
    `select l.id, l.storage, l.public_url
       from machine_media mm
       join media_library l on l.id = mm.media_id
      where mm.machine_id = $1
        and mm.role = 'main'
        and l.kind = 'image'
      order by mm.sort_order asc
      limit 1`,
    [machineId],
  );
  return resolveMediaUrl(rows[0]);
}

type MachineRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  model: string | null;
  short_description: string | null;
  featured: boolean;
  published: boolean;
  archived: boolean;
  sort_order: number;
};

async function toCard(row: MachineRow): Promise<MachineCard> {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    model: row.model,
    shortDescription: row.short_description,
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    archived: Boolean(row.archived),
    sortOrder: Number(row.sort_order),
    imageUrl: await mainImageUrl(row.id),
    highlightSpec: await highlightSpec(row.id),
  };
}

export const getCompanyPublic = createServerFn({ method: "GET" }).handler(async () => {
  return loadCompany();
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const company = await loadCompany();
  const machineRows = await sql.query<MachineRow>(
    `select * from machines
      where published = true and archived = false and featured = true
      order by sort_order asc, name asc`,
  );
  const serviceRows = await sql.query<ServiceItem & { image_url: string | null; sort_order: number }>(
    `select id, title, slug, summary, body, image_url, published, sort_order
       from services
      where published = true and archived = false
      order by sort_order asc, title asc
      limit 6`,
  );
  const projectRows = await sql.query(
    `select * from projects
      where published = true and archived = false
      order by sort_order asc, created_at desc
      limit 3`,
  );
  const galleryRows = await sql.query(
    `select g.*, l.kind, l.storage, l.public_url, l.id as mid, l.alt_text
       from gallery_items g
       join media_library l on l.id = g.media_id
      where g.published = true
      order by g.sort_order asc, g.created_at desc
      limit 8`,
  );

  const machines = await Promise.all(machineRows.map(toCard));
  const services: ServiceItem[] = serviceRows.map((s) => ({
    id: String(s.id),
    title: String(s.title),
    slug: String(s.slug),
    summary: s.summary ?? null,
    body: s.body ?? null,
    imageUrl: (s as { image_url?: string | null }).image_url ?? null,
    published: true,
    sortOrder: Number((s as { sort_order?: number }).sort_order ?? 0),
  }));
  const projects = await Promise.all(
    projectRows.map((p) => toProject(p as Record<string, unknown>, false)),
  );
  const gallery = galleryRows.map((g) => toGallery(g as Record<string, unknown>));

  return { company, machines, services, projects, gallery };
});

export const listPublishedMachines = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<MachineRow>(
    `select * from machines
      where published = true and archived = false
      order by sort_order asc, name asc`,
  );
  return Promise.all(rows.map(toCard));
});

export const getMachineBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<MachineDetail | null> => {
    const sql = await getSql();
    const rows = await sql.query<MachineRow & { full_description: string | null; seo_title: string | null; seo_description: string | null; brochure_media_id: string | null }>(
      `select * from machines where slug = $1 and published = true and archived = false`,
      [slug],
    );
    const row = rows[0];
    if (!row) return null;

    const specs = await sql.query(
      `select id, label, value, sort_order, published
         from machine_specs
        where machine_id = $1
        order by sort_order asc`,
      [row.id],
    );
    const features = await sql.query(
      `select id, body, sort_order from machine_features where machine_id = $1 order by sort_order`,
      [row.id],
    );
    const applications = await sql.query(
      `select id, body, sort_order from machine_applications where machine_id = $1 order by sort_order`,
      [row.id],
    );
    const media = await sql.query(
      `select mm.id, mm.role, mm.sort_order, l.id as media_id, l.storage, l.public_url, l.alt_text, l.caption, l.kind
         from machine_media mm
         join media_library l on l.id = mm.media_id
        where mm.machine_id = $1
        order by mm.sort_order`,
      [row.id],
    );

    let brochureUrl: string | null = null;
    let brochureName: string | null = null;
    if (row.brochure_media_id) {
      const bro = await sql.query(
        `select id, storage, public_url, original_name from media_library where id = $1`,
        [row.brochure_media_id],
      );
      if (bro[0]) {
        brochureUrl = resolveMediaUrl(bro[0] as { id: string; storage: string; public_url: string });
        brochureName = String((bro[0] as { original_name: string }).original_name);
      }
    }

    const images = media
      .filter((m) => (m as { role: string }).role !== "video" && (m as { kind: string }).kind === "image")
      .map((m) => {
        const rec = m as Record<string, unknown>;
        return {
          id: String(rec.id),
          url: resolveMediaUrl({
            id: String(rec.media_id),
            storage: String(rec.storage),
            public_url: (rec.public_url as string | null) ?? null,
          })!,
          alt: String(rec.alt_text || row.name),
          caption: (rec.caption as string | null) ?? null,
        };
      });
    const videos = media
      .filter((m) => (m as { role: string }).role === "video" || (m as { kind: string }).kind === "video")
      .map((m) => {
        const rec = m as Record<string, unknown>;
        return {
          id: String(rec.id),
          url: resolveMediaUrl({
            id: String(rec.media_id),
            storage: String(rec.storage),
            public_url: (rec.public_url as string | null) ?? null,
          })!,
          posterUrl: images[0]?.url ?? null,
          caption: (rec.caption as string | null) ?? null,
        };
      });

    const card = await toCard(row);
    return {
      ...card,
      fullDescription: row.full_description,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      brochureUrl,
      brochureName,
      specs: specs
        .filter((s) => Boolean((s as { published: boolean }).published) && String((s as { value: string }).value).trim())
        .map((s) => ({
          id: String((s as { id: string }).id),
          label: String((s as { label: string }).label),
          value: String((s as { value: string }).value),
          sortOrder: Number((s as { sort_order: number }).sort_order),
          published: true,
        })),
      features: features.map((f) => ({
        id: String((f as { id: string }).id),
        body: String((f as { body: string }).body),
        sortOrder: Number((f as { sort_order: number }).sort_order),
      })),
      applications: applications.map((f) => ({
        id: String((f as { id: string }).id),
        body: String((f as { body: string }).body),
        sortOrder: Number((f as { sort_order: number }).sort_order),
      })),
      images,
      videos,
    };
  });

export const listRelatedMachines = createServerFn({ method: "GET" })
  .validator((input: { slug: string; category?: string | null }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<MachineRow>(
      `select * from machines
        where published = true and archived = false and slug <> $1
        order by case when category = $2 then 0 else 1 end, sort_order, name
        limit 3`,
      [data.slug, data.category ?? ""],
    );
    return Promise.all(rows.map(toCard));
  });

export const listPublishedServices = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query(
    `select * from services where published = true and archived = false order by sort_order, title`,
  );
  return rows.map((s) => {
    const r = s as Record<string, unknown>;
    return {
      id: String(r.id),
      title: String(r.title),
      slug: String(r.slug),
      summary: (r.summary as string | null) ?? null,
      body: (r.body as string | null) ?? null,
      imageUrl: (r.image_url as string | null) ?? null,
      published: true,
      sortOrder: Number(r.sort_order),
    } satisfies ServiceItem;
  });
});

async function toProject(r: Record<string, unknown>, withMedia: boolean): Promise<ProjectItem> {
  const sql = await getSql();
  let images: ProjectItem["images"] = [];
  let videos: ProjectItem["videos"] = [];
  if (withMedia) {
    const media = await sql.query(
      `select pm.id, pm.role, l.id as media_id, l.storage, l.public_url, l.alt_text, l.caption, l.kind
         from project_media pm join media_library l on l.id = pm.media_id
        where pm.project_id = $1
        order by pm.sort_order`,
      [r.id],
    );
    images = media
      .filter((m) => (m as { kind: string }).kind === "image")
      .map((m) => {
        const rec = m as Record<string, unknown>;
        return {
          id: String(rec.id),
          url: resolveMediaUrl({
            id: String(rec.media_id),
            storage: String(rec.storage),
            public_url: rec.public_url as string | null,
          })!,
          alt: String(rec.alt_text || r.title),
          caption: (rec.caption as string | null) ?? null,
        };
      });
    videos = media
      .filter((m) => (m as { kind: string }).kind === "video")
      .map((m) => {
        const rec = m as Record<string, unknown>;
        return {
          id: String(rec.id),
          url: resolveMediaUrl({
            id: String(rec.media_id),
            storage: String(rec.storage),
            public_url: rec.public_url as string | null,
          })!,
          posterUrl: images[0]?.url ?? null,
          caption: (rec.caption as string | null) ?? null,
        };
      });
  } else {
    const cover = await sql.query(
      `select l.id, l.storage, l.public_url
         from project_media pm join media_library l on l.id = pm.media_id
        where pm.project_id = $1 and l.kind = 'image'
        order by pm.sort_order limit 1`,
      [r.id],
    );
    if (cover[0]) {
      const url = resolveMediaUrl(cover[0] as { id: string; storage: string; public_url: string });
      if (url) images = [{ id: "cover", url, alt: String(r.title), caption: null }];
    }
  }
  return {
    id: String(r.id),
    title: String(r.title),
    slug: String(r.slug),
    description: (r.description as string | null) ?? null,
    machineName: (r.machine_name as string | null) ?? null,
    clientName: (r.client_name as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    yearLabel: (r.year_label as string | null) ?? null,
    published: Boolean(r.published),
    sortOrder: Number(r.sort_order),
    imageUrl: images[0]?.url ?? null,
    images,
    videos,
  };
}

function toGallery(r: Record<string, unknown>): GalleryItem {
  return {
    id: String(r.id),
    mediaId: String(r.media_id ?? r.mid),
    url: resolveMediaUrl({
      id: String(r.media_id ?? r.mid),
      storage: String(r.storage),
      public_url: r.public_url as string | null,
    })!,
    kind: (r.kind as GalleryItem["kind"]) ?? "image",
    caption: (r.caption as string | null) ?? null,
    category: (r.category as string | null) ?? null,
    published: Boolean(r.published),
    sortOrder: Number(r.sort_order),
    posterUrl: null,
  };
}

export const listPublishedProjects = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query(
    `select * from projects where published = true and archived = false order by sort_order, created_at desc`,
  );
  return Promise.all(rows.map((p) => toProject(p as Record<string, unknown>, false)));
});

export const getProjectBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const sql = await getSql();
    const rows = await sql.query(
      `select * from projects where slug = $1 and published = true and archived = false`,
      [slug],
    );
    if (!rows[0]) return null;
    return toProject(rows[0] as Record<string, unknown>, true);
  });

export const listPublishedGallery = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query(
    `select g.*, l.kind, l.storage, l.public_url, l.id as mid
       from gallery_items g join media_library l on l.id = g.media_id
      where g.published = true
      order by g.sort_order, g.created_at desc`,
  );
  return rows.map((g) => toGallery(g as Record<string, unknown>));
});

export const listMachineOptions = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql.query<{ id: string; name: string; slug: string }>(
    `select id, name, slug from machines
      where published = true and archived = false
      order by sort_order, name`,
  );
});

export const getPageSeo = createServerFn({ method: "GET" })
  .validator((path: string) => path)
  .handler(async ({ data: path }) => {
    const sql = await getSql();
    const rows = await sql.query<{ title: string | null; description: string | null }>(
      `select title, description from page_seo where path = $1`,
      [path],
    );
    return rows[0] ?? { title: null, description: null };
  });