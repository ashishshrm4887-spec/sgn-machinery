import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { saveMachine } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { uploadFile } from "@/lib/upload-client";
import { newId, slugify } from "@/lib/utils";

export type MachineFormState = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  model: string;
  shortDescription: string;
  fullDescription: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  brochureMediaId: string | null;
  brochureName?: string;
  specs: { id?: string; label: string; value: string; sortOrder: number; published: boolean }[];
  features: { id?: string; body: string; sortOrder: number }[];
  applications: { id?: string; body: string; sortOrder: number }[];
  media: { id?: string; mediaId: string; role: "main" | "gallery" | "video"; sortOrder: number; preview?: string; kind?: string }[];
};

export const emptyMachine = (): MachineFormState => ({
  name: "",
  slug: "",
  category: "",
  model: "",
  shortDescription: "",
  fullDescription: "",
  featured: false,
  published: false,
  sortOrder: 10,
  seoTitle: "",
  seoDescription: "",
  brochureMediaId: null,
  specs: [
    { label: "Model", value: "", sortOrder: 10, published: true },
    { label: "Sheet Size", value: "", sortOrder: 20, published: true },
    { label: "Automation Level", value: "", sortOrder: 30, published: false },
  ],
  features: [],
  applications: [],
  media: [],
});

