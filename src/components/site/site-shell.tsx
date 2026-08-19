import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { MobileCta } from "./mobile-cta";

export function SiteShell({
  children,
  machineName,
}: {
  children: ReactNode;
  machineName?: string;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />
      <main className="pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileCta machineName={machineName} />
    </div>
  );
}
