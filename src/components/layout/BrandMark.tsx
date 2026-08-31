import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-baseline gap-1.5">
      <span className="text-[19px] font-extrabold tracking-tight text-cocoa">
        운의결
      </span>
      <span className="text-[19px] font-extrabold tracking-tight text-coral-deep">
        kids
      </span>
      <span
        aria-hidden
        className="mb-0.5 h-1.5 w-1.5 self-end rounded-full bg-coral"
      />
    </Link>
  );
}
