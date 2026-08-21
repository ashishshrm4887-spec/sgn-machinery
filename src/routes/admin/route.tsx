import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { authClient, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapAdmin, getAdminSession } from "@/lib/server/admin";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminGate,
});

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/company", label: "Company" },
  { to: "/admin/homepage", label: "Homepage" },
  { to: "/admin/machines", label: "Machines" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/media", label: "Media" },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/seo", label: "SEO" },
  { to: "/admin/account", label: "Account" },
];

function AdminGate() {
  const { user, isPending } = useCurrentUserState();
  const [state, setState] = useState<"load" | "setup" | "deny" | "ok">("load");
  const [authRetrying, setAuthRetrying] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);

  useEffect(() => {
    if (isPending || user || authRetryCount >= 2) {
      if (user) setAuthRetrying(false);
      return;
    }

    setAuthRetrying(true);
    const timer = window.setTimeout(async () => {
      try {
        await authClient.getSession();
      } finally {
        setAuthRetryCount((value) => value + 1);
        setAuthRetrying(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isPending, user, authRetryCount]);

  useEffect(() => {
    if (isPending || authRetrying) return;
    if (!user) {
      setState("load");
      return;
    }
    void (async () => {
      try {
        const session = await getAdminSession();
        if (!session.hasAdmins) {
          await bootstrapAdmin();
          setState("ok");
          return;
        }
        setState(session.isAdmin ? "ok" : "deny");
      } catch {
        setState("deny");
      }
    })();
  }, [user, isPending, authRetrying]);

  if (isPending || authRetrying || (!user && authRetryCount < 2) || (user && state === "load")) {
    return (
      <div className="grid min-h-screen place-items-center bg-navy text-fg">
        <p className="font-display uppercase tracking-[0.16em]">Checking access…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;
  if (state === "deny") {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl uppercase">Access denied</h1>
          <p className="mt-3 text-steel">
            This account is signed in but is not an administrator. Ask an existing admin to grant access, or
            sign in with the administrator email.
          </p>
          <button type="button" className="mt-6 underline" onClick={() => void signOut("/login")}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return <AdminShell />;
}

function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-paper-2 text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 bg-navy text-fg lg:block">
          <div className="border-b border-line px-4 py-4">
            <Link to="/" className="block">
              <img src="/logo-on-dark.svg" alt="SGN" className="h-8 w-auto" />
            </Link>
            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-fg-muted">Admin</p>
          </div>
          <nav className="flex flex-col p-2">
            {NAV.map((item) => {
              const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-3 py-2 font-display text-sm uppercase tracking-[0.12em] text-fg-muted hover:bg-navy-lift hover:text-fg",
                    active && "bg-navy-lift text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-4">
            <button type="button" onClick={() => void signOut("/")} className="text-xs text-fg-muted underline">
              Sign out
            </button>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-4 py-3 lg:hidden">
            <p className="font-display uppercase">Admin</p>
            <Link to="/" className="text-sm underline">
              View site
            </Link>
          </header>
          <nav className="flex gap-2 overflow-x-auto border-b border-ink/10 bg-paper px-3 py-2 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="shrink-0 px-2 py-1 text-xs uppercase tracking-wide">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 p-4 md:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
