import { useState, type FormEvent } from "react";
import { submitEnquiry } from "@/lib/server/enquiries";
import { uploadFile } from "@/lib/upload-client";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Props = {
  kind: "contact" | "quote";
  machines?: { name: string }[];
  defaultMachine?: string;
};

export function EnquiryForm({ kind, machines = [], defaultMachine = "" }: Props) {
  const [pending, setPending] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [fileNote, setFileNote] = useState<string | null>(null);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setFileNote(null);
    const uploaded: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      try {
        const saved = await uploadFile(file, { publicEnquiry: true });
        uploaded.push(saved.id);
      } catch (err) {
        setFileNote(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    }
    if (uploaded.length) {
      setFileIds((cur) => [...cur, ...uploaded].slice(0, 6));
      setFileNote("File uploaded successfully.");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setOk(false);
    const form = new FormData(e.currentTarget);
    const payload = {
      kind,
      fullName: String(form.get("fullName") ?? ""),
      companyName: String(form.get("companyName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      email: String(form.get("email") ?? ""),
      machineName: String(form.get("machineName") ?? ""),
      quantity: String(form.get("quantity") ?? ""),
      location: String(form.get("location") ?? ""),
      requirements: String(form.get("requirements") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      fileIds,
    };
    setPending(true);
    try {
      await submitEnquiry({ data: payload });
      setOk(true);
      e.currentTarget.reset();
      setFileIds([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn’t submit your enquiry. Please try again or contact us directly.";
      if (message.toLowerCase().includes("too many")) setError(message);
      else if (message.toLowerCase().includes("email")) setFieldErrors({ email: message });
      else if (message.toLowerCase().includes("name")) setFieldErrors({ fullName: message });
      else if (message.toLowerCase().includes("phone")) setFieldErrors({ phone: message });
      else setError(message);
    } finally {
      setPending(false);
    }
  }

  if (ok) {
    return (
      <div className="border border-success/30 bg-success/10 p-6">
        <p className="font-display text-2xl uppercase">Enquiry received</p>
        <p className="mt-2 text-sm leading-relaxed">
          Thank you. The company will review your request and contact you on the number or email you provided.
        </p>
        <Button type="button" className="mt-4" variant="navy" onClick={() => setOk(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
          <FieldError>{fieldErrors.fullName}</FieldError>
        </div>
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" autoComplete="organization" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required autoComplete="tel" />
          <FieldError>{fieldErrors.phone}</FieldError>
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" autoComplete="tel" />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
        <FieldError>{fieldErrors.email}</FieldError>
      </div>
      {kind === "quote" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="machineName">Machine</Label>
              {machines.length ? (
                <select
                  id="machineName"
                  name="machineName"
                  defaultValue={defaultMachine}
                  className="h-12 w-full border border-ink/15 bg-paper px-3"
                >
                  <option value="">Select a machine</option>
                  {machines.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input id="machineName" name="machineName" defaultValue={defaultMachine} />
              )}
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" />
          </div>
          <div>
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" name="requirements" />
          </div>
        </>
      ) : null}
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" />
      </div>
      {kind === "quote" ? (
        <div>
          <Label htmlFor="files">Reference files (images, PDF, or video)</Label>
          <input
            id="files"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
            className="block w-full text-sm"
            onChange={(e) => void onUpload(e.target.files)}
          />
          {fileNote ? <p className="mt-1 text-sm text-steel">{fileNote}</p> : null}
          {fileIds.length ? (
            <p className="mt-1 text-sm">{fileIds.length} file(s) attached.</p>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Sending…" : kind === "quote" ? "Send quotation request" : "Send message"}
      </Button>
    </form>
  );
}
