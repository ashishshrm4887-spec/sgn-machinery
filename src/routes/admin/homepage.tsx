import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getCompanyAdmin, saveCompany, tryAdmin } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { uploadFile } from "@/lib/upload-client";
import { newId } from "@/lib/utils";
import type { CompanyPublic } from "@/lib/types";

export const Route = createFileRoute("/admin/homepage")({
  loader: () => tryAdmin(() => getCompanyAdmin(), null),
  component: HomepageEditor,
});

function HomepageEditor() {
  const initial = Route.useLoaderData();
  if (!initial) return <p>Loading homepage…</p>;
  const [data, setData] = useState<CompanyPublic>(initial);
  const [busy, setBusy] = useState(false);

  function patch<K extends keyof CompanyPublic>(key: K, value: CompanyPublic[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function uploadTo(field: "heroImageUrl" | "heroVideoUrl", file?: File) {
    if (!file) return;
    try {
      const uploaded = await uploadFile(file);
      patch(field, uploaded.url || `/api/media/${uploaded.id}`);
      toast.success("Media uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await saveCompany({ data });
      setData(saved);
      toast.success("Homepage content saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase">Homepage</h1>
        <p className="text-steel">Hero, about excerpt, and “why choose us” blocks. Featured machines are set on each machine.</p>
      </div>
      <div>
        <Label>Hero title</Label>
        <Input value={data.heroTitle} onChange={(e) => patch("heroTitle", e.target.value)} />
      </div>
      <div>
        <Label>Hero description</Label>
        <Textarea value={data.heroDescription} onChange={(e) => patch("heroDescription", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Primary button</Label>
          <Input value={data.heroCtaPrimary} onChange={(e) => patch("heroCtaPrimary", e.target.value)} />
        </div>
        <div>
          <Label>Secondary button</Label>
          <Input value={data.heroCtaSecondary} onChange={(e) => patch("heroCtaSecondary", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Hero image</Label>
        <img src={data.heroImageUrl} alt="" className="mb-2 aspect-[16/7] w-full object-cover" />
        <input type="file" accept="image/*" onChange={(e) => void uploadTo("heroImageUrl", e.target.files?.[0])} />
      </div>
      <div>
        <Label>Hero video (optional — image is the fallback)</Label>
        <Input
          value={data.heroVideoUrl}
          onChange={(e) => patch("heroVideoUrl", e.target.value)}
          placeholder="Leave empty to use the image"
        />
        <input
          type="file"
          accept="video/mp4,video/webm"
          className="mt-2 block"
          onChange={(e) => void uploadTo("heroVideoUrl", e.target.files?.[0])}
        />
      </div>
      <div>
        <Label>About excerpt (homepage)</Label>
        <Textarea value={data.aboutShort} onChange={(e) => patch("aboutShort", e.target.value)} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="mb-0">Why choose us</Label>
          <Button
            type="button"
            size="sm"
            variant="outlineInk"
            onClick={() =>
              patch("whyChooseUs", [...data.whyChooseUs, { id: newId(), title: "", body: "" }])
            }
          >
            Add block
          </Button>
        </div>
        <div className="space-y-3">
          {data.whyChooseUs.map((item, i) => (
            <div key={item.id} className="bg-paper p-3">
              <Input
                value={item.title}
                placeholder="Title"
                onChange={(e) => {
                  const next = [...data.whyChooseUs];
                  next[i] = { ...item, title: e.target.value };
                  patch("whyChooseUs", next);
                }}
              />
              <Textarea
                className="mt-2"
                value={item.body}
                placeholder="Body — only confirmed facts"
                onChange={(e) => {
                  const next = [...data.whyChooseUs];
                  next[i] = { ...item, body: e.target.value };
                  patch("whyChooseUs", next);
                }}
              />
              <button
                type="button"
                className="mt-2 text-sm text-accent underline"
                onClick={() => patch("whyChooseUs", data.whyChooseUs.filter((x) => x.id !== item.id))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>SEO title</Label>
          <Input value={data.seoTitle} onChange={(e) => patch("seoTitle", e.target.value)} />
        </div>
        <div>
          <Label>SEO description</Label>
          <Input value={data.seoDescription} onChange={(e) => patch("seoDescription", e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save homepage"}
      </Button>
    </form>
  );
}
