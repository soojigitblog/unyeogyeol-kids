import fs from "fs";
import path from "path";

const files = [
  "src/lib/interaction/fixtures.ts",
  "src/lib/interaction/fixturesP20.ts",
  "src/lib/interaction/sweep30.test.ts",
  "src/lib/interaction/p20Evidence.test.ts",
  "src/lib/interaction/interaction.test.ts",
];

for (const rel of files) {
  const file = path.resolve(rel);
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(/\bobservedPattern:/g, "patternId:");
  text = text.replace(
    /confidence: "medium",\s*\n\s*sourceQuestionIds: (\[[^\]]+\]),/g,
    'strength: "medium",\n        source: { scope: "general", questionIds: $1 },'
  );
  text = text.replace(
    /confidence: "medium" as const,\s*\n\s*sourceQuestionIds: (\[[^\]]+\]),/g,
    'strength: "medium",\n        source: { scope: "general", questionIds: $1 },'
  );
  fs.writeFileSync(file, text, "utf8");
  console.log("migrated", rel);
}
