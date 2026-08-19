import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Phone } from "lucide-react";
import { getHomeData } from "@/lib/server/site";
import { useCompany } from "@/lib/site-context";
import { MachineCardView } from "@/components/site/machine-card";
import { SafeImage } from "@/components/site/safe-media";
import { buttonVariants } from "@/components/ui/button";
import { cn, toTelLink, toWhatsAppLink } from "@/lib/utils";

export const Route = createFileRoute("/_public/")({
  loader: () => getHomeData(),
  component: HomePage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData?.company.seoTitle ||
          "Shree Guru Nanak Dev Machinery Company | Corrugated Board Machinery",
      },
      {
        name: "description",
        content:
          loaderData?.company.seoDescription ||
          "Corrugated board and allied machinery. Request a quotation.",
      },
    ],
  }),
});

function HomePage() {
  const data = Route.useLoaderData();
  const company = useCompany();
  const phone = company.phones[0];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.companyName,
    description: company.businessLine,
    email: company.email,
    telephone: company.phones.map((p) => (p.length === 10 ? `+91${p}` : p)),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="relative min-h-[78vh] overflow-hidden bg-navy text-fg">
        <div className="absolute inset-0">
          {company.heroVideoUrl ? (
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={company.heroImageUrl || "/media/hero-workshop.jpg"}
            >
              <source src={company.heroVideoUrl} />
            </video>
          ) : (
            <img
              src={company.heroImageUrl || "/media/hero-workshop.jpg"}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/82 to-navy/45" />
        </div>
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28">
          <p className="kicker">{company.companyName}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl uppercase leading-[0.92] sm:text-6xl md:text-7xl">
            {company.heroTitle || company.businessLine}
          </h1>
          <p className="mt-3 font-display text-xl uppercase tracking-[0.18em] text-accent">
            {company.tagline}
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg/85 sm:text-lg">
            {company.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/machines" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
              {company.heroCtaPrimary}
              <ArrowRight className="size-4" />
            </Link>
            <Link to="/quote" search={{}} className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
              {company.heroCtaSecondary}
            </Link>
            {company.whatsapp ? (
              <a
                href={toWhatsAppLink(company.whatsapp, "Hello, I would like information about your machinery.")}
                className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }))}
              >
                WhatsApp us
              </a>
            ) : null}
            {phone ? (
              <a href={toTelLink(phone)} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                <Phone className="size-4" />
                Call now
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Catalogue</p>
              <h2 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Featured machines</h2>
            </div>
            <Link to="/machines" className={cn(buttonVariants({ variant: "outlineInk", size: "sm" }))}>
              All machines
            </Link>
          </div>
          {data.machines.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.machines.map((m) => (
                <MachineCardView key={m.id} machine={m} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-steel">No machines have been added yet.</p>
          )}
        </div>
      </section>

      {data.services.length ? (
        <section className="bg-navy text-fg industrial-grid">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="kicker">What we do</p>
            <h2 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Services</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.services.map((s) => (
                <article key={s.id} className="border border-line bg-navy-mid/80 p-6">
                  <h3 className="font-display text-2xl uppercase">{s.title}</h3>
                  {s.summary ? <p className="mt-3 text-sm leading-relaxed text-fg-muted">{s.summary}</p> : null}
                </article>
              ))}
            </div>
            <Link to="/services" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-8 inline-flex")}>
              View services
            </Link>
          </div>
        </section>
      ) : null}

      {company.whyChooseUs.length ? (
        <section className="bg-paper-2">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="kicker">Why work with us</p>
            <h2 className="mt-2 font-display text-4xl uppercase sm:text-5xl">A straightforward manufacturer</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {company.whyChooseUs.map((item, i) => (
                <article key={item.id} className="bg-paper p-6 shadow-[var(--shadow-border)]">
                  <p className="font-display text-4xl text-accent/80">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-display text-2xl uppercase">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid lg:grid-cols-2">
        <SafeImage
          src="/media/workshop-interior.jpg"
          alt="Machinery on the workshop floor in Amritsar"
          className="min-h-[320px] lg:min-h-full"
        />
        <div className="flex flex-col justify-center bg-navy px-6 py-16 text-fg md:px-12">
          <p className="kicker">The company</p>
          <h2 className="mt-2 font-display text-4xl uppercase">About SGN Machinery</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-fg/85">{company.aboutShort}</p>
          <Link to="/about" className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-8 w-fit")}>
            About the company
          </Link>
        </div>
      </section>

      {data.projects.length ? (
        <section className="bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="kicker">Work</p>
            <h2 className="mt-2 font-display text-4xl uppercase">Projects</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {data.projects.map((p) => (
                <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }} className="block bg-paper-2">
                  <SafeImage src={p.imageUrl} alt={p.title} className="aspect-[4/3]" />
                  <div className="p-4">
                    <h3 className="font-display text-xl uppercase">{p.title}</h3>
                    {p.machineName ? <p className="mt-1 text-sm text-steel">{p.machineName}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {data.gallery.length ? (
        <section className="bg-navy text-fg">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="kicker">From the works</p>
                <h2 className="mt-2 font-display text-4xl uppercase sm:text-5xl">Workshop gallery</h2>
              </div>
              <Link to="/gallery" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                All photographs
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.gallery.map((item) => (
                <Link key={item.id} to="/gallery" className="group block overflow-hidden bg-navy-mid">
                  <SafeImage
                    src={item.url}
                    alt={item.caption || "Workshop photograph"}
                    className="aspect-[4/3] transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {item.caption ? (
                    <p className="px-3 py-2 text-xs text-fg-muted">{item.caption}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-accent text-fg">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em]">Next step</p>
            <h2 className="mt-2 font-display text-4xl uppercase">Request a quotation</h2>
            <p className="mt-2 max-w-xl text-fg/90">
              Tell us which machine you need. The company will respond with the confirmed specifications and a quotation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/quote" search={{}} className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
              Request a quote
            </Link>
            {phone ? (
              <a href={toTelLink(phone)} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Call now
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
