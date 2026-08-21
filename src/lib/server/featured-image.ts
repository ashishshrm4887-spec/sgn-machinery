import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/admin-guard";
import { recordUsage } from "@/lib/server/media";
import { newId } from "@/lib/utils";

export const setMachineFeaturedImage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { machineId: string; mediaId: string }) => input)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();

    const machine = await sql.query<{ id: string; name: string }>(
      `select id, name from machines where id = $1 and archived = false`,
      [data.machineId],
    );
    if (!machine[0]) throw new Error("Machine not found.");

    const media = await sql.query<{ id: string; kind: string }>(
      `select id, kind from media_library where id = $1`,
      [data.mediaId],
    );
    if (!media[0]) throw new Error("Image not found in the media library.");
    if (media[0].kind !== "image") throw new Error("Featured machine image must be an image.");

    await sql.query(
      `delete from machine_media where machine_id = $1 and role = 'main'`,
      [data.machineId],
    );
    await sql.query(
      `delete from media_usage where entity_type = 'machine' and entity_id = $1 and field = 'main'`,
      [data.machineId],
    );
    await sql.query(
      `insert into machine_media (id, machine_id, media_id, role, sort_order)
       values ($1,$2,$3,'main',0)`,
      [newId(), data.machineId, data.mediaId],
    );
    await recordUsage(data.mediaId, "machine", data.machineId, "main");

    return { ok: true, machineName: machine[0].name };
  });

export const listMachineOptionsAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    return sql.query<{ id: string; name: string; slug: string }>(
      `select id, name, slug
         from machines
        where archived = false
        order by sort_order, name`,
    );
  });
