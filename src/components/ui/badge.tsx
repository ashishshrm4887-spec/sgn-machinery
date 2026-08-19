import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "navy",
  className,
}: {
  children: React.ReactNode;
  tone?: "navy" | "red" | "paper" | "ok" | "warn" | "muted";
  className?: string;
}) {
  const tones = {
    navy: "bg-navy text-fg",
    red: "bg-accent text-fg",
    paper: "bg-paper-2 text-ink",
    ok: "bg-success/15 text-success",
    warn: "bg-warning/15 text-warning",
    muted: "bg-ink/8 text-steel",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 font-display text-[0.7rem] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
