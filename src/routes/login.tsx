import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapAdmin, getAdminSession, getSetupState } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

export const Route = createFileRoute("/login")({
  loader: () => getSetupState(),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Administrator sign in | SGN" }] }),
});

function LoginPage() {
  const { hasAdmins } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode] = useState<"setup" | "signin">(hasAdmins ? "signin" : "setup");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPending || !user) return;
    void (async () => {
      try {
        const session = await getAdminSession();
        if (!session.hasAdmins) {
          await bootstrapAdmin();
          navigate({ to: "/admin" });
          return;
        }
        if (session.isAdmin) navigate({ to: "/admin" });
      } catch {
        /* stay on login */
      }
    })();
  }, [user, isPending, navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "Administrator");
    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "setup") {
        const { error: err } = await authClient.signUp.email({ email, password, name });
        if (err) throw new Error(err.message || "Could not create the account.");
        await bootstrapAdmin();
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message || "Sign-in failed.");
      }
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-navy px-4 text-fg">
      <div className="w-full max-w-md border border-line bg-navy-mid p-8">
        <img src="/logo-on-dark.svg" alt="SGN" className="h-14 w-auto" />
        <h1 className="mt-6 font-display text-3xl uppercase">
          {mode === "setup" ? "Create administrator" : "Administrator sign in"}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          {mode === "setup"
            ? "The first account becomes the site administrator. Create it now and keep the password safe."
            : "Sign in with the administrator email and password."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          {mode === "setup" ? (
            <div>
              <Label htmlFor="name" className="text-fg-muted">
                Name
              </Label>
              <Input id="name" name="name" defaultValue="Administrator" className="bg-navy text-fg" />
            </div>
          ) : null}
          <div>
            <Label htmlFor="email" className="text-fg-muted">
              Email
            </Label>
            <Input id="email" name="email" type="email" required autoComplete="username" className="bg-navy text-fg" />
          </div>
          <div>
            <Label htmlFor="password" className="text-fg-muted">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={mode === "setup" ? "new-password" : "current-password"}
              className="bg-navy text-fg"
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "setup" ? "Create admin account" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-xs text-fg-muted">
          Password reset requires a signed-in session. Change the password from the admin account page after
          signing in.{" "}
          <Link to="/" className="underline">
            Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
