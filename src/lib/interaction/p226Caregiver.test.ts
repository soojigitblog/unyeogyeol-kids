// P2.2V.6 CAREGIVER RELATIONSHIP GENERALIZATION — 영구 회귀 테스트
//
// 목적: "엄마 × 아이" 고정 구조가 "우리 아이 × 나"로 일반화되었는지 검증한다.
// 핵심: 선택한 관계(아빠/할머니/이모/큰이모)가 리포트 전체에 일관되게 반영되고,
//       고객 문장에 다른 관계 호칭이 섞이지 않아야 한다.

import { describe, expect, it } from "vitest";
import { FAMILY_FIXTURES } from "./fixtures";
import { generateSignatureReport } from "./signatureReportGenerator";
import { buildMomEvidence } from "../questionnaire/momEvidence";
import { buildBehaviorEvidence } from "../questionnaire/evidence";
import {
  CAREGIVER_ROLE_OPTIONS,
  applyCaregiverLabel,
  migrateLegacyMomProfile,
  resolveDisplayName,
  resolveRoleLabel,
  subj,
  topic,
} from "@/lib/caregiver";
import type {
  CaregiverProfile,
  ChildProfile,
  CurrentConflictInput,
} from "../types";

const childProfile: ChildProfile = {
  name: "열무",
  birthDate: "2024-04-15",
  birthTimeKnown: true,
  birthTime: "09:30",
  gender: "boy",
};

const childAnswers = {
  new_environment: 2 as const,
  transition: 1 as const,
  self_assertion: 4 as const,
};

const momAnswers = {
  time_pressure_style: "opt_time_control",
  emotion_coping_style: "opt_emo_explain",
  instruction_resistance_style: "opt_inst_firm",
};

const conflictInput: CurrentConflictInput = {
  concernId: "meal",
  scenarioId: "sc_meal_new_food_reject",
  childFirstReaction: "처음 보는 반찬을 보자마자 입을 닫고 밀어냄",
  momFirstReaction: "영양 생각에 '한 입만 먹어보자' 하고 숟가락을 건넴",
  subsequentEscalation: "아이가 고개를 돌리며 숟가락을 밀침",
  recentFrequency: "daily",
  momTypicalPhrase: "한 입만 먹어보자, 진짜 맛있어",
};

function buildReport(caregiver: CaregiverProfile) {
  return generateSignatureReport(
    childProfile,
    buildBehaviorEvidence(childAnswers),
    buildMomEvidence(momAnswers),
    conflictInput,
    null,
    caregiver
  );
}

const FATHER: CaregiverProfile = {
  role: "father",
  roleLabel: "아빠",
  birthDate: "1990-03-11",
  birthTimeKnown: false,
};

const GRANDMOTHER: CaregiverProfile = {
  role: "paternal_grandmother",
  roleLabel: "할머니",
  birthDate: "1961-06-02",
  birthTimeKnown: false,
};

const AUNT: CaregiverProfile = {
  role: "aunt",
  roleLabel: "이모",
  birthDate: "1994-01-20",
  birthTimeKnown: false,
};

const CUSTOM_AUNT: CaregiverProfile = {
  role: "other",
  roleLabel: "큰이모",
  birthDate: "1988-12-05",
  birthTimeKnown: false,
};

