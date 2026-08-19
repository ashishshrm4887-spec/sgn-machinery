import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-[0.95rem] font-semibold uppercase tracking-[0.12em] transition-all duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary: "bg-accent text-fg hover:bg-accent-hover",
        secondary: "bg-paper text-ink hover:bg-paper-2",
        outline:
          "border border-line-strong bg-transparent text-fg hover:border-fg hover:bg-fg/5",
        outlineInk:
          "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink/5",
        ghost: "bg-transparent text-fg hover:bg-fg/8",
        navy: "bg-navy text-fg hover:bg-navy-lift",
        whatsapp: "bg-[#128C7E] text-white hover:bg-[#0e7368]",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-12 px-5",
        lg: "h-14 px-7",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
