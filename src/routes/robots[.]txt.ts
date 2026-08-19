import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const host = process.env.VITE_PUBLIC_HOSTNAME;
        const sitemap = host ? `Sitemap: https://${host}/sitemap.xml\n` : "";
        const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /api/\n${sitemap}`;
        return new Response(body, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
