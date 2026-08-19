import { createFileRoute, Link } from "@tanstack/react-router";
import { archiveMachine, listMachinesAdmin, toggleMachineFlag, tryAdmin } from "@/lib/server/admin";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/machines/")({
  loader: () => tryAdmin(() => listMachinesAdmin(), []),
  component: MachinesAdmin,
});

function MachinesAdmin() {
  const rows = Route.useLoaderData() as {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    featured: boolean;
    published: boolean;
    archived: boolean;
    sort_order: number;
  }[];
  const router = useRouter();

  async function refresh() {
    await router.invalidate();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase">Machines</h1>
          <p className="text-steel">Add unlimited machines. Only published items appear on the website.</p>
        </div>
        <Link to="/admin/machines/new" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
          Add machine
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 bg-paper p-6">
          Add your first machine.{" "}
          <Link to="/admin/machines/new" className="underline">
            Create one
          </Link>
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-navy text-fg">
              <tr>
                <th className="px-3 py-2">Machine</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink/10">
                  <td className="px-3 py-3">
                    <Link to="/admin/machines/$id" params={{ id: r.id }} className="font-medium underline">
                      {r.name}
                    </Link>
                    <div className="text-xs text-steel">/{r.slug}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.archived ? <Badge tone="muted">Archived</Badge> : null}
                      {r.published ? <Badge tone="ok">Published</Badge> : <Badge tone="warn">Draft</Badge>}
                      {r.featured ? <Badge tone="red">Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{r.sort_order}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={async () => {
                          await toggleMachineFlag({ data: { id: r.id, field: "published", value: !r.published } });
                          await refresh();
                        }}
                      >
                        {r.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={async () => {
                          await toggleMachineFlag({ data: { id: r.id, field: "featured", value: !r.featured } });
                          await refresh();
                        }}
                      >
                        {r.featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-accent underline"
                        onClick={async () => {
                          if (!confirm(r.archived ? "Restore this machine?" : "Archive this machine? It will leave the public catalogue.")) return;
                          await archiveMachine({ data: { id: r.id, archived: !r.archived } });
                          await refresh();
                        }}
                      >
                        {r.archived ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
