import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { listMediaAdmin, removeMedia, renameMedia, tryAdmin } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatBytes, formatDate } from "@/lib/utils";
import { uploadFile } from "@/lib/upload-client";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/media")({
  loader: () => tryAdmin(() => listMediaAdmin({ data: "" }), []),
  component: MediaAdmin,
});

function MediaAdmin() {
  const initial = Route.useLoaderData();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const router = useRouter();

  async function search(value: string) {
    setQ(value);
    setItems(await listMediaAdmin({ data: value }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl uppercase">Media library</h1>
          <p className="text-steel">Files are stored in the database (or object storage when configured), not in GitHub.</p>
        </div>
        <label className="cursor-pointer bg-accent px-4 py-2 font-display text-sm uppercase tracking-wide text-fg">
          Upload
          <input
            type="file"
            className="hidden"
            accept="image/*,video/mp4,video/webm,application/pdf"
            multiple
            onChange={async (e) => {
              for (const file of Array.from(e.target.files ?? [])) {
                try {
                  await uploadFile(file);
                  toast.success("File uploaded successfully.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
                }
              }
              await router.invalidate();
              setItems(await listMediaAdmin({ data: q }));
            }}
          />
        </label>
      </div>
      <Input
        className="mt-6 max-w-md"
        placeholder="Search files"
        value={q}
        onChange={(e) => void search(e.target.value)}
      />
      <div className="mt-6 overflow-x-auto bg-paper">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-navy text-fg">
            <tr>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Uploaded</th>
              <th className="px-3 py-2">Used by</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-ink/10">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {item.kind === "image" ? (
                      <img src={item.publicUrl || `/api/media/${item.id}`} alt="" className="h-10 w-12 object-cover" />
                    ) : null}
                    <input
                      defaultValue={item.originalName}
                      className="h-9 w-48 border border-ink/10 px-2"
                      onBlur={async (e) => {
                        if (e.target.value === item.originalName) return;
                        await renameMedia({ data: { id: item.id, name: e.target.value } });
                        toast.success("Renamed.");
                      }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">{item.kind}</td>
                <td className="px-3 py-2">{formatBytes(item.sizeBytes)}</td>
                <td className="px-3 py-2">{formatDate(item.createdAt)}</td>
                <td className="px-3 py-2 text-xs">
                  {item.usage.length
                    ? item.usage.map((u) => `${u.entity_type}:${u.field}`).join(", ")
                    : "Unused"}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-accent underline"
                    onClick={async () => {
                      const used = item.usage.length > 0;
                      if (used && !confirm("This file is in use. Delete it anyway? Pages that reference it will fall back to a placeholder.")) {
                        return;
                      }
                      if (!used && !confirm("Delete this file?")) return;
                      const result = await removeMedia({ data: { id: item.id, force: used } });
                      if (!result.ok) {
                        toast.error("This file is still in use.");
                        return;
                      }
                      toast.success("Deleted.");
                      setItems(await listMediaAdmin({ data: q }));
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
