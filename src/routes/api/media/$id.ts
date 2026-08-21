import { createFileRoute } from "@tanstack/react-router";
import { getMediaById, getMediaBytes, sanitizeFilename } from "@/lib/server/media";

function parseRange(rangeHeader: string | null, size: number): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;
  const part = rangeHeader.slice(6).split(",")[0]?.trim();
  if (!part) return null;
  const [startStr, endStr] = part.split("-");
  let start = startStr === "" ? NaN : Number(startStr);
  let end = endStr === "" || endStr === undefined ? size - 1 : Number(endStr);
  if (Number.isNaN(start)) {
    const suffix = Number(endStr);
    if (Number.isNaN(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || start >= size) return null;
  end = Math.min(end, size - 1);
  if (end < start) return null;
  return { start, end };
}

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.id;
        if (!id || id.length > 64 || /[^a-zA-Z0-9_-]/.test(id)) return new Response("Not found", { status: 404 });
        const meta = await getMediaById(id);
        if (!meta) return new Response("Not found", { status: 404 });

        // External media must never be proxied through the Vercel function.
        if ((meta.storage === "cloudinary" || meta.storage === "blob" || meta.storage === "public") && meta.publicUrl) {
          return Response.redirect(meta.publicUrl, 302);
        }

        const blob = await getMediaBytes(id);
        if (!blob || !blob.bytes.length) return new Response("Not found", { status: 404 });

        const bytes = blob.bytes;
        const size = bytes.byteLength;
        const safeName = sanitizeFilename(blob.filename).replace(/"/g, "");
        const contentType = blob.mime || "application/octet-stream";
        const range = parseRange(request.headers.get("range"), size);

        if (!range) {
          return new Response(Buffer.from(bytes), {
            status: 200,
            headers: {
              "content-type": contentType,
              "content-disposition": `inline; filename="${safeName}"`,
              "cache-control": "public, max-age=31536000, immutable",
              "content-length": String(size),
              "accept-ranges": "bytes",
              "x-content-type-options": "nosniff",
            },
          });
        }

        const { start, end } = range;
        const chunk = bytes.slice(start, end + 1);
        return new Response(Buffer.from(chunk), {
          status: 206,
          headers: {
            "content-type": contentType,
            "content-disposition": `inline; filename="${safeName}"`,
            "cache-control": "public, max-age=31536000, immutable",
            "content-length": String(chunk.byteLength),
            "content-range": `bytes ${start}-${end}/${size}`,
            "accept-ranges": "bytes",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
