import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import type { MediaKind, MediaRecord } from "@/lib/types";

export const ALLOWED_MIME: Record<string, MediaKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/avif": "image",
  "image/gif": "image",
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "application/pdf": "pdf",
};

export const PUBLIC_ENQUIRY_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
]);

const ALLOWED_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
};

export const MAX_BYTES: Record<MediaKind, number> = {
  image: 8 * 1024 * 1024,
  video: 32 * 1024 * 1024,
  pdf: 15 * 1024 * 1024,
  other: 2 * 1024 * 1024,
};

export const PUBLIC_ENQUIRY_MAX_BYTES = 4 * 1024 * 1024;
export const SERVERLESS_SAFE_BYTES = 4 * 1024 * 1024;

const MAGIC: { kind: MediaKind; mime: string; test: (b: Uint8Array) => boolean }[] = [
  { kind: "image", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { kind: "image", mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { kind: "image", mime: "image/gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { kind: "image", mime: "image/webp", test: (b) => b.length >= 12 && b[0] === 0x52 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 },
  { kind: "video", mime: "video/mp4", test: (b) => b.length >= 8 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },
  { kind: "pdf", mime: "application/pdf", test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export function mediaPublicPath(id: string): string {
  return `/api/media/${id}`;
}

export function sanitizeFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "file";
  let cleaned = "";
  for (const ch of base) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    cleaned += '<>:"|?*'.includes(ch) ? "_" : ch;
  }
  cleaned = cleaned.trim().slice(0, 180);
  return cleaned || "file";
}

export function rowToMedia(row: Record<string, unknown>): MediaRecord {
  return {
    id: String(row.id),
    filename: String(row.filename),
    originalName: String(row.original_name),
    mimeType: String(row.mime_type),
    kind: row.kind as MediaKind,
    sizeBytes: Number(row.size_bytes),
    storage: row.storage as MediaRecord["storage"],
    publicUrl: (row.public_url as string | null) ?? null,
    altText: (row.alt_text as string | null) ?? null,
    caption: (row.caption as string | null) ?? null,
    createdAt: String(row.created_at),
    createdBy: (row.created_by as string | null) ?? null,
  };
}

export function resolveMediaUrl(
  row: { storage?: string | null; public_url?: string | null; id?: string | null } | null | undefined,
): string | null {
  if (!row) return null;
  if (row.public_url && (row.storage === "cloudinary" || row.storage === "blob" || row.storage === "public")) {
    return row.public_url;
  }
  if (row.public_url?.startsWith("/")) return row.public_url;
  if (row.id) return mediaPublicPath(String(row.id));
  return row.public_url ?? null;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function sniffUpload(
  filename: string,
  declaredType: string,
  bytes: Uint8Array,
  opts?: { publicEnquiry?: boolean },
) {
  const ext = extOf(filename);
  const fromExt = ALLOWED_EXT[ext];
  if (!fromExt) throw new UploadError("This file type is not allowed. Use JPG/PNG/WebP image, MP4/MOV/WebM video, or PDF.");

  if (opts?.publicEnquiry) {
    if (ext === "svg") throw new UploadError("SVG files are not allowed on the enquiry form.");
    if (!PUBLIC_ENQUIRY_MIME.has(fromExt)) {
      throw new UploadError("Enquiry attachments must be JPG, PNG, WebP, MP4/WebM/MOV video, or PDF (max 4 MB).");
    }
  }

  const declared = declaredType.split(";")[0]?.trim().toLowerCase() || fromExt;
  if (!ALLOWED_MIME[declared] && declared !== fromExt && declared !== "application/octet-stream") {
    throw new UploadError("This file type is not allowed.");
  }

  if (ext === "svg") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (/<script[\s>]/i.test(text) || /\bon\w+\s*=/i.test(text) || /javascript\s*:/i.test(text) || /<foreignObject/i.test(text) || /(?:xlink:)?href\s*=\s*["']\s*https?:/i.test(text)) {
      throw new UploadError("This SVG is not allowed.");
    }
    return { mime: "image/svg+xml" as const, kind: "image" as const };
  }

  const magic = MAGIC.find((m) => bytes.length >= 12 && m.test(bytes));
  if (magic) {
    if (ext === "mov" || declared === "video/quicktime") return { mime: "video/quicktime" as const, kind: "video" as const };
    if (magic.mime !== fromExt && ALLOWED_MIME[magic.mime] !== ALLOWED_MIME[fromExt]) {
      throw new UploadError("The file contents do not match the file name.");
    }
    return { mime: magic.mime, kind: magic.kind };
  }
  if (fromExt === "video/webm" || fromExt === "video/quicktime" || fromExt === "image/avif" || fromExt === "image/webp") {
    return { mime: fromExt, kind: ALLOWED_MIME[fromExt] };
  }
  throw new UploadError("The file could not be verified. Use a standard image, MP4, MOV, WebM, or PDF.");
}

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function sha1(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

function cloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return sha1(`${canonical}${apiSecret}`);
}

async function uploadToCloudinary(opts: {
  filename: string;
  mime: string;
  bytes: Uint8Array;
}): Promise<{ publicId: string; resourceType: string; secureUrl: string }> {
  const config = cloudinaryConfig();
  if (!config) throw new UploadError("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the deployment environment.");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "sgn-machinery";
  const signature = cloudinarySignature({ folder, timestamp }, config.apiSecret);
  const form = new FormData();
  form.append("file", new Blob([Buffer.from(opts.bytes)], { type: opts.mime }), opts.filename);
  form.append("api_key", config.apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof data.secure_url !== "string" || typeof data.public_id !== "string") {
    const message = typeof data.error === "object" && data.error && "message" in data.error ? String((data.error as { message?: unknown }).message) : "Cloudinary upload failed.";
    throw new UploadError(message);
  }
  return {
    publicId: data.public_id,
    resourceType: typeof data.resource_type === "string" ? data.resource_type : "raw",
    secureUrl: data.secure_url,
  };
}

export async function saveMediaFile(opts: {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
  altText?: string;
  caption?: string;
  createdBy?: string | null;
  publicEnquiry?: boolean;
}): Promise<MediaRecord> {
  const safeName = sanitizeFilename(opts.filename);
  const sniffed = sniffUpload(safeName, opts.mimeType, opts.bytes, { publicEnquiry: opts.publicEnquiry });

  if (opts.publicEnquiry) {
    if (!PUBLIC_ENQUIRY_MIME.has(sniffed.mime) || opts.bytes.length > PUBLIC_ENQUIRY_MAX_BYTES) {
      throw new UploadError("Enquiry attachments must be JPG, PNG, WebP, MP4/WebM/MOV video, or PDF (max 4 MB).");
    }
  } else {
    const max = MAX_BYTES[sniffed.kind];
    if (opts.bytes.length > max) throw new UploadError(`That ${sniffed.kind} is too large. Maximum size is ${Math.round(max / (1024 * 1024))} MB.`);
  }

  const id = newId();
  const sql = await getSql();
  const cloud = cloudinaryConfig();

  // If Cloudinary is configured, all NEW media goes there. Existing DB media remains untouched.
  if (cloud) {
    const uploaded = await uploadToCloudinary({ filename: safeName, mime: sniffed.mime, bytes: opts.bytes });
    await sql.query(
      `insert into media_library
        (id, filename, original_name, mime_type, kind, size_bytes, storage, public_url, alt_text, caption, created_by, cloudinary_public_id, cloudinary_resource_type)
       values ($1,$2,$3,$4,$5,$6,'cloudinary',$7,$8,$9,$10,$11,$12)`,
      [id, safeName, safeName, sniffed.mime, sniffed.kind, opts.bytes.length, uploaded.secureUrl, opts.altText ?? null, opts.caption ?? null, opts.createdBy ?? null, uploaded.publicId, uploaded.resourceType],
    );
    return rowToMedia((await sql.query(`select * from media_library where id = $1`, [id]))[0] as Record<string, unknown>);
  }

  // Safe fallback for local/development environments before Cloudinary env vars are configured.
  const publicUrl = mediaPublicPath(id);
  await sql.query(
    `insert into media_library
      (id, filename, original_name, mime_type, kind, size_bytes, storage, public_url, alt_text, caption, created_by)
     values ($1,$2,$3,$4,$5,$6,'db',$7,$8,$9,$10)`,
    [id, safeName, safeName, sniffed.mime, sniffed.kind, opts.bytes.length, publicUrl, opts.altText ?? null, opts.caption ?? null, opts.createdBy ?? null],
  );
  try {
    await sql.query(`insert into media_blobs (media_id, bytes) values ($1, $2)`, [id, Buffer.from(opts.bytes)]);
  } catch (err) {
    await sql.query(`delete from media_library where id = $1`, [id]);
    throw err;
  }
  return rowToMedia((await sql.query(`select * from media_library where id = $1`, [id]))[0] as Record<string, unknown>);
}

export async function getMediaById(id: string): Promise<MediaRecord | null> {
  const sql = await getSql();
  const rows = await sql.query(`select * from media_library where id = $1`, [id]);
  return rows[0] ? rowToMedia(rows[0] as Record<string, unknown>) : null;
}

export async function getMediaBytes(id: string): Promise<{ bytes: Uint8Array; mime: string; filename: string } | null> {
  const sql = await getSql();
  const rows = await sql.query(
    `select m.mime_type, m.filename, b.bytes from media_library m join media_blobs b on b.media_id = m.id where m.id = $1`,
    [id],
  );
  const row = rows[0] as { mime_type: string; filename: string; bytes: unknown } | undefined;
  if (!row) return null;
  return { bytes: toUint8(row.bytes), mime: row.mime_type, filename: row.filename };
}

function toUint8(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (Buffer.isBuffer(value)) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") {
    const hex = value.startsWith("\\x") ? value.slice(2) : value;
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      return out;
    }
    return new TextEncoder().encode(value);
  }
  return new Uint8Array();
}

export async function listMediaUsage(mediaId: string) {
  const sql = await getSql();
  return sql.query<{ entity_type: string; entity_id: string; field: string }>(`select entity_type, entity_id, field from media_usage where media_id = $1`, [mediaId]);
}

export async function recordUsage(mediaId: string, entityType: string, entityId: string, field: string) {
  const sql = await getSql();
  await sql.query(`insert into media_usage (id, media_id, entity_type, entity_id, field) values ($1,$2,$3,$4,$5)`, [newId(), mediaId, entityType, entityId, field]);
}

export async function clearUsage(entityType: string, entityId: string, field?: string) {
  const sql = await getSql();
  if (field) {
    await sql.query(`delete from media_usage where entity_type = $1 and entity_id = $2 and field = $3`, [entityType, entityId, field]);
  } else {
    await sql.query(`delete from media_usage where entity_type = $1 and entity_id = $2`, [entityType, entityId]);
  }
}

export async function deleteMedia(id: string, force = false) {
  const usage = await listMediaUsage(id);
  if (usage.length && !force) return { ok: false as const, usage };

  const sql = await getSql();
  const rows = await sql.query(`select storage, cloudinary_public_id, cloudinary_resource_type from media_library where id = $1`, [id]);
  const row = rows[0] as { storage?: string; cloudinary_public_id?: string | null; cloudinary_resource_type?: string | null } | undefined;

  if (row?.storage === "cloudinary" && row.cloudinary_public_id && cloudinaryConfig()) {
    const config = cloudinaryConfig()!;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const resourceType = row.cloudinary_resource_type || "image";
    const signature = cloudinarySignature({ invalidate: "true", public_id: row.cloudinary_public_id, timestamp, type: "upload" }, config.apiSecret);
    const form = new URLSearchParams({ public_id: row.cloudinary_public_id, timestamp, invalidate: "true", type: "upload", api_key: config.apiKey, signature });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/destroy`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
    if (!response.ok) throw new UploadError("Cloudinary could not delete the media file.");
  } else {
    await sql.query(`delete from media_blobs where media_id = $1`, [id]);
  }

  await sql.query(`delete from media_usage where media_id = $1`, [id]);
  await sql.query(`delete from media_library where id = $1`, [id]);
  return { ok: true as const };
}
