import { getSql } from "@/lib/db";
import { getSessionUser, UnauthorizedError } from "@/lib/auth/verify.server";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function countAdmins(): Promise<number> {
  const sql = await getSql();
  const rows = await sql.query<{ n: number }>(
    `select count(*)::int as n from admin_users where revoked_at is null`,
  );
  return Number(rows[0]?.n ?? 0);
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query(
    `select 1 from admin_users where user_id = $1 and revoked_at is null`,
    [userId],
  );
  return rows.length > 0;
}

export async function requireAdmin(userId: string): Promise<void> {
  if (!(await isAdminUser(userId))) {
    throw new ForbiddenError("Administrator access required.");
  }
}

export async function claimFirstAdmin(userId: string, email: string | null, name: string | null) {
  const sql = await getSql();
  const n = await countAdmins();
  if (n > 0) throw new ForbiddenError("An administrator already exists.");
  try {
    await sql.query(
      `insert into admin_users (user_id, email, display_name) values ($1,$2,$3)
       on conflict (user_id) do update set revoked_at = null, email = excluded.email`,
      [userId, email, name],
    );
  } catch (error) {
    // The partial unique index in migration 0006 makes the first-admin claim
    // atomic across concurrent requests. Convert its uniqueness failure into the
    // same safe 403 response as the normal already-configured path.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    ) {
      throw new ForbiddenError("An administrator already exists.");
    }
    throw error;
  }
}

export async function optionalSession(bearer?: string) {
  try {
    return await getSessionUser(bearer);
  } catch {
    return null;
  }
}

export { UnauthorizedError };
