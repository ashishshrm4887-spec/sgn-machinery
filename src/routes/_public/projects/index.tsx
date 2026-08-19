import { createFileRoute, Link } from "@tanstack/react-router";
import { listPublishedProjects } from "@/lib/server/site";
import { SafeImage } from "@/components/site/safe-media";

export const Route = createFileRoute("/_public/projects/")({
  loader: () => listPublishedProjects(),
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content: "Selected machinery projects. Details are published only when confirmed by the company.",
      },
    ],
  }),
});

function ProjectsPage() {
  const projects = Route.useLoaderData();
  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Portfolio</p>
          <h1 className="mt-3 font-display text-5xl uppercase">Projects</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Project records appear here after the owner publishes them. Client names stay hidden unless they are
            entered on purpose.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-14">
        {projects.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }} className="block bg-paper shadow-[var(--shadow-border)]">
                <SafeImage src={p.imageUrl} alt={p.title} className="aspect-[4/3]" />
                <div className="p-5">
                  <h2 className="font-display text-2xl uppercase">{p.title}</h2>
                  {p.machineName ? <p className="mt-1 text-sm text-steel">{p.machineName}</p> : null}
                  {p.yearLabel ? <p className="mt-1 text-sm text-steel">{p.yearLabel}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-steel">Projects will be added soon.</p>
        )}
      </div>
    </>
  );
}
