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
      const saved = await saveCompany({
        data: {
          ...data,
          phones: phones
            .split(/\n|,/)
            .map((p) => p.trim())
            .filter(Boolean),
        },
      });
      setData(saved);
      toast.success("Company details saved. The public website now uses these values.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase">Company</h1>
        <p className="text-steel">These fields drive every phone, email, WhatsApp, and logo on the site.</p>
      </div>
      <Field label="Company name">
        <Input value={data.companyName} onChange={(e) => patch("companyName", e.target.value)} />
      </Field>
      <Field label="Business line">
        <Input value={data.businessLine} onChange={(e) => patch("businessLine", e.target.value)} />
      </Field>
      <Field label="Tagline">
        <Input value={data.tagline} onChange={(e) => patch("tagline", e.target.value)} />
      </Field>
      <Field label="Short introduction">
        <Textarea value={data.aboutShort} onChange={(e) => patch("aboutShort", e.target.value)} />
      </Field>
      <Field label="Full about text">
        <Textarea value={data.aboutFull} onChange={(e) => patch("aboutFull", e.target.value)} />
      </Field>
      <Field label="Engineering focus">
        <Textarea value={data.engineeringFocus} onChange={(e) => patch("engineeringFocus", e.target.value)} />
      </Field>
      <Field label="Manufacturing capabilities">
        <Textarea
          value={data.manufacturingCapabilities}
          onChange={(e) => patch("manufacturingCapabilities", e.target.value)}
        />
      </Field>
      <Field label="Phone numbers (one per line)">
        <Textarea value={phones} onChange={(e) => setPhones(e.target.value)} />
      </Field>
      <Field label="WhatsApp number">
        <Input value={data.whatsapp} onChange={(e) => patch("whatsapp", e.target.value)} />
      </Field>
      <Field label="Email">
        <Input type="email" value={data.email} onChange={(e) => patch("email", e.target.value)} />
      </Field>
      <Field label="Address">
        <Textarea value={data.address} onChange={(e) => patch("address", e.target.value)} />
      </Field>
      <Field label="Google Maps embed URL">
        <Input value={data.mapsUrl} onChange={(e) => patch("mapsUrl", e.target.value)} />
      </Field>
      <Field label="Business hours">
        <Textarea value={data.businessHours} onChange={(e) => patch("businessHours", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Logo</Label>
          <img src={data.logoUrl} alt="" className="mb-2 h-14 w-auto bg-paper" />
          <input type="file" accept="image/*" onChange={(e) => void onLogo(e.target.files?.[0], "logoUrl")} />
        </div>
        <div>
          <Label>Favicon</Label>
          <img src={data.faviconUrl} alt="" className="mb-2 h-10 w-10 bg-navy" />
          <input type="file" accept="image/*" onChange={(e) => void onLogo(e.target.files?.[0], "faviconUrl")} />
        </div>
      </div>
      <div>
        <Label>Social links</Label>
        {data.socialLinks.map((s, i) => (
          <div key={s.id} className="mt-2 grid grid-cols-2 gap-2">
            <Input
              placeholder="Label"
              value={s.label}
              onChange={(e) => {
                const next = [...data.socialLinks];
                next[i] = { ...s, label: e.target.value };
                patch("socialLinks", next);
              }}
            />
            <Input
              placeholder="URL"
              value={s.url}
              onChange={(e) => {
                const next = [...data.socialLinks];
                next[i] = { ...s, url: e.target.value };
                patch("socialLinks", next);
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outlineInk"
          size="sm"
          className="mt-2"
          onClick={() => patch("socialLinks", [...data.socialLinks, { id: newId(), label: "", url: "" }])}
        >
          Add link
        </Button>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save company details"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
