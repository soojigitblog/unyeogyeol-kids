import Link from "next/link";
import { Container } from "./Container";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-cream">
      <Container className="py-10">
        <p className="text-[17px] font-bold text-cocoa">운의결 kids</p>
        <p className="mt-1 text-sm text-cocoa-soft">
          아이를 바꾸기 전에, 이해하는 법부터.
        </p>

        <div className="mt-5 rounded-2xl bg-milk p-4 text-xs leading-relaxed text-cocoa-soft">
          운의결 kids는 아이의 기질을 <b className="text-cocoa">이해</b>하기 위한
          서비스예요. 의학적·발달적 진단은 하지 않아요. 발달이 걱정되신다면 전문
          기관의 평가를 받아 보시길 권해요.
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-cocoa-faint">
          <Link href="/safety" className="hover:text-cocoa">
            안내 · 안전 고지
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="hover:text-cocoa">
            이용약관
          </Link>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="hover:text-cocoa">
            개인정보처리방침
          </Link>
          <span aria-hidden>·</span>
          <Link href="/refund" className="hover:text-cocoa">
            환불·취소 안내
          </Link>
          <span aria-hidden>·</span>
          <span>© {new Date().getFullYear()} 운의결 kids</span>
        </div>
      </Container>
    </footer>
  );
}
