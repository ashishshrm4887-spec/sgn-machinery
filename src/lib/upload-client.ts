import { getBearerToken } from "@/lib/auth/client";

export type UploadedFile = {
  id: string;
  url: string | null;
  kind: "image" | "video" | "pdf" | "other";
  name: string;
  mimeType: string;
  sizeBytes: number;
};

const EXT_OK = /\.(jpe?g|png|webp|avif|gif|svg|mp4|webm|mov|pdf)$/i;

/** Soft client limit: Vercel serverless request body is ~4.5 MB without Blob storage. */
const CLIENT_MAX_BYTES = 4 * 1024 * 1024;

export async function uploadFile(file: File, opts?: { publicEnquiry?: boolean }): Promise<UploadedFile> {
  if (!EXT_OK.test(file.name)) {
    throw new Error(
      "This file type is not allowed. Use JPG/PNG image, MP4/MOV/WebM video, or PDF.",
    );
  }
  if (file.size > CLIENT_MAX_BYTES) {
    throw new Error(
      "File is too large for upload (max about 4 MB on this server). Compress the video or use a shorter clip.",
    );
  }

  const body = new FormData();
  body.set("file", file);
  if (opts?.publicEnquiry) body.set("public", "1");
  const headers = new Headers();
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch("/api/uploads", { method: "POST", body, headers });
  } catch {
    throw new Error("Network error while uploading. Please try again.");
  }

  let json: UploadedFile & { error?: string };
  try {
    json = (await res.json()) as UploadedFile & { error?: string };
  } catch {
    throw new Error(
      res.status === 413
        ? "File is too large for the server. Use a video under 4 MB."
        : "Upload failed. Please try a smaller MP4 file.",
    );
  }

  if (!res.ok || !json.id) {
    throw new Error(json.error || "Upload failed. Please try again.");
  }
  return json;
}
