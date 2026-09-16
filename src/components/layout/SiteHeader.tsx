import { BrandMark } from "./BrandMark";
import { Container } from "./Container";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-milk/80 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between">
        <BrandMark />
        <Link
          href="/my-results"
          className="text-[13px] font-medium text-cocoa-soft hover:text-cocoa"
        >
          내 결과
        </Link>
      </Container>
    </header>
  );
}
