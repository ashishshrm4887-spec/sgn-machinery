import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard, tryAdmin } from "@/lib/server/admin";
import { formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  loader: () =>
    tryAdmin(getDashboard, {
      totals: {
        machines: 0,
        publishedMachines: 0,
        services: 0,
        projects: 0,
        gallery: 0,
        enquiries: 0,
        newEnquiries: 0,
      },
      recent: [],
    }),
  component: AdminHome,
});

function AdminHome() {
  const { totals, recent } = Route.useLoaderData();
  const cards = [
    { label: "Machines", value: totals.machines, hint: `${totals.publishedMachines} published` },
    { label: "Services", value: totals.services },
    { label: "Projects", value: totals.projects },
    { label: "Gallery", value: totals.gallery },
    { label: "New enquiries", value: totals.newEnquiries },
    { label: "Total enquiries", value: totals.enquiries },
  ];
  return (
    <div>
      <h1 className="font-display text-4xl uppercase">Dashboard</h1>
      <p className="mt-1 text-steel">Overview of the live website. Every control here updates the public pages.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-paper p-5 shadow-[var(--shadow-border)]">
            <p className="kicker">{c.label}</p>
            <p className="mt-2 font-display text-5xl tabular-nums">{c.value}</p>
            {c.hint ? <p className="mt-1 text-sm text-steel">{c.hint}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/admin/machines/new" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
          Add machine
        </Link>
        <Link to="/admin/projects" className={cn(buttonVariants({ variant: "navy", size: "sm" }))}>
          Add project
        </Link>
        <Link to="/admin/media" className={cn(buttonVariants({ variant: "outlineInk", size: "sm" }))}>
          Upload image
        </Link>
        <Link to="/admin/media" className={cn(buttonVariants({ variant: "outlineInk", size: "sm" }))}>
          Upload video
        </Link>
        <Link to="/admin/company" className={cn(buttonVariants({ variant: "outlineInk", size: "sm" }))}>
          Edit company
        </Link>
        <Link to="/admin/company" className={cn(buttonVariants({ variant: "outlineInk", size: "sm" }))}>
          Edit contact
        </Link>
      </div>
      {totals.machines === 0 ? (
        <p className="mt-6 bg-paper p-4">
          Add your first machine to populate the catalogue.{" "}
          <Link to="/admin/machines/new" className="underline">
            Add machine
          </Link>
        </p>
      ) : null}
      <h2 className="mt-10 font-display text-2xl uppercase">Recent enquiries</h2>
      <div className="mt-3 overflow-x-auto bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy text-fg">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Machine</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.length ? (
              recent.map((r) => (
                <tr key={r.id} className="border-t border-ink/10">
                  <td className="px-3 py-2">
                    <Link to="/admin/enquiries/$id" params={{ id: r.id }} className="underline">
                      {r.fullName}
                    </Link>
                    <div className="text-xs text-steel">{r.companyName}</div>
                  </td>
                  <td className="px-3 py-2">{r.machineName || "—"}</td>
                  <td className="px-3 py-2 capitalize">{r.status.replace("_", " ")}</td>
                  <td className="px-3 py-2">{formatDate(r.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-4 text-steel" colSpan={4}>
                  No enquiries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
