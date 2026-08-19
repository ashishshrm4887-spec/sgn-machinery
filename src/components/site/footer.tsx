import { Link } from "@tanstack/react-router";
import { useCompany } from "@/lib/site-context";
import { formatPhoneDisplay, toMailto, toTelLink, toWhatsAppLink } from "@/lib/utils";

export function Footer() {
  const company = useCompany();
  return (
    <footer className="bg-navy text-fg">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <img
            src={company.logoUrl === "/logo.svg" ? "/logo-on-dark.svg" : company.logoUrl}
            alt={company.companyName}
            className="mb-4 h-12 w-auto"
          />
          <p className="kicker">{company.businessLine}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
            {company.tagline}. {company.aboutShort}
          </p>
        </div>
        <div>
          <p className="kicker">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/machines" className="hover:text-accent">Machines</Link></li>
            <li><Link to="/services" className="hover:text-accent">Services</Link></li>
            <li><Link to="/projects" className="hover:text-accent">Projects</Link></li>
            <li><Link to="/gallery" className="hover:text-accent">Gallery</Link></li>
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link to="/quote" search={{}} className="hover:text-accent">Request a Quote</Link></li>
          </ul>
        </div>
        <div>
          <p className="kicker">Contact</p>
          <ul className="mt-3 space-y-2 text-sm">
            {company.phones.map((p) => (
              <li key={p}>
                <a href={toTelLink(p)} className="hover:text-accent">
                  {formatPhoneDisplay(p)}
                </a>
              </li>
            ))}
            {company.whatsapp ? (
              <li>
                <a
                  href={toWhatsAppLink(company.whatsapp, "Hello, I would like information about your machinery.")}
                  className="hover:text-accent"
                >
                  WhatsApp
                </a>
              </li>
            ) : null}
            {company.email ? (
              <li>
                <a href={toMailto(company.email, "Enquiry — SGN Machinery")} className="hover:text-accent break-all">
                  {company.email}
                </a>
              </li>
            ) : null}
            {company.address ? <li className="text-fg-muted">{company.address}</li> : null}
            {company.businessHours ? <li className="text-fg-muted">{company.businessHours}</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-fg-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {company.companyName}</p>
          <p>{company.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
