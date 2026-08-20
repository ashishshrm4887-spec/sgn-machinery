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
  // Prefer company logo; fall back to full horizontal lockup (light background)
  const logo = company.logoUrl && company.logoUrl !== "/logo-on-dark.svg"
    ? company.logoUrl
    : "/logo.svg";

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper text-ink shadow-sm">
      <div className="hidden border-b border-ink/8 bg-paper-2 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs tracking-wide text-steel">
          <p className="truncate">{company.businessLine}</p>
          <div className="flex items-center gap-4">
            {phone ? (
              <a href={toTelLink(phone)} className="hover:text-ink">
                {formatPhoneDisplay(phone)}
              </a>
            ) : null}
            {company.email ? (
              <a href={`mailto:${company.email}`} className="hover:text-ink">
                {company.email}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center"
          onClick={() => setOpen(false)}
        >
          <img
            src={logo}
            alt={company.companyName}
            className="h-12 w-auto max-w-[calc(100vw-7.5rem)] object-contain object-left sm:h-14 sm:max-w-[min(100%,22rem)] md:h-16 md:max-w-[28rem] lg:h-[4.5rem] lg:max-w-[32rem]"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "font-display text-[0.92rem] font-semibold uppercase tracking-[0.14em] text-steel transition-colors hover:text-ink",
                pathname.startsWith(item.to) && "text-ink",
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
                buttonVariants({ variant: "outlineInk", size: "sm" }),
                "hidden sm:inline-flex",
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
              buttonVariants({ variant: "outlineInk", size: "sm" }),
              "border-accent text-accent hover:border-accent hover:bg-accent/5",
            )}
          >
            Quote
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center border border-ink/20 text-ink lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-ink/10 bg-paper px-4 py-4 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-ink/10 py-3 font-display text-lg uppercase tracking-[0.12em] text-ink"
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
