import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Download, Phone } from "lucide-react";
import { getMachineBySlug, listRelatedMachines } from "@/lib/server/site";
import { useCompany } from "@/lib/site-context";
import { MachineCardView } from "@/components/site/machine-card";
import { SafeImage, SafeVideo } from "@/components/site/safe-media";
import { buttonVariants } from "@/components/ui/button";
import { cn, toTelLink, toWhatsAppLink } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/_public/machines/$slug")({
  loader: async ({ params }) => {
    const machine = await getMachineBySlug({ data: params.slug });
    if (!machine) throw notFound();
    const related = await listRelatedMachines({
      data: { slug: machine.slug, category: machine.category },
    });
    return { machine, related };
  },
  component: MachineDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData?.machine.seoTitle ||
          `${loaderData?.machine.name} | Shree Guru Nanak Dev Machinery Company`,
      },
      {
        name: "description",
        content:
          loaderData?.machine.seoDescription ||
          loaderData?.machine.shortDescription ||
          "Machine details and quotation request.",
      },
    ],
  }),
});

function MachineDetailPage() {
  const { machine, related } = Route.useLoaderData();
  const company = useCompany();
  const [active, setActive] = useState(machine.images[0]?.url ?? null);
  const phone = company.phones[0];
  const wa = company.whatsapp
    ? toWhatsAppLink(
        company.whatsapp,
        `Hello, I am interested in ${machine.name}. Please share the specifications and quotation.`,
      )
    : null;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: machine.name,
    description: machine.shortDescription,
    brand: { "@type": "Brand", name: "SGN" },
    manufacturer: { "@type": "Organization", name: company.companyName },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="bg-navy py-4 text-sm text-fg-muted">
        <nav className="mx-auto max-w-6xl px-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link to="/" className="hover:text-fg">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/machines" className="hover:text-fg">
                Machines
              </Link>
            </li>
            <li>/</li>
            <li className="text-fg">{machine.name}</li>
          </ol>
        </nav>
      </div>
      <article className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SafeImage
              src={active || machine.imageUrl}
              alt={machine.name}
              className="aspect-[4/3] w-full"
            />
            {machine.images.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {machine.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActive(img.url)}
                    className={cn(
                      "overflow-hidden border",
                      active === img.url ? "border-accent" : "border-transparent",
                    )}
                  >
                    <SafeImage src={img.url} alt={img.alt} className="aspect-square" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            {machine.category ? <p className="kicker">{machine.category}</p> : null}
            <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">{machine.name}</h1>
            {machine.model ? <p className="mt-2 text-steel">Model: {machine.model}</p> : null}
            {machine.shortDescription ? (
              <p className="mt-4 leading-relaxed">{machine.shortDescription}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/quote"
                search={{ machine: machine.name }}
                className={cn(buttonVariants({ variant: "primary", size: "md" }))}
              >
                Request quote
              </Link>
              {wa ? (
                <a href={wa} className={cn(buttonVariants({ variant: "whatsapp", size: "md" }))}>
                  WhatsApp
                </a>
              ) : null}
              {phone ? (
                <a href={toTelLink(phone)} className={cn(buttonVariants({ variant: "navy", size: "md" }))}>
                  <Phone className="size-4" />
                  Call
                </a>
              ) : null}
              {machine.brochureUrl ? (
                <a
                  href={machine.brochureUrl}
                  className={cn(buttonVariants({ variant: "outlineInk", size: "md" }))}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="size-4" />
                  Brochure
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {machine.fullDescription ? (
          <section className="mt-14">
            <h2 className="font-display text-3xl uppercase">Description</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed text-ink/90">
              {machine.fullDescription}
            </p>
          </section>
        ) : null}

        {machine.specs.length ? (
          <section className="mt-14">
            <h2 className="font-display text-3xl uppercase">Specifications</h2>
            <dl className="mt-4 divide-y divide-ink/10 border border-ink/10">
              {machine.specs.map((s) => (
                <div key={s.id} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="font-display uppercase tracking-wide text-steel">{s.label}</dt>
                  <dd className="sm:col-span-2">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {machine.features.length ? (
          <section className="mt-14">
            <h2 className="font-display text-3xl uppercase">Features</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {machine.features.map((f) => (
                <li key={f.id}>{f.body}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {machine.applications.length ? (
          <section className="mt-14">
            <h2 className="font-display text-3xl uppercase">Applications</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {machine.applications.map((f) => (
                <li key={f.id}>{f.body}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {machine.videos.length ? (
          <section className="mt-14">
            <h2 className="font-display text-3xl uppercase">Videos</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {machine.videos.map((v) => (
                <SafeVideo key={v.id} src={v.url} poster={v.posterUrl} caption={v.caption} className="aspect-video" />
              ))}
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section className="mt-16">
            <h2 className="font-display text-3xl uppercase">Related machines</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((m) => (
                <MachineCardView key={m.id} machine={m} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}
