import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";

const buckets = new Map<string, { n: number; t: number }>();

function rateLimit(key: string, limit = 6, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now - cur.t > windowMs) {
    buckets.set(key, { n: 1, t: now });
    return;
  }
  if (cur.n >= limit) {
    throw new Error("Too many submissions. Please wait a few minutes or call us directly.");
  }
  cur.n += 1;
}

const enquirySchema = z.object({
  kind: z.enum(["contact", "quote"]),
  fullName: z.string().trim().min(2, "Please enter your name.").max(120),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().min(8, "Please enter a phone number.").max(20),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  machineName: z.string().trim().max(200).optional().or(z.literal("")),
  quantity: z.string().trim().max(40).optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  requirements: z.string().trim().max(2000).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  fileIds: z.array(z.string().max(64)).max(6).optional(),
  website: z.string().optional(), // honeypot
});

const ENQUIRY_FILE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
]);

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => enquirySchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const, id: "ignored" };
    rateLimit(`enquiry:${data.phone}`);
    const id = newId();
    const sql = await getSql();

    const fileIds = data.fileIds ?? [];
    const validMediaIds: string[] = [];
    for (const mediaId of fileIds) {
      if (!/^[a-zA-Z0-9_-]+$/.test(mediaId)) continue;
      const rows = await sql.query<{ mime_type: string }>(
        `select mime_type from media_library where id = $1 and public_enquiry = true`,
        [mediaId],
      );
      const mime = rows[0]?.mime_type;
      if (mime && ENQUIRY_FILE_MIME.has(mime)) {
        validMediaIds.push(mediaId);
      }
    }

    await sql.query(
      `insert into enquiries
        (id, kind, full_name, company_name, phone, whatsapp, email, machine_name, quantity, location, requirements, message, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'new')`,
      [
        id,
        data.kind,
        data.fullName,
        data.companyName || null,
        data.phone,
        data.whatsapp || null,
        data.email || null,
        data.machineName || null,
        data.quantity || null,
        data.location || null,
        data.requirements || null,
        data.message || null,
      ],
    );
    for (const mediaId of validMediaIds) {
      await sql.query(`insert into enquiry_files (id, enquiry_id, media_id) values ($1,$2,$3)`, [
        newId(),
        id,
        mediaId,
      ]);
    }
    return { ok: true as const, id };
  });
