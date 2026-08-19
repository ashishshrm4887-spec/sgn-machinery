import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { isAdminUser } from "@/lib/server/admin-guard";
import { saveMediaFile, UploadError } from "@/lib/server/media";

export const Route = createFileRoute("/api/uploads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? undefined;
        const bearer = authHeader?.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7)
          : undefined;
        const user = await getSessionUser(bearer);
        const form = await request.formData();
        const file = form.get("file");
        const isPublic = form.get("public") === "1";
        if (!(file instanceof File)) {
          return Response.json({ error: "No file received." }, { status: 400 });
        }
        if (!isPublic) {
          if (!user || !(await isAdminUser(user.id))) {
            return Response.json({ error: "Administrator sign-in required." }, { status: 401 });
          }
        } else if (file.size > 12 * 1024 * 1024) {
          return Response.json({ error: "That file is too large." }, { status: 400 });
        }
        try {
          const buffer = new Uint8Array(await file.arrayBuffer());
          const saved = await saveMediaFile({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            bytes: buffer,
            createdBy: user?.id ?? null,
          });
          return Response.json({
            id: saved.id,
            url: saved.publicUrl,
            kind: saved.kind,
            name: saved.originalName,
            mimeType: saved.mimeType,
            sizeBytes: saved.sizeBytes,
          });
        } catch (err) {
          const message =
            err instanceof UploadError
              ? err.message
              : "Upload failed. Please try again.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
