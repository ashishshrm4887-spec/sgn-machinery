import { createFileRoute } from "@tanstack/react-router";
import { getMediaById, getMediaBytes } from "@/lib/server/media";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
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
        return new Response(Buffer.from(blob.bytes), {
          status: 200,
          headers: {
            "content-type": blob.mime,
            "content-disposition": `inline; filename="${blob.filename.replace(/"/g, "")}"`,
            "cache-control": "public, max-age=31536000, immutable",
            "content-length": String(blob.bytes.byteLength),
          },
        });
      },
    },
  },
});
