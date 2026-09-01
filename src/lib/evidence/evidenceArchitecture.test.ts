import { describe, expect, it } from "vitest";
import { buildFoodEvidence } from "../questionnaire/foodQuestions";
import { buildSleepEvidence } from "../questionnaire/sleepQuestions";
import { generalBehaviorEvidence, concernMicroEvidence } from "@/lib/evidence/builders";
import { childEvidenceRef } from "@/lib/evidence/ref";

describe("Concern-specific Evidence architecture", () => {
  it("general evidence — domain + patternId + source.general + strength", () => {
    const ev = generalBehaviorEvidence({
      domain: "transition",
      axis: "transition_preference",
      patternId: "prefers_completion_before_transition",
      observedLabel: "test",
      questionIds: ["q4"],
    });
    expect(ev.source.scope).toBe("general");
    expect(ev.strength).toBe("medium");
    expect(ev.axis).toBe("transition_preference");
    expect(childEvidenceRef(ev)).toBe("child:transition_prefers_completion_before_transition");
  });

  it("food micro evidence — concern_micro source + food domain", () => {
    const evs = buildFoodEvidence({
      new_food_reaction: "inspect_smell_shape",
      preference_balance: "favorite_only_first",
      prompt_response: "stronger_refusal_on_prompt",
      meal_flow_block: "put_down_spoon_divert",
    });
    expect(evs.length).toBe(4);
    for (const ev of evs) {
      expect(ev.source.scope).toBe("concern_micro");
      if (ev.source.scope === "concern_micro") {
        expect(ev.source.concernId).toBe("meal");
      }
      expect(ev.domain.startsWith("food_")).toBe(true);
    }
    expect(childEvidenceRef(evs[0]!)).toBe("child:food_new_food_new_food_hesitation");
  });

  it("sleep micro evidence — concern_micro source + sleep domain", () => {
    const evs = buildSleepEvidence({
      bedtime_transition: "sleep_transition_needs_completion",
      routine_order: "sleep_routine_prefers_familiar_sequence",
      lights_off_departure: "sleep_separation_requests_presence",
      pre_sleep: "sleep_prebed_continues_activity",
    });
    expect(evs.length).toBe(4);
    for (const ev of evs) {
      expect(ev.source.scope).toBe("concern_micro");
      if (ev.source.scope === "concern_micro") {
        expect(ev.source.concernId).toBe("sleep");
      }
      expect(ev.domain.startsWith("sleep_")).toBe(true);
    }
    expect(childEvidenceRef(evs[0]!)).toBe(
      "child:sleep_bedtime_sleep_transition_needs_completion"
    );
  });

  it("future concern slot — same builder contract", () => {
    const future = concernMicroEvidence({
      domain: "food_new_food",
      concernId: "meal",
      patternId: "placeholder_pattern",
      observedLabel: "placeholder",
      questionIds: ["future_q1"],
    });
    expect(future.source.scope).toBe("concern_micro");
    expect(future.patternId).toBe("placeholder_pattern");
  });
});
