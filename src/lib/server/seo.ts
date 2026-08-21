import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/admin-guard";

const seoInput = z.object({
  path: z.string().trim().min(1).max(200),
  title: z.string().max(200),
  description: z.string().max(500),
});

export const listPageSeoAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    return sql.query<{ path: string; title: string | null; description: string | null }>(
      `select path, title, description from page_seo order by path`,
    );
  });

export const savePageSeo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => seoInput.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql.query(
      `insert into page_seo (path, title, description)
       values ($1,$2,$3)
       on conflict (path) do update set title = excluded.title, description = excluded.description`,
      [data.path, data.title.trim(), data.description.trim()],
    );
    return { ok: true };
  });
