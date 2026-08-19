import { createFileRoute } from "@tanstack/react-router";
import { useCompany } from "@/lib/site-context";
import { SafeImage } from "@/components/site/safe-media";
import { listPublishedServices } from "@/lib/server/site";

export const Route = createFileRoute("/_public/about")({
  loader: () => listPublishedServices(),
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content: "Shree Guru Nanak Dev Machinery Company manufactures corrugated board and allied machinery.",
      },
    ],
  }),
});

function AboutPage() {
  const company = useCompany();
  const services = Route.useLoaderData();
  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Company</p>
          <h1 className="mt-3 font-display text-5xl uppercase">About</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">{company.businessLine}</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl uppercase">{company.companyName}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed">{company.aboutFull || company.aboutShort}</p>
          {company.engineeringFocus ? (
            <>
              <h3 className="mt-8 font-display text-2xl uppercase">Engineering focus</h3>
              <p className="mt-3 whitespace-pre-line leading-relaxed">{company.engineeringFocus}</p>
            </>
          ) : null}
          {company.manufacturingCapabilities ? (
            <>
              <h3 className="mt-8 font-display text-2xl uppercase">Manufacturing</h3>
              <p className="mt-3 whitespace-pre-line leading-relaxed">{company.manufacturingCapabilities}</p>
            </>
          ) : null}
          {services.length ? (
            <>
              <h3 className="mt-8 font-display text-2xl uppercase">Published services</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {services.map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <SafeImage
          src="/media/workshop-interior.jpg"
          alt="Machinery on the workshop floor at the Amritsar works"
          className="min-h-[320px]"
        />
      </div>
    </>
  );
}
