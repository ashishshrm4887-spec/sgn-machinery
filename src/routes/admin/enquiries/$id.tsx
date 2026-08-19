import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getEnquiryAdmin, updateEnquiryStatus, tryAdmin } from "@/lib/server/admin";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/enquiries/$id")({
  loader: async ({ params }) => {
    const data = await tryAdmin(() => getEnquiryAdmin({ data: params.id }), null);
    if (!data) throw notFound();
    return data;
  },
  component: EnquiryDetail,
});

function EnquiryDetail() {
  const { enquiry, files } = Route.useLoaderData();
  const e = enquiry as Record<string, unknown>;
  const router = useRouter();
  const rows: [string, unknown][] = [
    ["Kind", e.kind],
    ["Name", e.full_name],
    ["Company", e.company_name],
    ["Phone", e.phone],
    ["WhatsApp", e.whatsapp],
    ["Email", e.email],
    ["Machine", e.machine_name],
    ["Quantity", e.quantity],
    ["Location", e.location],
    ["Requirements", e.requirements],
    ["Message", e.message],
    ["Received", formatDate(String(e.created_at))],
  ];
  return (
    <div className="max-w-3xl">
      <Link to="/admin/enquiries" className="text-sm underline">
        All enquiries
      </Link>
      <h1 className="mt-3 font-display text-4xl uppercase">Enquiry</h1>
      <label className="mt-4 block text-sm">
        Status
        <select
          className="ml-2 h-10 border border-ink/15 bg-paper px-2"
          defaultValue={String(e.status)}
          onChange={async (ev) => {
            await updateEnquiryStatus({
              data: { id: String(e.id), status: ev.target.value as EnquiryStatus },
            });
            await router.invalidate();
          }}
        >
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <dl className="mt-6 divide-y divide-ink/10 border border-ink/10 bg-paper">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2 px-4 py-3">
            <dt className="text-steel">{k}</dt>
            <dd className="col-span-2 whitespace-pre-wrap">{v ? String(v) : "—"}</dd>
          </div>
        ))}
      </dl>
      {files.length ? (
        <div className="mt-6">
          <h2 className="font-display text-2xl uppercase">Files</h2>
          <ul className="mt-2 space-y-1">
            {(files as Record<string, unknown>[]).map((f) => (
              <li key={String(f.id)}>
                <a
                  className="underline"
                  href={String(f.public_url || `/api/media/${f.id}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {String(f.original_name)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
