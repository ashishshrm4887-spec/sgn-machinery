import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProjectBySlug } from "@/lib/server/site";
import { SafeImage, SafeVideo } from "@/components/site/safe-media";

export const Route = createFileRoute("/_public/projects/$slug")({
  loader: async ({ params }) => {
    const project = await getProjectBySlug({ data: params.slug });
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project.title} | Projects` },
      { name: "description", content: loaderData?.project.description || "Project details." },
    ],
  }),
});

function ProjectDetailPage() {
  const { project } = Route.useLoaderData();
  return (
    <>
      <div className="bg-navy py-4 text-sm text-fg-muted">
        <nav className="mx-auto max-w-6xl px-4">
          <Link to="/projects" className="hover:text-fg">
            Projects
          </Link>
          <span className="mx-2">/</span>
          <span className="text-fg">{project.title}</span>
        </nav>
      </div>
      <article className="mx-auto max-w-6xl px-4 py-12">
        <p className="kicker">Project</p>
        <h1 className="mt-2 font-display text-5xl uppercase">{project.title}</h1>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          {project.machineName ? (
            <div>
              <dt className="text-steel">Machine</dt>
              <dd>{project.machineName}</dd>
            </div>
          ) : null}
          {project.yearLabel ? (
            <div>
              <dt className="text-steel">Year</dt>
              <dd>{project.yearLabel}</dd>
            </div>
          ) : null}
          {project.location ? (
            <div>
              <dt className="text-steel">Location</dt>
              <dd>{project.location}</dd>
            </div>
          ) : null}
          {project.clientName ? (
            <div>
              <dt className="text-steel">Client</dt>
              <dd>{project.clientName}</dd>
            </div>
          ) : null}
        </dl>
        {project.description ? (
          <p className="mt-8 max-w-3xl whitespace-pre-line leading-relaxed">{project.description}</p>
        ) : null}
        {project.images.length ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {project.images.map((img) => (
              <SafeImage key={img.id} src={img.url} alt={img.alt} className="aspect-[4/3]" />
            ))}
          </div>
        ) : null}
        {project.videos.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {project.videos.map((v) => (
              <SafeVideo key={v.id} src={v.url} poster={v.posterUrl} className="aspect-video" />
            ))}
          </div>
        ) : null}
      </article>
    </>
  );
}
