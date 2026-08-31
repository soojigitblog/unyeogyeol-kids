import { describe, expect, it } from "vitest";
import {
  computeDayPillar,
  computeFortuneFacts,
  computeHourPillar,
  computeTenGod,
  hourToBranchIndex,
  toJDN,
} from "./engine";

// 권위 있는 표준 만세력에서 검증한 일진(日辰) fixtures.
// 포함: 1980~1990년대, 2000년대, 2020년대, 윤년(2/29), 연/월 경계.
const DAY_PILLAR_FIXTURES: Array<[number, number, number, string, string]> = [
  // P2.2V.4 LOCK Fixtures
  [2024, 4, 15, "己", "酉"], // FORTUNE-01 (열무: 己酉)
  [1991, 8, 20, "壬", "戌"], // FORTUNE-02 (열무맘: 壬戌)
  // 1980~1990년대
  [1988, 8, 8, "乙", "未"],
  [1995, 12, 31, "丙", "申"], // 연말 경계
  [1999, 12, 31, "丁", "巳"],
  // 2000년대
  [2000, 1, 1, "戊", "午"], // 2000년 1월 1일 기준
  [2000, 1, 2, "己", "未"],
  [2000, 1, 3, "庚", "申"],
  [2000, 2, 4, "壬", "辰"], // 월 경계 넘김(입춘)
  [2004, 2, 29, "戊", "寅"], // 윤년 2월 29일
  // 2010~2020년대
  [2010, 10, 10, "癸", "巳"],
  [2020, 1, 1, "癸", "卯"],
  [2024, 1, 1, "甲", "子"],
  [2024, 2, 29, "癸", "亥"], // 윤년 2월 29일
  [2026, 12, 31, "己", "卯"],
];

describe("P2.2V.4 Permanent Regression LOCK Fixtures", () => {
  it("Fixture FORTUNE-01: 2024-04-15 09:30 -> dayPillar=己酉, dayStem=己, dayMasterElement=earth, hourPillar=己巳", () => {
    const facts = computeFortuneFacts("2024-04-15", true, "09:30");
    expect(facts).not.toBeNull();
    expect(facts!.day.stem).toBe("己");
    expect(facts!.day.branch).toBe("酉");
    expect(facts!.dayMasterElement).toBe("earth");
    expect(facts!.hour).not.toBeNull();
    expect(facts!.hour!.stem).toBe("己");
    expect(facts!.hour!.branch).toBe("巳");
    expect(facts!.hourTenGod).toBe("비견");
  });

  it("Fixture FORTUNE-02: 1991-08-20 unknown time -> dayPillar=壬戌, dayStem=壬, dayMasterElement=water, hourPillar=null", () => {
    const facts = computeFortuneFacts("1991-08-20", false);
    expect(facts).not.toBeNull();
    expect(facts!.day.stem).toBe("壬");
    expect(facts!.day.branch).toBe("戌");
    expect(facts!.dayMasterElement).toBe("water");
    expect(facts!.hour).toBeNull();
    expect(facts!.hourTenGod).toBeNull();
  });
});

describe("일주(day pillar) 계산 — fixture 검증", () => {
  it.each(DAY_PILLAR_FIXTURES)(
    "%i-%i-%i 은 %s%s 일이다",
    (y, m, d, stem, branch) => {
      const p = computeDayPillar(y, m, d);
      expect(p.stem).toBe(stem);
      expect(p.branch).toBe(branch);
    },
  );

  it("연속된 날짜는 60갑자 인덱스가 1씩 증가한다", () => {
    const a = toJDN(2000, 1, 1);
    const b = toJDN(2000, 1, 2);
    expect(b - a).toBe(1);
  });
});

describe("시(時) -> 지지 매핑", () => {
  it("子시는 23시와 0시를 포함한다", () => {
    expect(hourToBranchIndex(23)).toBe(0);
    expect(hourToBranchIndex(0)).toBe(0);
  });
  it("午시는 11~12시를 포함한다", () => {
    expect(hourToBranchIndex(11)).toBe(6);
    expect(hourToBranchIndex(12)).toBe(6);
  });
});

describe("시두법(五鼠遁) — 시주 천간", () => {
  // 甲일 子시 = 甲子시 (甲己일 子시는 甲으로 시작)
  it("甲일 자시(00시)의 시주는 甲子", () => {
    const p = computeHourPillar("甲", 0);
    expect(p.stem).toBe("甲");
    expect(p.branch).toBe("子");
  });
  // 戊일 子시 = 壬子시 (戊癸일 子시는 壬으로 시작)
  it("戊일 자시(00시)의 시주는 壬子", () => {
    const p = computeHourPillar("戊", 0);
    expect(p.stem).toBe("壬");
    expect(p.branch).toBe("子");
  });
  // 甲일 午시 = 庚午시 (子=甲,丑=乙...午=庚)
  it("甲일 오시(12시)의 시주는 庚午", () => {
    const p = computeHourPillar("甲", 12);
    expect(p.stem).toBe("庚");
    expect(p.branch).toBe("午");
  });
});

describe("십신(十神) 계산", () => {
  it("일간과 같은 천간은 비견", () => {
    expect(computeTenGod("甲", "甲")).toBe("비견");
  });
  it("일간과 같은 오행·다른 음양은 겁재", () => {
    expect(computeTenGod("甲", "乙")).toBe("겁재"); // 둘 다 목, 양/음
  });
  it("일간이 생하는 오행·같은 음양은 식신", () => {
    expect(computeTenGod("甲", "丙")).toBe("식신"); // 목->화, 양/양
  });
  it("일간이 극하는 오행·다른 음양은 정재", () => {
    expect(computeTenGod("甲", "己")).toBe("정재"); // 목->토, 양/음
  });
  it("일간을 극하는 오행·다른 음양은 정관", () => {
    expect(computeTenGod("甲", "辛")).toBe("정관"); // 금->목, 양/음
  });
  it("일간을 생하는 오행·다른 음양은 정인", () => {
    expect(computeTenGod("甲", "癸")).toBe("정인"); // 수->목, 양/음
  });
});

describe("computeFortuneFacts — UNKNOWN 처리", () => {
  it("출생시간 미상이면 시주/시간 십신은 null, 연/월주는 unknown", () => {
    const f = computeFortuneFacts("2021-03-15", false);
    expect(f).not.toBeNull();
    expect(f!.hour).toBeNull();
    expect(f!.hourTenGod).toBeNull();
    expect(f!.year).toBe("unknown");
    expect(f!.month).toBe("unknown");
    expect(f!.supported.dayPillar).toBe(true);
    expect(f!.supported.hourPillar).toBe(false);
  });

  it("출생시간을 알면 시주가 채워진다", () => {
    const f = computeFortuneFacts("2021-03-15", true, "12:30");
    expect(f!.hour).not.toBeNull();
    expect(f!.hourTenGod).not.toBeNull();
    expect(f!.supported.hourPillar).toBe(true);
  });

  it("잘못된 날짜는 null", () => {
    expect(computeFortuneFacts("not-a-date", false)).toBeNull();
  });
});
