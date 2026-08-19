import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { archiveService, listServicesAdmin, saveService, tryAdmin } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@tanstack/react-router";
import { uploadFile } from "@/lib/upload-client";

export const Route = createFileRoute("/admin/services")({
  loader: () => tryAdmin(() => listServicesAdmin(), []),
  component: ServicesAdmin,
});

type Row = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  published: boolean;
  archived: boolean;
  sort_order: number;
};

function ServicesAdmin() {
  const rows = Route.useLoaderData() as Row[];
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  async function save() {
    if (!editing?.title) return;
    try {
      await saveService({
        data: {
          id: editing.id,
          title: editing.title,
          slug: editing.slug,
          summary: editing.summary ?? "",
          body: editing.body ?? "",
          imageUrl: editing.image_url ?? "",
          published: Boolean(editing.published),
          sortOrder: Number(editing.sort_order ?? 10),
        },
      });
      toast.success("Service saved.");
      setEditing(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase">Services</h1>
          <p className="text-steel">Unpublished services stay off the public site until you confirm them.</p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            setEditing({ title: "", slug: "", summary: "", body: "", published: false, sort_order: 90 })
          }
        >
          Add service
        </Button>
      </div>
      <ul className="mt-6 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 bg-paper p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-steel">{r.summary}</p>
            </div>
            {r.archived ? <Badge tone="muted">Archived</Badge> : r.published ? <Badge tone="ok">Published</Badge> : <Badge tone="warn">Draft</Badge>}
            <button type="button" className="text-sm underline" onClick={() => setEditing(r)}>
              Edit
            </button>
            <button
              type="button"
              className="text-sm text-accent underline"
              onClick={async () => {
                if (!confirm(r.archived ? "Restore this service?" : "Archive this service?")) return;
                await archiveService({ data: { id: r.id, archived: !r.archived } });
                await router.invalidate();
              }}
            >
              {r.archived ? "Restore" : "Archive"}
            </button>
          </li>
        ))}
      </ul>
      {editing ? (
        <div className="mt-8 space-y-3 bg-paper p-5">
          <h2 className="font-display text-2xl uppercase">{editing.id ? "Edit service" : "New service"}</h2>
          <div>
            <Label>Title</Label>
            <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div>
            <Label>Summary</Label>
            <Input value={editing.summary ?? ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
          </div>
          <div>
            <Label>Image</Label>
            {editing.image_url ? <img src={editing.image_url} alt="" className="mb-2 h-24 object-cover" /> : null}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const up = await uploadFile(f);
                  setEditing({ ...editing, image_url: up.url || `/api/media/${up.id}` });
                  toast.success("Image uploaded successfully.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
                }
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(editing.published)}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
            />
            Published
          </label>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void save()}>
              Save
            </Button>
            <Button type="button" variant="outlineInk" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
