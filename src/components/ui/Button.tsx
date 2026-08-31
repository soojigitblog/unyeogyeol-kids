import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "cocoa" | "secondary" | "soft" | "ghost" | "onColor";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 focus-visible:ring-offset-2 focus-visible:ring-offset-milk disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-coral text-white hover:bg-coral-deep shadow-soft active:bg-coral-deep",
  cocoa: "bg-cocoa text-milk hover:bg-[#413a35] shadow-soft",
  secondary: "bg-card text-cocoa border border-line hover:border-coral-soft",
  soft: "bg-coral-tint text-coral-deep hover:bg-coral-soft",
  ghost: "bg-transparent text-cocoa-soft hover:text-cocoa",
  onColor: "bg-white text-cocoa hover:bg-white/90 shadow-soft",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm rounded-[0.95rem]",
  lg: "w-full min-h-[56px] px-7 text-[16px] rounded-cta",
};

function classes(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(" ");
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={classes(variant, size, className)}>
      {children}
    </Link>
  );
}
