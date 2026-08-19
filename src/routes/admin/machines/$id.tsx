import { createFileRoute, notFound } from "@tanstack/react-router";
import { getMachineAdmin, tryAdmin } from "@/lib/server/admin";
import { MachineForm, type MachineFormState } from "@/components/admin/machine-form";

export const Route = createFileRoute("/admin/machines/$id")({
  loader: async ({ params }) => {
    const data = await tryAdmin(() => getMachineAdmin({ data: params.id }), null);
    if (!data) throw notFound();
    return data;
  },
  component: EditMachinePage,
});

function EditMachinePage() {
  const data = Route.useLoaderData();
  const m = data.machine as Record<string, unknown>;
  const initial: MachineFormState = {
    id: String(m.id),
    name: String(m.name),
    slug: String(m.slug),
    category: String(m.category ?? ""),
    model: String(m.model ?? ""),
    shortDescription: String(m.short_description ?? ""),
    fullDescription: String(m.full_description ?? ""),
    featured: Boolean(m.featured),
    published: Boolean(m.published),
    sortOrder: Number(m.sort_order),
    seoTitle: String(m.seo_title ?? ""),
    seoDescription: String(m.seo_description ?? ""),
    brochureMediaId: (m.brochure_media_id as string | null) ?? null,
    specs: (data.specs as Record<string, unknown>[]).map((s) => ({
      id: String(s.id),
      label: String(s.label),
      value: String(s.value),
      sortOrder: Number(s.sort_order),
      published: Boolean(s.published),
    })),
    features: (data.features as Record<string, unknown>[]).map((s) => ({
      id: String(s.id),
      body: String(s.body),
      sortOrder: Number(s.sort_order),
    })),
    applications: (data.applications as Record<string, unknown>[]).map((s) => ({
      id: String(s.id),
      body: String(s.body),
      sortOrder: Number(s.sort_order),
    })),
    media: (data.media as Record<string, unknown>[]).map((s) => ({
      id: String(s.id),
      mediaId: String(s.media_id),
      role: s.role as MachineFormState["media"][number]["role"],
      sortOrder: Number(s.sort_order),
      preview: String(s.public_url || `/api/media/${s.media_id}`),
      kind: String(s.kind),
    })),
  };
  return (
    <div>
      <h1 className="mb-6 font-display text-4xl uppercase">Edit machine</h1>
      <MachineForm initial={initial} />
    </div>
  );
}
