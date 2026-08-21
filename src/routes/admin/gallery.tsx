import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { deleteGalleryItem, listGalleryAdmin, saveGalleryItem, tryAdmin } from "@/lib/server/admin";
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

  async function uploadGalleryFiles(files: FileList | null, isVideo: boolean) {
    for (const file of Array.from(files ?? [])) {
      try {
        const up = await uploadFile(file);
        await saveGalleryItem({
          data: {
            mediaId: up.id,
            caption: "",
            category: isVideo ? "Machine videos" : "Workshop photos",
            published: true,
            sortOrder: 10,
          },
        });
        toast.success(`${isVideo ? "Video" : "Image"} uploaded successfully.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    }
    await router.invalidate();
  }

  const images = rows.filter((r) => r.kind !== "video");
  const videos = rows.filter((r) => r.kind === "video");

  const renderItem = (r: (typeof rows)[number]) => (
    <figure key={r.id} className="bg-paper p-2">
      {r.kind === "video" ? (
        <video
          src={r.public_url || `/api/media/${r.media_id}`}
          controls
          className="aspect-[4/3] w-full bg-navy"
        />
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
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-4xl uppercase">Gallery</h1>
        <p className="text-steel">Keep workshop images and machine videos completely separate.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="cursor-pointer border border-ink/15 bg-paper p-5">
          <span className="block font-display text-lg uppercase">Add Images</span>
          <span className="mt-1 block text-sm text-steel">Select photos only.</span>
          <span className="mt-4 inline-block bg-accent px-4 py-2 font-display text-sm uppercase tracking-wide text-fg">
            Select Images
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => uploadGalleryFiles(e.target.files, false)}
          />
        </label>

        <label className="cursor-pointer border border-ink/15 bg-paper p-5">
          <span className="block font-display text-lg uppercase">Add Videos</span>
          <span className="mt-1 block text-sm text-steel">Select videos only.</span>
          <span className="mt-4 inline-block bg-accent px-4 py-2 font-display text-sm uppercase tracking-wide text-fg">
            Select Videos
          </span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            multiple
            onChange={(e) => uploadGalleryFiles(e.target.files, true)}
          />
        </label>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase">Images</h2>
            <p className="text-sm text-steel">Workshop and machinery photos only.</p>
          </div>
          <Badge tone="ok">{images.length} Images</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.length === 0 ? <p className="bg-paper p-6">No images yet.</p> : images.map(renderItem)}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase">Videos</h2>
            <p className="text-sm text-steel">Machine videos only.</p>
          </div>
          <Badge tone="ok">{videos.length} Videos</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.length === 0 ? <p className="bg-paper p-6">No videos yet.</p> : videos.map(renderItem)}
        </div>
      </section>
    </div>
  );
}
