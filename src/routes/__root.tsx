import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteProvider } from "@/lib/site-context";
import { getCompanyPublic } from "@/lib/server/site";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Shree Guru Nanak Dev Machinery Company";
const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const ogImage = host ? `https://${host}/og.jpg` : undefined;
const xBanner = host
  ? `https://og.grok.me/v1/banner.png?host=${encodeURIComponent(host)}&title=${encodeURIComponent(APP_NAME)}&color=07111F`
  : undefined;

export const Route = createRootRoute({
  beforeLoad: async () => {
    const company = await getCompanyPublic();
    return { company };
  },
  notFoundComponent: () => (
    <main className="grid min-h-screen place-items-center bg-navy px-4 text-center text-fg">
      <div>
        <p className="kicker">404</p>
        <h1 className="mt-3 font-display text-4xl uppercase">Page not found</h1>
        <p className="mt-3 text-fg-muted">That page is not on this website.</p>
        <a href="/" className="mt-6 inline-block bg-accent px-5 py-3 font-display uppercase tracking-[0.12em]">
          Back to home
        </a>
      </div>
    </main>
  ),
  head: ({ match }) => {
    const company = match.context.company;
    const title = company?.seoTitle || APP_NAME;
    const description =
      company?.seoDescription ||
      "Corrugated board and allied machinery. Request a quotation from Shree Guru Nanak Dev Machinery Company.";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        { name: "apple-mobile-web-app-title", content: "SGN Machinery" },
        { name: "theme-color", content: "#07111F" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(ogImage
          ? [
              { property: "og:image", content: ogImage },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
            ]
          : []),
        ...(xBanner
          ? [
              { property: "x:game:image", content: xBanner },
              { property: "x:game:image:width", content: "1200" },
              { property: "x:game:image:height", content: "264" },
            ]
          : []),
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: company?.faviconUrl || "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
        },
        ...(host ? [{ rel: "canonical", href: `https://${host}/` }] : []),
      ],
    };
  },
  component: RootDocument,
});

function RootDocument() {
  const { company } = Route.useRouteContext();
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <SiteProvider company={company}>
            <Outlet />
            <Toaster richColors position="top-center" />
          </SiteProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
