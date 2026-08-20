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

export function Header() {
  const company = useCompany();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const phone = company.phones[0] ?? "";

  // Existing logo asset only — never redesign
  const logoSrc =
    company.logoUrl && company.logoUrl !== "/logo-on-dark.svg"
      ? company.logoUrl
      : "/logo.svg";
  const desktopLogoSrc =
    logoSrc === "/logo.svg" ? "/logo-on-dark.svg" : logoSrc;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b",
        // Mobile / tablet: pure white
        "border-black/10 bg-[#FFFFFF] text-[#07111F]",
        // Desktop: original navy header
        "lg:border-line lg:bg-navy lg:text-fg",
      )}
    >
      {/* Desktop-only top utility bar (unchanged behaviour) */}
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

      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 lg:py-3">
        {/* LOGO — left, grows; does not overlap Quote/Menu */}
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center self-stretch"
          onClick={() => setOpen(false)}
        >
          {/* Mobile / tablet logo */}
          <img
            src={logoSrc}
            alt={company.companyName}
            className="block h-[3.75rem] w-auto max-w-[calc(100vw-8.25rem)] object-contain object-left sm:h-[4.25rem] sm:max-w-[calc(100vw-9rem)] md:h-20 lg:hidden"
          />
          {/* Desktop logo */}
          <img
            src={desktopLogoSrc}
            alt={company.companyName}
            className="hidden h-11 w-auto max-w-[220px] object-contain lg:block"
          />
        </Link>

        {/* Desktop nav */}
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

        <div className="flex shrink-0 items-center gap-2">
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

          {/* QUOTE — mobile: white + red border/text; desktop: primary */}
          <Link
            to="/quote"
            search={{}}
            className={cn(
              buttonVariants({ size: "sm" }),
              // Mobile / tablet
              "border border-[#C8102E] bg-[#FFFFFF] text-[#C8102E] hover:bg-[#C8102E]/5",
              // Desktop
              "lg:border-transparent lg:bg-accent lg:text-fg lg:hover:bg-accent-hover",
            )}
          >
            Quote
          </Link>

          {/* HAMBURGER — white + dark border/icon (mobile only) */}
          <button
            type="button"
            className="grid size-11 place-items-center border border-[#07111F] bg-[#FFFFFF] text-[#07111F] lg:hidden"
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
