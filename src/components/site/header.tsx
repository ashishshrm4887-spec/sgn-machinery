import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useCompany } from "@/lib/site-context";
import { formatPhoneDisplay, toTelLink, toWhatsAppLink } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/machines" as const, label: "Machines" },
  { to: "/services" as const, label: "Services" },
  { to: "/projects" as const, label: "Projects" },
  { to: "/gallery" as const, label: "Gallery" },
  { to: "/about" as const, label: "About" },
  { to: "/contact" as const, label: "Contact" },
];

/** Transparent SGN logo for the white mobile header (no white box). */
const MOBILE_LOGO = "/sgn-logo-300x100.svg";

export function Header() {
  const company = useCompany();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const phone = company.phones[0] ?? "";

  // Prefer company logo (e.g. transparent PNG uploaded in Admin); else built-in transparent asset
  const logoSrc =
    company.logoUrl &&
    company.logoUrl !== "/logo.svg" &&
    company.logoUrl !== "/logo-on-dark.svg"
      ? company.logoUrl
      : MOBILE_LOGO;

  const desktopLogoSrc =
    company.logoUrl && company.logoUrl !== "/logo.svg"
      ? company.logoUrl === "/logo-on-dark.svg"
        ? "/logo-on-dark.svg"
        : company.logoUrl
      : "/logo-on-dark.svg";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b box-border",
        "border-black/10 bg-[#FFFFFF] text-[#07111F]",
        "lg:border-line lg:bg-navy lg:text-fg",
      )}
    >
      <div className="hidden border-b border-line bg-navy-mid/50 lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs tracking-wide text-fg-muted">
          <p className="truncate">{company.businessLine}</p>
          <div className="flex items-center gap-4">
            {phone ? (
              <a href={toTelLink(phone)} className="hover:text-fg">
                {formatPhoneDisplay(phone)}
              </a>
            ) : null}
            {company.email ? (
              <a href={`mailto:${company.email}`} className="hover:text-fg">
                {company.email}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto flex max-w-6xl box-border items-center",
          "h-[120px] min-h-[120px] max-h-[120px] gap-2 px-6",
          "lg:h-auto lg:min-h-0 lg:max-h-none lg:gap-4 lg:px-4 lg:py-3",
        )}
      >
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center"
          onClick={() => setOpen(false)}
        >
          <img
            src={logoSrc}
            alt={company.companyName}
            className={cn(
              "block h-auto object-contain object-left",
              "w-[min(300px,calc(100vw-9.25rem))] max-h-[100px]",
              "max-[390px]:w-[min(250px,calc(100vw-8.5rem))]",
              "lg:hidden",
            )}
          />
          <img
            src={desktopLogoSrc}
            alt={company.companyName}
            className="hidden h-11 w-auto max-w-[220px] object-contain lg:block"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "font-display text-[0.92rem] font-semibold uppercase tracking-[0.14em] text-fg-muted transition-colors hover:text-fg",
                pathname.startsWith(item.to) && "text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 max-[390px]:gap-1.5 sm:gap-3">
          {phone ? (
            <a
              href={toTelLink(phone)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden lg:inline-flex",
              )}
            >
              <Phone className="size-4" />
              Call
            </a>
          ) : null}

          <Link
            to="/quote"
            search={{}}
            className={cn(
              "inline-flex h-10 items-center justify-center border border-[#C8102E] bg-[#FFFFFF] px-3",
              "font-display text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-[#C8102E]",
              "hover:bg-[#C8102E]/5",
              "lg:h-10 lg:border-transparent lg:bg-accent lg:px-4 lg:text-[0.95rem] lg:text-fg lg:hover:bg-accent-hover",
            )}
          >
            Quote
          </Link>

          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center border border-[#07111F] bg-[#FFFFFF] text-[#07111F] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-black/10 bg-[#FFFFFF] px-4 py-4 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-black/10 py-3 font-display text-lg uppercase tracking-[0.12em] text-[#07111F]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {company.whatsapp ? (
              <a
                href={toWhatsAppLink(
                  company.whatsapp,
                  "Hello, I would like information about your machinery.",
                )}
                className={cn(buttonVariants({ variant: "whatsapp", size: "md" }), "w-full")}
              >
                WhatsApp
              </a>
            ) : null}
            {phone ? (
              <a
                href={toTelLink(phone)}
                className={cn(buttonVariants({ variant: "navy", size: "md" }), "w-full")}
              >
                Call now
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
