import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { isAdminUser } from "@/lib/server/admin-guard";
import { saveMediaFile, UploadError } from "@/lib/server/media";

/** Public enquiry attachment size limit (must stay aligned with media.ts). */
const PUBLIC_ENQUIRY_MAX_BYTES = 2 * 1024 * 1024;

/** In-process rate limit for public uploads (best-effort on serverless). */
const publicBuckets = new Map<string, { n: number; t: number }>();

function rateLimitPublic(key: string, limit = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const cur = publicBuckets.get(key);
  if (!cur || now - cur.t > windowMs) {
    publicBuckets.set(key, { n: 1, t: now });
    return;
  }
  if (cur.n >= limit) {
    throw new UploadError("Too many uploads. Please wait a few minutes or call us directly.");
  }
  cur.n += 1;
}

function clientKey(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export const Route = createFileRoute("/api/uploads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? undefined;
        const bearer = authHeader?.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7)
          : undefined;
        const user = await getSessionUser(bearer);

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json(
            { error: "Expected multipart form data with a file field." },
            { status: 400 },
          );
        }
        const file = form.get("file");
        const isPublic = form.get("public") === "1";

        if (!(file instanceof File)) {
          return Response.json({ error: "No file received." }, { status: 400 });
        }

        // Public path: enquiry attachments only — no admin, tight limits, rate-limited.
        // Admin path: require authenticated administrator.
        if (isPublic) {
          try {
            rateLimitPublic(`pub-upload:${clientKey(request)}`);
          } catch (err) {
            const message = err instanceof UploadError ? err.message : "Too many uploads.";
            return Response.json({ error: message }, { status: 429 });
          }
          if (file.size > PUBLIC_ENQUIRY_MAX_BYTES) {
            return Response.json(
              { error: "Enquiry attachment is too large. Maximum size is 2 MB." },
              { status: 400 },
            );
          }
        } else {
          if (!user || !(await isAdminUser(user.id))) {
            return Response.json(
              { error: "Administrator sign-in required." },
              { status: 401 },
            );
          }
        }

        try {
          const buffer = new Uint8Array(await file.arrayBuffer());
          const saved = await saveMediaFile({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            bytes: buffer,
            createdBy: user?.id ?? null,
            publicEnquiry: isPublic,
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
            err instanceof UploadError ? err.message : "Upload failed. Please try again.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
