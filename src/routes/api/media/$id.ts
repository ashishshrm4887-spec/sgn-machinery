import { createFileRoute } from "@tanstack/react-router";
import { getMediaById, getMediaBytes, sanitizeFilename } from "@/lib/server/media";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!id || id.length > 64 || /[^a-zA-Z0-9_-]/.test(id)) {
          return new Response("Not found", { status: 404 });
        }
        const meta = await getMediaById(id);
        if (!meta) {
          return new Response("Not found", { status: 404 });
        }
        if (meta.storage === "blob" && meta.publicUrl) {
          return Response.redirect(meta.publicUrl, 302);
        }
        if (meta.storage === "public" && meta.publicUrl) {
          return Response.redirect(meta.publicUrl, 302);
        }
        const blob = await getMediaBytes(id);
        if (!blob) {
          return new Response("Not found", { status: 404 });
        }
        const safeName = sanitizeFilename(blob.filename).replace(/"/g, "");
        return new Response(Buffer.from(blob.bytes), {
          status: 200,
          headers: {
            "content-type": blob.mime,
            "content-disposition": `inline; filename="${safeName}"`,
            "cache-control": "public, max-age=31536000, immutable",
            "content-length": String(blob.bytes.byteLength),
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
