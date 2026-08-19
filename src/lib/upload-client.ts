import { getBearerToken } from "@/lib/auth/client";

export type UploadedFile = {
  id: string;
  url: string | null;
  kind: "image" | "video" | "pdf" | "other";
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export async function uploadFile(file: File, opts?: { publicEnquiry?: boolean }): Promise<UploadedFile> {
  const body = new FormData();
  body.set("file", file);
  if (opts?.publicEnquiry) body.set("public", "1");
  const headers = new Headers();
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch("/api/uploads", { method: "POST", body, headers });
  const json = (await res.json()) as UploadedFile & { error?: string };
  if (!res.ok || !json.id) {
    throw new Error(json.error || "Upload failed. Please try again.");
  }
  return json;
}
