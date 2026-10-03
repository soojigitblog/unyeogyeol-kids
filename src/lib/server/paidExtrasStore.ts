import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  ConflictMapSection,
  GrowthContentSection,
  GuidesSection,
  TalentSeedsSection,
  TalkingPointsSection,
} from "@/lib/types";

export interface PaidExtras {
  talkingPoints: TalkingPointsSection;
  conflictMap: ConflictMapSection;
  talentSeeds: TalentSeedsSection;
  growthContent: GrowthContentSection;
  guides: GuidesSection;
}

/**
 * report_payload_json은 절대 건드리지 않는다(불변 스냅샷 원칙, p24Snapshot.test.ts §5).
 * 새 콘텐츠는 이 별도 테이블에 insert 하고, 읽을 때 payload 위에 얹어서 응답한다.
 *
 * P3.5: talent_seeds_json / growth_content_json / guides_json 3개 컬럼 추가
 * (마이그레이션 20260919000000_p35_paid_extras_phase2.sql).
 */
export async function insertPaidExtras(reportId: string, extras: PaidExtras): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("paid_extras").insert({
    report_id: reportId,
    talking_points_json: extras.talkingPoints,
    conflict_map_json: extras.conflictMap,
    talent_seeds_json: extras.talentSeeds,
    growth_content_json: extras.growthContent,
    guides_json: extras.guides,
    generation_source: extras.talkingPoints.generationSource,
  });
  if (error) throw error;
}

export async function getPaidExtrasByReportId(reportId: string): Promise<PaidExtras | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("paid_extras")
    .select(
      "talking_points_json, conflict_map_json, talent_seeds_json, growth_content_json, guides_json"
    )
    .eq("report_id", reportId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    talkingPoints: data.talking_points_json as TalkingPointsSection,
    conflictMap: data.conflict_map_json as ConflictMapSection,
    talentSeeds: data.talent_seeds_json as TalentSeedsSection,
    growthContent: data.growth_content_json as GrowthContentSection,
    guides: data.guides_json as GuidesSection,
  };
}
