import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { listPageSeoAdmin, savePageSeo } from "@/lib/server/seo";
import { tryAdmin } from "@/lib/server/admin";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/admin/seo")({
  loader: () => tryAdmin(() => listPageSeoAdmin(), []),
  component: SeoAdmin,
});

function SeoAdmin() {
  const rows = Route.useLoaderData() as { path: string; title: string | null; description: string | null }[];
  const [drafts, setDrafts] = useState(rows);

  return (
    <div>
      <h1 className="font-display text-4xl uppercase">SEO</h1>
      <p className="text-steel">Titles and descriptions for static pages. Machine pages have their own SEO fields.</p>
      <div className="mt-6 space-y-4">
        {drafts.map((row, i) => (
          <div key={row.path} className="bg-paper p-4">
            <p className="font-display uppercase">{row.path}</p>
            <Input
              className="mt-2"
              value={row.title ?? ""}
              onChange={(e) => {
                const next = [...drafts];
                next[i] = { ...row, title: e.target.value };
                setDrafts(next);
              }}
            />
            <Input
              className="mt-2"
              value={row.description ?? ""}
              onChange={(e) => {
                const next = [...drafts];
                next[i] = { ...row, description: e.target.value };
                setDrafts(next);
              }}
            />
            <Button
              className="mt-3"
              size="sm"
              type="button"
              onClick={async () => {
                await savePageSeo({
                  data: {
                    path: row.path,
                    title: drafts[i]?.title ?? "",
                    description: drafts[i]?.description ?? "",
                  },
                });
                toast.success("SEO saved.");
              }}
            >
              Save
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
