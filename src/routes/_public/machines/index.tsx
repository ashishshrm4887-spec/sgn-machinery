import { createFileRoute } from "@tanstack/react-router";
import { listPublishedMachines } from "@/lib/server/site";
import { MachineCardView } from "@/components/site/machine-card";

export const Route = createFileRoute("/_public/machines/")({
  loader: () => listPublishedMachines(),
  component: MachinesPage,
  head: () => ({
    meta: [
      { title: "Machines | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content:
          "Catalogue of corrugated board and allied machinery. View specifications and request a quotation.",
      },
    ],
  }),
});

function MachinesPage() {
  const machines = Route.useLoaderData();
  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Catalogue</p>
          <h1 className="mt-3 font-display text-5xl uppercase">Machines</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Published machinery from Shree Guru Nanak Dev Machinery Company. Specifications shown here are
            confirmed. Request a quotation for current availability.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-14">
        {machines.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {machines.map((m) => (
              <MachineCardView key={m.id} machine={m} />
            ))}
          </div>
        ) : (
          <p className="text-steel">No machines have been added yet.</p>
        )}
      </div>
    </>
  );
}
