import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { useCompany } from "@/lib/site-context";
import { toTelLink, toWhatsAppLink } from "@/lib/utils";

export function MobileCta({ machineName }: { machineName?: string }) {
  const company = useCompany();
  const phone = company.phones[0];
  const message = machineName
    ? `Hello, I am interested in ${machineName}. Please share the specifications and quotation.`
    : "Hello, I would like information about your machinery.";
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-navy text-fg md:hidden">
      {phone ? (
        <a href={toTelLink(phone)} className="flex h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-display uppercase tracking-[0.14em]">
          <Phone className="size-4" />
          Call
        </a>
      ) : (
        <span />
      )}
      {company.whatsapp ? (
        <a
          href={toWhatsAppLink(company.whatsapp, message)}
          className="flex h-14 flex-col items-center justify-center gap-0.5 bg-[#128C7E] text-[0.65rem] font-display uppercase tracking-[0.14em]"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      ) : (
        <span />
      )}
      <Link
        to="/quote"
        search={machineName ? { machine: machineName } : {}}
        className="flex h-14 flex-col items-center justify-center gap-0.5 bg-accent text-[0.65rem] font-display uppercase tracking-[0.14em]"
      >
        Quote
      </Link>
    </div>
  );
}
