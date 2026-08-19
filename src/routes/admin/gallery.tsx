import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { deleteGalleryItem, listGalleryAdmin, saveGalleryItem, tryAdmin } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { uploadFile } from "@/lib/upload-client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/gallery")({
  loader: () => tryAdmin(() => listGalleryAdmin(), []),
  component: GalleryAdmin,
});

function GalleryAdmin() {
  const rows = Route.useLoaderData() as {
    id: string;
    media_id: string;
    caption: string | null;
    category: string | null;
    published: boolean;
    sort_order: number;
    kind: string;
    public_url: string | null;
    original_name: string;
  }[];
  const router = useRouter();

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase">Gallery</h1>
          <p className="text-steel">Upload, caption, publish, and reorder gallery items.</p>
        </div>
        <label className="cursor-pointer bg-accent px-4 py-2 font-display text-sm uppercase tracking-wide text-fg">
          Upload
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            multiple
            onChange={async (e) => {
              for (const file of Array.from(e.target.files ?? [])) {
                try {
                  const up = await uploadFile(file);
                  await saveGalleryItem({
                    data: {
                      mediaId: up.id,
                      caption: "",
                      category: file.type.startsWith("video") ? "Machine videos" : "Workshop photos",
                      published: true,
                      sortOrder: 10,
                    },
                  });
                  toast.success("Image uploaded successfully.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
                }
              }
              await router.invalidate();
            }}
          />
        </label>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 ? <p className="bg-paper p-6">No gallery items yet.</p> : null}
        {rows.map((r) => (
          <figure key={r.id} className="bg-paper p-2">
            {r.kind === "video" ? (
              <video src={r.public_url || `/api/media/${r.media_id}`} className="aspect-[4/3] w-full bg-navy" />
            ) : (
              <img
                src={r.public_url || `/api/media/${r.media_id}`}
                alt={r.caption || r.original_name}
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <input
              className="mt-2 h-10 w-full border border-ink/15 px-2 text-sm"
              defaultValue={r.caption ?? ""}
              placeholder="Caption"
              onBlur={async (e) => {
                await saveGalleryItem({
                  data: {
                    id: r.id,
                    mediaId: r.media_id,
                    caption: e.target.value,
                    category: r.category ?? "",
                    published: r.published,
                    sortOrder: r.sort_order,
                  },
                });
                toast.success("Caption saved.");
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              {r.published ? <Badge tone="ok">Published</Badge> : <Badge tone="warn">Hidden</Badge>}
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className="underline"
                  onClick={async () => {
                    await saveGalleryItem({
                      data: {
                        id: r.id,
                        mediaId: r.media_id,
                        caption: r.caption ?? "",
                        category: r.category ?? "",
                        published: !r.published,
                        sortOrder: r.sort_order,
                      },
                    });
                    await router.invalidate();
                  }}
                >
                  {r.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="text-accent underline"
                  onClick={async () => {
                    if (!confirm("Remove this gallery item? The file stays in the media library.")) return;
                    await deleteGalleryItem({ data: r.id });
                    await router.invalidate();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
