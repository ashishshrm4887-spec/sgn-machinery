import { createFileRoute } from "@tanstack/react-router";
import { listPublishedServices } from "@/lib/server/site";

export const Route = createFileRoute("/_public/services")({
  loader: () => listPublishedServices(),
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content: "Machinery manufacturing and related services from Shree Guru Nanak Dev Machinery Company.",
      },
    ],
  }),
});

function ServicesPage() {
  const services = Route.useLoaderData();
  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Capabilities</p>
          <h1 className="mt-3 font-display text-5xl uppercase">Services</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Only confirmed services are listed here. Additional work can be published from the administrator panel.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-14">
        {services.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <article key={s.id} className="bg-paper shadow-[var(--shadow-border)]">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt="" className="aspect-[16/8] w-full object-cover" />
                ) : null}
                <div className="p-6">
                  <h2 className="font-display text-3xl uppercase">{s.title}</h2>
                  {s.summary ? <p className="mt-3 text-steel">{s.summary}</p> : null}
                  {s.body ? <p className="mt-4 leading-relaxed">{s.body}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-steel">Services will be published here once they are confirmed.</p>
        )}
      </div>
    </>
  );
}
