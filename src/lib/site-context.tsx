import { createContext, useContext, type ReactNode } from "react";
import type { CompanyPublic } from "@/lib/types";

const SiteContext = createContext<CompanyPublic | null>(null);

export function SiteProvider({
  company,
  children,
}: {
  company: CompanyPublic;
  children: ReactNode;
}) {
  return <SiteContext.Provider value={company}>{children}</SiteContext.Provider>;
}

export function useCompany(): CompanyPublic {
  const value = useContext(SiteContext);
  if (!value) {
    throw new Error("useCompany must be used within SiteProvider");
  }
  return value;
}
