import { Link } from "@tanstack/react-router";
import type { MachineCard } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { SafeImage } from "./safe-media";
import { cn } from "@/lib/utils";

export function MachineCardView({ machine }: { machine: MachineCard }) {
  return (
    <article className="group flex h-full flex-col bg-paper shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-lift)]">
      <Link to="/machines/$slug" params={{ slug: machine.slug }} className="block">
        <SafeImage
          src={machine.imageUrl}
          alt={machine.name}
          loading="eager"
          fetchPriority="high"
          className="aspect-[16/10] w-full"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {machine.category ? <p className="kicker mb-2">{machine.category}</p> : null}
        <h3 className="font-display text-2xl uppercase tracking-wide">
          <Link to="/machines/$slug" params={{ slug: machine.slug }} className="hover:text-accent">
            {machine.name}
          </Link>
        </h3>
        {machine.shortDescription ? (
          <p className="mt-2 text-sm leading-relaxed text-steel">{machine.shortDescription}</p>
        ) : null}
        {machine.highlightSpec ? (
          <p className="mt-4 border-l-2 border-accent pl-3 text-sm">
            <span className="font-semibold text-ink">{machine.highlightSpec.label}: </span>
            <span>{machine.highlightSpec.value}</span>
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Link
            to="/machines/$slug"
            params={{ slug: machine.slug }}
            className={cn(buttonVariants({ variant: "navy", size: "sm" }))}
          >
            View details
          </Link>
          <Link
            to="/quote"
            search={{ machine: machine.name }}
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Request quote
          </Link>
        </div>
      </div>
    </article>
  );
}