export function MachineForm({ initial }: { initial: MachineFormState }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function patch<K extends keyof MachineFormState>(key: K, value: MachineFormState[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function addFile(file: File, role: "main" | "gallery" | "video" | "brochure") {
    try {
      const uploaded = await uploadFile(file);
      const url = uploaded.url || `/api/media/${uploaded.id}`;
      if (role === "brochure") {
        patch("brochureMediaId", uploaded.id);
        setData((d) => ({ ...d, brochureName: uploaded.name }));
      } else {
        setData((d) => ({
          ...d,
          media: [
            ...d.media,
            {
              mediaId: uploaded.id,
              role: role === "main" ? "main" : role,
              sortOrder: (d.media.length + 1) * 10,
              preview: url,
              kind: uploaded.kind,
            },
          ],
        }));
      }
      toast.success("File uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) {
      toast.error("Enter a machine name.");
      return;
    }
    setBusy(true);
    try {
      const result = await saveMachine({
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug || slugify(data.name),
          category: data.category,
          model: data.model,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          featured: data.featured,
          published: data.published,
          sortOrder: data.sortOrder,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          brochureMediaId: data.brochureMediaId,
          specs: data.specs,
          features: data.features.filter((f) => f.body.trim()),
          applications: data.applications.filter((f) => f.body.trim()),
          media: data.media,
        },
      });
      toast.success("Machine saved. Publish it to show it on the website.");
      navigate({ to: "/admin/machines/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the machine.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Machine name</Label>
          <Input
            value={data.name}
            onChange={(e) => {
              const name = e.target.value;
              setData((d) => ({ ...d, name, slug: d.id ? d.slug : slugify(name) }));
            }}
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={data.slug} onChange={(e) => patch("slug", e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <Input value={data.category} onChange={(e) => patch("category", e.target.value)} />
        </div>
        <div>
          <Label>Model</Label>
          <Input value={data.model} onChange={(e) => patch("model", e.target.value)} />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            type="number"
            value={data.sortOrder}
            onChange={(e) => patch("sortOrder", Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label>Short description</Label>
        <Textarea value={data.shortDescription} onChange={(e) => patch("shortDescription", e.target.value)} />
      </div>
      <div>
        <Label>Full description</Label>
        <Textarea value={data.fullDescription} onChange={(e) => patch("fullDescription", e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={data.published} onChange={(e) => patch("published", e.target.checked)} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={data.featured} onChange={(e) => patch("featured", e.target.checked)} />
          Featured on homepage
        </label>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase">Specifications</h2>
          <Button
            type="button"
            size="sm"
            variant="outlineInk"
            onClick={() =>
              patch("specs", [
                ...data.specs,
                { label: "", value: "", sortOrder: (data.specs.length + 1) * 10, published: true },
              ])
            }
          >
            Add spec
          </Button>
        </div>
        <p className="mb-3 text-sm text-steel">
          Leave a value empty and uncheck Published to keep unfinished data off the public page (for example Automation Level).
        </p>
        <div className="space-y-2">
          {data.specs.map((spec, i) => (
            <div key={spec.id ?? i} className="grid grid-cols-12 items-center gap-2">
              <Input
                className="col-span-4"
                placeholder="Label"
                value={spec.label}
                onChange={(e) => {
                  const next = [...data.specs];
                  next[i] = { ...spec, label: e.target.value };
                  patch("specs", next);
                }}
              />
              <Input
                className="col-span-5"
                placeholder="Value"
                value={spec.value}
                onChange={(e) => {
                  const next = [...data.specs];
                  next[i] = { ...spec, value: e.target.value };
                  patch("specs", next);
                }}
              />
              <label className="col-span-2 flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={spec.published}
                  onChange={(e) => {
                    const next = [...data.specs];
                    next[i] = { ...spec, published: e.target.checked };
                    patch("specs", next);
                  }}
                />
                Public
              </label>
              <button
                type="button"
                className="col-span-1 text-xs text-accent"
                onClick={() => patch("specs", data.specs.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <ListEditor
        title="Features"
        items={data.features}
        onChange={(features) => patch("features", features)}
      />
      <ListEditor
        title="Applications"
        items={data.applications}
        onChange={(applications) => patch("applications", applications)}
      />

      <section>
        <h2 className="font-display text-2xl uppercase">Media</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer bg-navy px-3 py-2 text-xs uppercase tracking-wide text-fg">
            Main / gallery image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addFile(f, data.media.some((m) => m.role === "main") ? "gallery" : "main");
              }}
            />
          </label>
          <label className="cursor-pointer bg-navy px-3 py-2 text-xs uppercase tracking-wide text-fg">
            Video
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addFile(f, "video");
              }}
            />
          </label>
          <label className="cursor-pointer bg-navy px-3 py-2 text-xs uppercase tracking-wide text-fg">
            Brochure PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void addFile(f, "brochure");
              }}
            />
          </label>
        </div>
        {data.brochureName || data.brochureMediaId ? (
          <p className="mt-2 text-sm">Brochure attached{data.brochureName ? `: ${data.brochureName}` : ""}.</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {data.media.map((m, i) => (
            <li key={m.mediaId} className="flex items-center gap-3 bg-paper p-2">
              {m.kind !== "video" && m.preview ? (
                <img src={m.preview} alt="" className="h-12 w-16 object-cover" />
              ) : (
                <span className="grid h-12 w-16 place-items-center bg-navy text-[10px] uppercase text-fg">
                  {m.role}
                </span>
              )}
              <select
                value={m.role}
                className="h-10 border border-ink/15 bg-paper px-2 text-sm"
                onChange={(e) => {
                  const next = [...data.media];
                  next[i] = { ...m, role: e.target.value as typeof m.role };
                  patch("media", next);
                }}
              >
                <option value="main">Main</option>
                <option value="gallery">Gallery</option>
                <option value="video">Video</option>
              </select>
              <button
                type="button"
                className="ml-auto text-sm text-accent underline"
                onClick={() => patch("media", data.media.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>SEO title</Label>
          <Input value={data.seoTitle} onChange={(e) => patch("seoTitle", e.target.value)} />
        </div>
        <div>
          <Label>SEO description</Label>
          <Input value={data.seoDescription} onChange={(e) => patch("seoDescription", e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save machine"}
      </Button>
    </form>
  );
}

function ListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: { id?: string; body: string; sortOrder: number }[];
  onChange: (items: { id?: string; body: string; sortOrder: number }[]) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">{title}</h2>
        <Button
          type="button"
          size="sm"
          variant="outlineInk"
          onClick={() => onChange([...items, { id: newId(), body: "", sortOrder: (items.length + 1) * 10 }])}
        >
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id ?? i} className="flex gap-2">
            <Input
              value={item.body}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...item, body: e.target.value };
                onChange(next);
              }}
            />
            <button type="button" className="text-accent" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
