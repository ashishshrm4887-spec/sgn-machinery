import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const host = process.env.VITE_PUBLIC_HOSTNAME || "localhost";
        const origin = host.includes("localhost") ? `http://${host}` : `https://${host}`;
        const sql = await getSql();
        const machines = await sql.query<{ slug: string }>(
          `select slug from machines where published = true and archived = false`,
        );
        const projects = await sql.query<{ slug: string }>(
          `select slug from projects where published = true and archived = false`,
        );
        const staticPaths = ["/", "/machines", "/services", "/projects", "/gallery", "/about", "/contact", "/quote"];
        const urls = [
          ...staticPaths.map((p) => `${origin}${p}`),
          ...machines.map((m) => `${origin}/machines/${m.slug}`),
          ...projects.map((p) => `${origin}/projects/${p.slug}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
