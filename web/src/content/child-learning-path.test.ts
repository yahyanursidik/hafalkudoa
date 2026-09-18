import { describe, expect, it } from "vitest";
import { childLearningPath, childLearningStepCount, hasUniqueChildLearningSteps } from "./child-learning-path.js";

describe("childLearningPath", () => {
  it("starts with daily habits and retains a short, intentional first stage", () => {
    expect(childLearningPath[0]?.id).toBe("mulai-sehari-hari");
    expect(childLearningPath[0]?.steps.map((step) => step.externalId)).toEqual(["135", "9", "129", "95"]);
  });

  it("does not duplicate source-backed doa across stages", () => {
    expect(hasUniqueChildLearningSteps()).toBe(true);
    expect(childLearningStepCount()).toBe(12);
  });
});
