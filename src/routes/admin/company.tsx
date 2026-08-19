import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getCompanyAdmin, saveCompany, tryAdmin } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { uploadFile } from "@/lib/upload-client";
import { newId } from "@/lib/utils";
import type { CompanyPublic } from "@/lib/types";

export const Route = createFileRoute("/admin/company")({
  loader: () => tryAdmin(() => getCompanyAdmin(), null),
  component: CompanyAdminPage,
});

function CompanyAdminPage() {
  const initial = Route.useLoaderData();
  const [data, setData] = useState<CompanyPublic | null>(initial);
  const [phones, setPhones] = useState(() => (initial ? initial.phones.join("\n") : ""));
  const [busy, setBusy] = useState(false);

  if (!data) return <p>Loading company…</p>;

  function patch<K extends keyof CompanyPublic>(key: K, value: CompanyPublic[K]) {
    setData((d) => (d ? { ...d, [key]: value } : d));
  }

  async function onLogo(file: File | undefined, field: "logoUrl" | "faviconUrl") {
    if (!file) return;
    try {
      const uploaded = await uploadFile(file);
      patch(field, uploaded.url || `/api/media/${uploaded.id}`);
      toast.success("Image uploaded successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const phoneList = phones
        .split(/[\n,]/)
        .map((p) => p.trim())
        .filter(Boolean);
      await saveCompany({
        data: {
          ...data,
          phones: phoneList,
        },
      });
      toast.success("Company details saved. The public website now uses these values.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl uppercase">Company</h1>
      <p className="text-steel">Contact details and brand identity used across the public site.</p>
      <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-4">
        <div>
          <Label>Company name</Label>
          <Input value={data.companyName} onChange={(e) => patch("companyName", e.target.value)} />
        </div>
        <div>
          <Label>Business line</Label>
          <Input value={data.businessLine} onChange={(e) => patch("businessLine", e.target.value)} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={data.tagline} onChange={(e) => patch("tagline", e.target.value)} />
        </div>
        <div>
          <Label>About (short)</Label>
          <Textarea value={data.aboutShort} onChange={(e) => patch("aboutShort", e.target.value)} rows={3} />
        </div>
        <div>
          <Label>About (full)</Label>
          <Textarea value={data.aboutFull} onChange={(e) => patch("aboutFull", e.target.value)} rows={6} />
        </div>
        <div>
          <Label>Phones (one per line)</Label>
          <Textarea value={phones} onChange={(e) => setPhones(e.target.value)} rows={3} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={data.whatsapp} onChange={(e) => patch("whatsapp", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={data.email} onChange={(e) => patch("email", e.target.value)} />
        </div>
        <div>
          <Label>Address</Label>
          <Textarea value={data.address} onChange={(e) => patch("address", e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Maps URL</Label>
          <Input value={data.mapsUrl} onChange={(e) => patch("mapsUrl", e.target.value)} />
        </div>
        <div>
          <Label>Business hours</Label>
          <Input value={data.businessHours} onChange={(e) => patch("businessHours", e.target.value)} />
        </div>
        <div>
          <Label>Logo URL</Label>
          <div className="flex gap-2">
            <Input value={data.logoUrl} onChange={(e) => patch("logoUrl", e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => void onLogo(e.target.files?.[0], "logoUrl")} />
          </div>
        </div>
        <div>
          <Label>Favicon URL</Label>
          <div className="flex gap-2">
            <Input value={data.faviconUrl} onChange={(e) => patch("faviconUrl", e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => void onLogo(e.target.files?.[0], "faviconUrl")} />
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save company"}
        </Button>
      </form>
    </div>
  );
}
