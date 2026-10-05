import { describe, expect, it } from "vitest";

import { defaultProgressState, recordReview, updateSettings } from "./progress.js";
import { copyForPlan, planForToday, remainingToday } from "./today.js";

const monday = new Date(2026, 9, 5, 9, 0, 0);
const tuesday = new Date(2026, 9, 6, 9, 0, 0);
const candidates = ["a", "b", "c"];

describe("today's single suggestion", () => {
  it("starts a child on the first doa of the path", () => {
    const plan = planForToday(defaultProgressState(), candidates, monday);
    expect(plan).toEqual({ kind: "mulai", duaId: "a" });
    expect(copyForPlan(plan).action).toBe("Mulai doa pertama");
  });

  it("offers the next untouched doa once something is under way", () => {
    const state = recordReview(defaultProgressState(), "a", "lancar", monday);
    expect(planForToday(state, candidates, monday)).toEqual({ kind: "lanjut", duaId: "b" });
  });

  it("puts a review ahead of new material once it is due", () => {
    const state = recordReview(defaultProgressState(), "a", "lancar", monday);
    expect(planForToday(state, candidates, tuesday)).toEqual({ kind: "ulangi", duaId: "a", dueCount: 1 });
  });

  it("ignores doa that are not in the offered path", () => {
    const state = recordReview(defaultProgressState(), "zz", "lancar", monday);
    expect(planForToday(state, candidates, tuesday)).toEqual({ kind: "lanjut", duaId: "a" });
  });

  it("says so when the whole path has been covered", () => {
    let state = defaultProgressState();
    candidates.forEach((id) => {
      state = recordReview(state, id, "lancar", monday);
    });
    expect(planForToday(state, candidates, monday)).toEqual({ kind: "selesai" });
  });

  it("counts how many rounds are still left against the daily target", () => {
    const state = updateSettings(recordReview(defaultProgressState(), "a", "lancar", monday), { dailyTarget: 3 });
    expect(remainingToday(state, monday)).toBe(2);
    expect(remainingToday(state, tuesday)).toBe(3);
  });

  it("writes the review count in words a child hears", () => {
    expect(copyForPlan({ kind: "ulangi", duaId: "a", dueCount: 1 }).headline).toBe("Ada 1 doa untuk diulang.");
    expect(copyForPlan({ kind: "ulangi", duaId: "a", dueCount: 4 }).headline).toBe("Ada 4 doa untuk diulang.");
  });
});
