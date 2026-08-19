import { createFileRoute } from "@tanstack/react-router";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { useCompany } from "@/lib/site-context";
import { formatPhoneDisplay, toMailto, toTelLink, toWhatsAppLink } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact | Shree Guru Nanak Dev Machinery Company" },
      {
        name: "description",
        content: "Call, WhatsApp, or email Shree Guru Nanak Dev Machinery Company. Request a quotation.",
      },
    ],
  }),
});

function ContactPage() {
  const company = useCompany();
  const phone = company.phones[0];
  return (
    <>
      <header className="bg-navy py-16 text-fg">
        <div className="mx-auto max-w-6xl px-4">
          <p className="kicker">Get in touch</p>
          <h1 className="mt-3 font-display text-5xl uppercase">Contact</h1>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Speak with the company directly, or send a message. Phone and email update everywhere when they are
            changed in the administrator panel.
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-5">
        <aside className="space-y-5 lg:col-span-2">
          <div>
            <p className="kicker">Phone</p>
            <ul className="mt-2 space-y-1">
              {company.phones.map((p) => (
                <li key={p}>
                  <a href={toTelLink(p)} className="text-lg hover:text-accent">
                    {formatPhoneDisplay(p)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {company.email ? (
            <div>
              <p className="kicker">Email</p>
              <a href={toMailto(company.email)} className="mt-2 block break-all hover:text-accent">
                {company.email}
              </a>
            </div>
          ) : null}
          {company.address ? (
            <div>
              <p className="kicker">Address</p>
              <p className="mt-2 whitespace-pre-line">{company.address}</p>
            </div>
          ) : (
            <div>
              <p className="kicker">Address</p>
              <p className="mt-2 text-steel">Address can be added from the administrator panel.</p>
            </div>
          )}
          {company.businessHours ? (
            <div>
              <p className="kicker">Business hours</p>
              <p className="mt-2 whitespace-pre-line">{company.businessHours}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            {phone ? (
              <a href={toTelLink(phone)} className={cn(buttonVariants({ variant: "navy", size: "sm" }))}>
                Call
              </a>
            ) : null}
            {company.whatsapp ? (
              <a
                href={toWhatsAppLink(company.whatsapp, "Hello, I would like information about your machinery.")}
                className={cn(buttonVariants({ variant: "whatsapp", size: "sm" }))}
              >
                WhatsApp
              </a>
            ) : null}
            {company.email ? (
              <a href={toMailto(company.email)} className={cn(buttonVariants({ variant: "outlineInk", size: "sm" }))}>
                Email
              </a>
            ) : null}
          </div>
          {company.mapsUrl ? (
            <div className="aspect-[4/3] overflow-hidden border border-ink/10">
              <iframe
                title="Map"
                src={company.mapsUrl}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </aside>
        <div className="bg-paper-2 p-6 lg:col-span-3">
          <h2 className="font-display text-3xl uppercase">Send a message</h2>
          <p className="mt-2 mb-6 text-sm text-steel">
            For a formal quotation, use the quote form. This form is for general contact.
          </p>
          <EnquiryForm kind="contact" />
        </div>
      </div>
    </>
  );
}
