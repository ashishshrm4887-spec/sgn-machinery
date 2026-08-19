import { createFileRoute, Link } from "@tanstack/react-router";
import { exportEnquiriesCsv, listEnquiriesAdmin, updateEnquiryStatus, tryAdmin } from "@/lib/server/admin";
import { formatDate } from "@/lib/utils";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/enquiries")({
  loader: () => tryAdmin(() => listEnquiriesAdmin(), []),
  component: EnquiriesAdmin,
});

function EnquiriesAdmin() {
  const rows = Route.useLoaderData() as {
    id: string;
    kind: string;
    full_name: string;
    company_name: string | null;
    phone: string;
    whatsapp: string | null;
    email: string | null;
    machine_name: string | null;
    status: EnquiryStatus;
    created_at: string;
  }[];
  const router = useRouter();

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase">Enquiries</h1>
          <p className="text-steel">Contact and quotation requests from the website.</p>
        </div>
        <Button
          size="sm"
          variant="outlineInk"
          onClick={async () => {
            const { csv } = await exportEnquiriesCsv();
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "enquiries.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto bg-paper">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-navy text-fg">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Machine</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-steel" colSpan={6}>
                  No enquiries yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-ink/10">
                  <td className="px-3 py-2">
                    <Link to="/admin/enquiries/$id" params={{ id: r.id }} className="underline">
                      {r.full_name}
                    </Link>
                    <div className="text-xs capitalize text-steel">{r.kind}</div>
                  </td>
                  <td className="px-3 py-2">{r.company_name || "—"}</td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{r.machine_name || "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      value={r.status}
                      className="h-9 border border-ink/15 bg-paper px-2"
                      onChange={async (e) => {
                        await updateEnquiryStatus({
                          data: { id: r.id, status: e.target.value as EnquiryStatus },
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
                  </td>
                  <td className="px-3 py-2">{formatDate(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
