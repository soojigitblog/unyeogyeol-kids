import { BrandMark } from "./BrandMark";
import { Container } from "./Container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 bg-milk/80 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between">
        <BrandMark />
      </Container>
    </header>
  );
}