describe("P2.2V.6 보호자/가족 관계 일반화", () => {
  it("TEST 1: 관계 정보(caregiverRole)가 리포트 meta 에 필수로 실린다", () => {
    const report = buildReport(FATHER);
    expect(report.meta.caregiverRole).toBe("father");
    expect(report.meta.caregiverRoleLabel).toBe("아빠");
  });

  it("TEST 2: 기타 관계 선택지는 직접 입력한 관계명을 요구하고, '기타'는 고객에게 노출되지 않는다", () => {
    const customOptions = CAREGIVER_ROLE_OPTIONS.filter((o) => o.requiresCustomLabel);
    expect(customOptions.length).toBeGreaterThan(0);

    // 관계명을 입력하지 않으면 "기타"가 그대로 노출되지 않고 중립 표현으로 대체된다.
    expect(resolveRoleLabel({ roleLabel: "기타 가족" })).toBe("보호자");
    expect(resolveRoleLabel({ roleLabel: "기타 보호자" })).toBe("보호자");

    const report = buildReport(CUSTOM_AUNT);
    expect(JSON.stringify(report)).not.toContain("기타");
  });

  it("TEST 3: 아빠 케이스 — 고객 문장에 '엄마' 노출 0건", () => {
    const report = buildReport(FATHER);
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("엄마");
    expect(serialized).toContain("아빠");
  });

  it("TEST 4: 할머니 케이스 — '엄마/아빠' 호칭 오염 0건", () => {
    const report = buildReport(GRANDMOTHER);
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("엄마");
    expect(serialized).not.toContain("아빠");
    expect(serialized).toContain("할머니");
  });

  it("TEST 5: 직접 입력한 관계명(큰이모)이 리포트 전체에 유지된다", () => {
    const report = buildReport(CUSTOM_AUNT);
    const serialized = JSON.stringify(report);
    expect(report.meta.caregiverRoleLabel).toBe("큰이모");
    expect(serialized).toContain("큰이모");
    expect(serialized).not.toContain("엄마");
    // 관계 흐름(Conflict Chain)의 행위자도 관계명으로 표시된다.
    const actors = report.chapter04_conflictChain.steps.map((s) => s.actor);
    expect(actors).toContain("큰이모");
    expect(actors).not.toContain("엄마");
  });

  it("TEST 6: Caregiver Evidence 가 Mom 고정 타입 없이 정상 생성된다", () => {
    const report = buildReport(AUNT);
    expect(report.twoPersonSummary).toBeDefined();
    expect(report.twoPersonSummary!.momKeywords.length).toBeGreaterThan(0);
    expect(report.chapter03_interactionPattern.momReactionAspect).toBeTruthy();
    expect(report.chapter03_interactionPattern.evidenceRefs.length).toBeGreaterThan(0);
    expect(JSON.stringify(report)).not.toContain("엄마");
  });

  it("TEST 7: Caregiver 출생정보가 관계 힌트 레이어에 정상 연결된다", () => {
    const report = buildReport(GRANDMOTHER);
    expect(report.fortuneRelationship).toBeDefined();
    expect(report.fortuneRelationship!.momHints[0]).toContain("할머니");
    expect(report.fortuneRelationship!.evidenceType).toBe("REFLECTIVE");
    // 사주 궁합 점수/등급 표현 금지 (관계가 무엇이든 동일)
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("궁합");
    expect(serialized).not.toContain("찰떡");
    // 부모 전제 문구 금지
    expect(serialized).not.toContain("부모로서");
    expect(serialized).not.toContain("엄마 역할");
    expect(serialized).not.toContain("부모 대신");
  });

  it("TEST 8: 레거시 momProfile 세션이 mother caregiver 로 마이그레이션된다", () => {
    const migrated = migrateLegacyMomProfile({
      name: "열무맘",
      birthDate: "1991-08-20",
      birthTimeKnown: false,
    });
    expect(migrated).not.toBeNull();
    expect(migrated!.role).toBe("mother");
    expect(migrated!.roleLabel).toBe("엄마");
    expect(migrated!.displayName).toBe("열무맘");
    expect(migrateLegacyMomProfile({ name: "이름만" })).toBeNull();
  });

  it("TEST 9: QA Fixture 5종이 서로 다른 관계로 구성되고 fixture 이름이 새지 않는다", () => {
    const roleLabels = FAMILY_FIXTURES.map((f) => f.caregiverProfile.roleLabel);
    expect(new Set(roleLabels).size).toBeGreaterThanOrEqual(4);

    FAMILY_FIXTURES.forEach((fixture) => {
      const report = generateSignatureReport(
        fixture.childProfile,
        fixture.childEvidences,
        buildMomEvidence(fixture.momAnswers),
        fixture.conflictInput,
        fixture.fortuneFacts,
        fixture.caregiverProfile
      );
      const serialized = JSON.stringify(report);
      const label = fixture.caregiverProfile.roleLabel;

      // 선택한 관계가 아니면서 다른 가족 호칭이 섞이지 않아야 한다.
      ["엄마", "아빠", "할머니", "이모", "삼촌"]
        .filter((other) => other !== label)
        .forEach((other) => {
          expect(serialized).not.toContain(other);
        });

      // 다른 fixture 아이 이름 leakage 0
      FAMILY_FIXTURES.filter((f) => f.fixtureId !== fixture.fixtureId).forEach((o) => {
        expect(serialized).not.toContain(o.childProfile.name!);
      });
    });
  });

  it("TEST 10: 한국어 조사 처리 — 받침 유무에 따라 자연스럽게 출력된다", () => {
    expect(subj("아빠")).toBe("아빠가");
    expect(subj("삼촌")).toBe("삼촌이");
    expect(topic("할머니")).toBe("할머니는");
    expect(topic("삼촌")).toBe("삼촌은");

    // 리포트 문장에서도 "아빠이" / "삼촌가" 같은 깨진 조사가 없어야 한다.
    const broken = ["아빠이", "할머니가는", "이모이", "삼촌가", "큰이모이"];
    [FATHER, GRANDMOTHER, AUNT, CUSTOM_AUNT].forEach((caregiver) => {
      const serialized = JSON.stringify(buildReport(caregiver));
      broken.forEach((b) => expect(serialized).not.toContain(b));
    });
  });

  it("관계 토큰 렌더러는 중첩 객체/배열까지 모두 치환한다", () => {
    const input = {
      title: "{{CG의}} 반응",
      list: ["{{CG는}} 기다립니다", { deep: "{{CG가}} 이야기합니다" }],
    };
    const out = applyCaregiverLabel(input, "삼촌");
    expect(out.title).toBe("삼촌의 반응");
    expect(out.list[0]).toBe("삼촌은 기다립니다");
    expect((out.list[1] as { deep: string }).deep).toBe("삼촌이 이야기합니다");
    expect(JSON.stringify(out)).not.toContain("{{CG");
  });

  it("애칭을 입력하면 서술 문장에서 애칭을, 배지에서는 관계명을 사용한다", () => {
    const withNickname: CaregiverProfile = { ...FATHER, displayName: "열무아빠" };
    expect(resolveDisplayName(withNickname)).toBe("열무아빠");
    expect(resolveRoleLabel(withNickname)).toBe("아빠");

    const report = buildReport(withNickname);
    expect(report.meta.momName).toBe("열무아빠");
    expect(report.meta.caregiverRoleLabel).toBe("아빠");
  });
});
