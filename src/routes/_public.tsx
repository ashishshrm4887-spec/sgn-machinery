import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/site-shell";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <SiteShell>
      <Outlet />
    </SiteShell>
  );
}
