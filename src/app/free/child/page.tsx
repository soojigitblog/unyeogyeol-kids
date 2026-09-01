"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useKids } from "@/lib/store";
import { computeAge } from "@/lib/age";
import type { Gender } from "@/lib/types";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDaysInMonth(y: number, m: number): number {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

export default function ChildInputPage() {
  const router = useRouter();
  const { child, setChild } = useKids();

  const initialParts = child?.birthDate ? child.birthDate.split("-") : [];
  const [year, setYear] = useState<string>(initialParts[0] ?? "");
  const [month, setMonth] = useState<string>(
    initialParts[1] ? String(Number(initialParts[1])) : ""
  );
  const [day, setDay] = useState<string>(
    initialParts[2] ? String(Number(initialParts[2])) : ""
  );

  const [name, setName] = useState(child?.name ?? "");
  const [gender, setGender] = useState<Gender | "">(child?.gender ?? "");
  const [birthTimeKnown, setBirthTimeKnown] = useState(
    child?.birthTimeKnown ?? false,
  );
  const [hour, setHour] = useState<string>(
    child?.birthTime ? child.birthTime.split(":")[0] : "",
  );

  // 년/월/일이 모두 선택되었을 때 YYYY-MM-DD 생성
  const birthDate = useMemo(() => {
    if (!year || !month || !day) return "";
    const yNum = Number(year);
    const mNum = Number(month);
    let dNum = Number(day);
    const maxDays = getDaysInMonth(yNum, mNum);
    if (dNum > maxDays) dNum = maxDays;
    return `${year}-${String(month).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
  }, [year, month, day]);

  const maxDays = useMemo(
    () => getDaysInMonth(Number(year), Number(month)),
    [year, month]
  );
  const dayOptions = useMemo(
    () => Array.from({ length: maxDays }, (_, i) => i + 1),
    [maxDays]
  );

  const age = useMemo(
    () => (birthDate ? computeAge(birthDate) : null),
    [birthDate],
  );
  const dateError = Boolean(year && month && day && !age);
  const canSubmit = Boolean(birthDate && age && gender);

  const inputCls =
    "mt-2 w-full rounded-[1.05rem] border border-line bg-card px-4 py-3.5 text-[15.5px] text-cocoa placeholder:text-cocoa-faint focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15";
  const selectCls =
    "w-full rounded-[1.05rem] border border-line bg-card px-3 py-3.5 text-[15px] font-medium text-cocoa focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15";

  function handleSubmit() {
    if (!canSubmit || !gender) return;
    setChild({
      name: name.trim() || undefined,
      birthDate,
      gender,
      birthTimeKnown,
      birthTime:
        birthTimeKnown && hour !== "" ? `${hour.padStart(2, "0")}:00` : undefined,
    });
    router.push("/free/questions");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-12 pt-4">
        <Container>
          <div className="animate-rise">
            <p className="text-[13px] font-semibold text-coral-deep">
              우리 아이 이야기 · 1/2
            </p>
            <h1 className="mt-2 text-[26px] font-bold leading-snug tracking-tight text-cocoa">
              우리 아이를
              <br />
              알려 주세요
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-cocoa-soft">
              태어난 날의 정보로 아이의 타고난 결을 봐요.
              <br />
              이름은 없어도 괜찮아요.
            </p>
          </div>

          <form
            className="mt-7 flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* 이름(선택) */}
            <div>
              <label className="text-[14px] font-semibold text-cocoa" htmlFor="name">
                아이 이름 · 태명{" "}
                <span className="font-medium text-cocoa-faint">(선택)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 하윤, 콩이"
                maxLength={20}
                className={inputCls}
              />
            </div>

            {/* 생년월일 (년 - 월 - 일 순서) */}
            <div>
              <span className="text-[14px] font-semibold text-cocoa">
                생년월일
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <select
                    id="birth_year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className={selectCls}
                    aria-label="태어난 연도"
                  >
                    <option value="">년도</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}년
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    id="birth_month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className={selectCls}
                    aria-label="태어난 월"
                  >
                    <option value="">월</option>
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={String(m)}>
                        {m}월
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    id="birth_day"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className={selectCls}
                    aria-label="태어난 일"
                  >
                    <option value="">일</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={String(d)}>
                        {d}일
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {dateError && (
                <p className="mt-2 text-[13px] text-coral-deep">
                  미래 날짜는 선택할 수 없어요. 날짜를 다시 확인해 주세요.
                </p>
              )}
              {age && (
                <p className="mt-2.5 text-[14px] text-sage-deep">
                  지금 <b className="text-cocoa">{age.ageDisplay}</b> ({year}년 {month}월 {day}일생)
                  {!age.inTargetRange && (
                    <span className="text-cocoa-faint">
                      {" "}· 2~7세 아이에게 가장 잘 맞아요
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <span
                id="child-gender-label"
                className="text-[14px] font-semibold text-cocoa"
              >
                성별
              </span>
              <div
                role="radiogroup"
                aria-labelledby="child-gender-label"
                className="mt-2 grid grid-cols-2 gap-3"
              >
                {(
                  [
                    { v: "girl", label: "여아" },
                    { v: "boy", label: "남아" },
                  ] as const
                ).map((opt) => {
                  const active = gender === opt.v;
                  const inputId = `child-gender-${opt.v}`;
                  return (
                    <label
                      key={opt.v}
                      htmlFor={inputId}
                      className={`flex min-h-[48px] cursor-pointer touch-manipulation select-none items-center justify-center rounded-[1.05rem] border px-4 py-3.5 text-[15.5px] font-medium transition-all active:scale-[0.99] ${
                        active
                          ? "border-coral bg-coral-tint text-cocoa"
                          : "border-line bg-card text-cocoa-soft hover:border-coral-soft"
                      }`}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name="child-gender"
                        value={opt.v}
                        checked={active}
                        onChange={() => setGender(opt.v)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 출생시간 */}
            <div>
              <span className="text-[14px] font-semibold text-cocoa">
                태어난 시간{" "}
                <span className="font-medium text-cocoa-faint">
                  (몰라도 괜찮아요)
                </span>
              </span>
              <label className="mt-2 flex items-center gap-2.5 text-[14px] text-cocoa-soft">
                <input
                  type="checkbox"
                  checked={!birthTimeKnown}
                  onChange={(e) => setBirthTimeKnown(!e.target.checked)}
                  className="h-4 w-4 accent-coral"
                />
                시간을 몰라요
              </label>
              {birthTimeKnown && (
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className={inputCls}
                >
                  <option value="">태어난 시(時)를 골라 주세요</option>
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={String(h)}>
                      {h.toString().padStart(2, "0")}시대 ({h}:00~{h}:59)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button type="submit" size="lg" disabled={!canSubmit}>
              질문 보러 가기
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Button>
            <p className="-mt-2 text-center text-[12.5px] text-cocoa-faint">
              입력한 정보는 이 기기에만 저장돼요.
            </p>
          </form>
        </Container>
      </main>
    </>
  );
}
