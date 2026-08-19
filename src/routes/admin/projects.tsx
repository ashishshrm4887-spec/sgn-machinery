import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { archiveProject, getProjectAdmin, listProjectsAdmin, saveProject, tryAdmin } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@tanstack/react-router";
import { uploadFile } from "@/lib/upload-client";

export const Route = createFileRoute("/admin/projects")({
  loader: () => tryAdmin(() => listProjectsAdmin(), []),
  component: ProjectsAdmin,
});

type Row = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  machine_name: string | null;
  client_name: string | null;
  location: string | null;
  year_label: string | null;
  published: boolean;
  archived: boolean;
  sort_order: number;
};

function ProjectsAdmin() {
  const rows = Route.useLoaderData() as Row[];
  const router = useRouter();
  const [form, setForm] = useState<
    | null
    | (Partial<Row> & { mediaIds: string[]; previews: string[] })
  >(null);

  async function open(id?: string) {
    if (!id) {
      setForm({
        title: "",
        description: "",
        machine_name: "",
        client_name: "",
        location: "",
        year_label: "",
        published: false,
        sort_order: 10,
        mediaIds: [],
        previews: [],
      });
      return;
    }
    const data = await getProjectAdmin({ data: id });
    if (!data) return;
    const p = data.project as Row;
    const media = data.media as { media_id: string; public_url: string | null }[];
    setForm({
      ...p,
      mediaIds: media.map((m) => m.media_id),
      previews: media.map((m) => m.public_url || `/api/media/${m.media_id}`),
    });
  }

  async function save() {
    if (!form?.title) return;
    try {
      await saveProject({
        data: {
          id: form.id,
          title: form.title,
          description: form.description ?? "",
          machineName: form.machine_name ?? "",
          clientName: form.client_name ?? "",
          location: form.location ?? "",
          yearLabel: form.year_label ?? "",
          published: Boolean(form.published),
          sortOrder: Number(form.sort_order ?? 10),
          mediaIds: form.mediaIds,
        },
      });
      toast.success("Project saved.");
      setForm(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase">Projects</h1>
          <p className="text-steel">Client names stay off the public site unless you enter them here.</p>
        </div>
        <Button size="sm" onClick={() => void open()}>
          Add project
        </Button>
      </div>
      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? <p className="bg-paper p-6">No projects yet. Add your first project.</p> : null}
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 bg-paper p-4">
            <div className="flex-1">
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-steel">{r.machine_name}</p>
            </div>
            {r.archived ? <Badge tone="muted">Archived</Badge> : r.published ? <Badge tone="ok">Published</Badge> : <Badge tone="warn">Draft</Badge>}
            <button type="button" className="text-sm underline" onClick={() => void open(r.id)}>
              Edit
            </button>
            <button
              type="button"
              className="text-sm text-accent underline"
              onClick={async () => {
                if (!confirm(r.archived ? "Restore this project?" : "Archive this project?")) return;
                await archiveProject({ data: { id: r.id, archived: !r.archived } });
                await router.invalidate();
              }}
            >
              {r.archived ? "Restore" : "Archive"}
            </button>
          </li>
        ))}
      </ul>
      {form ? (
        <div className="mt-8 space-y-3 bg-paper p-5">
          <h2 className="font-display text-2xl uppercase">{form.id ? "Edit project" : "New project"}</h2>
          <div>
            <Label>Title</Label>
            <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Machine used</Label>
              <Input value={form.machine_name ?? ""} onChange={(e) => setForm({ ...form, machine_name: e.target.value })} />
            </div>
            <div>
              <Label>Year</Label>
              <Input value={form.year_label ?? ""} onChange={(e) => setForm({ ...form, year_label: e.target.value })} />
            </div>
            <div>
              <Label>Client (optional)</Label>
              <Input value={form.client_name ?? ""} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Photos / videos</Label>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                for (const f of files) {
                  try {
                    const up = await uploadFile(f);
                    setForm((cur) =>
                      cur
                        ? {
                            ...cur,
                            mediaIds: [...cur.mediaIds, up.id],
                            previews: [...cur.previews, up.url || `/api/media/${up.id}`],
                          }
                        : cur,
                    );
                    toast.success("Image uploaded successfully.");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
                  }
                }
              }}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {form.previews.map((src) => (
                <img key={src} src={src} alt="" className="h-16 w-20 object-cover" />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void save()}>
              Save
            </Button>
            <Button type="button" variant="outlineInk" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
