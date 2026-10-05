import { describe, expect, it } from "vitest";

import {
  addDays,
  dailyTargetMet,
  dayKey,
  daysBetween,
  defaultProgressState,
  describeDay,
  dueDuaIds,
  forgetDua,
  intervalFor,
  masteryThreshold,
  progressStorageKey,
  readProgress,
  recordReview,
  sessionsOn,
  statusOf,
  summarize,
  updateSettings,
  writeProgress,
  type ProgressState,
} from "./progress.js";

const monday = new Date(2026, 9, 5, 9, 0, 0);
const tuesday = new Date(2026, 9, 6, 9, 0, 0);
const thursday = new Date(2026, 9, 8, 9, 0, 0);

function practise(state: ProgressState, times: number, duaId = "dua-1"): ProgressState {
  let current = state;
  for (let index = 0; index < times; index += 1) {
    current = recordReview(current, duaId, "lancar", new Date(2026, 9, 5 + index, 9, 0, 0));
  }
  return current;
}

describe("day arithmetic", () => {
  it("uses the child's local day, not UTC", () => {
    expect(dayKey(new Date(2026, 0, 1, 23, 30))).toBe("2026-01-01");
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
  });
});

describe("review scheduling", () => {
  it("spaces a doa further out each time it is recalled", () => {
    expect(intervalFor(1)).toBe(1);
    expect(intervalFor(2)).toBe(2);
    expect(intervalFor(3)).toBe(4);
    expect(intervalFor(99)).toBe(30);
  });

  it("counts a doa as memorised after three recalls in a row", () => {
    const state = practise(defaultProgressState(), masteryThreshold);
    expect(statusOf(state, "dua-1")).toBe("hafal");
    expect(summarize(state, thursday).memorised).toBe(1);
  });

  it("brings a forgotten doa back tomorrow without erasing the practice", () => {
    const learned = practise(defaultProgressState(), 3);
    const forgotten = recordReview(learned, "dua-1", "belum", monday);

    expect(statusOf(forgotten, "dua-1")).toBe("baru");
    expect(forgotten.items["dua-1"]?.dueOn).toBe(addDays(dayKey(monday), 1));
    expect(forgotten.items["dua-1"]?.reviews).toBe(4);
  });

  it("lists only doa whose review day has arrived", () => {
    const state = recordReview(defaultProgressState(), "dua-1", "lancar", monday);
    expect(dueDuaIds(state, monday)).toEqual([]);
    expect(dueDuaIds(state, tuesday)).toEqual(["dua-1"]);
  });
});

describe("daily rhythm", () => {
  it("counts sessions per day against the target", () => {
    const state = recordReview(defaultProgressState(), "dua-1", "lancar", monday);
    expect(sessionsOn(state, monday)).toBe(1);
    expect(dailyTargetMet(state, monday)).toBe(true);
    expect(dailyTargetMet(updateSettings(state, { dailyTarget: 2 }), monday)).toBe(false);
  });

  it("grows the streak on consecutive days and restarts after a gap", () => {
    const twoDays = recordReview(recordReview(defaultProgressState(), "a", "lancar", monday), "b", "lancar", tuesday);
    expect(twoDays.streakDays).toBe(2);

    const afterGap = recordReview(twoDays, "c", "lancar", thursday);
    expect(afterGap.streakDays).toBe(1);
    expect(afterGap.longestStreakDays).toBe(2);
  });

  it("does not inflate the streak when practising twice in one day", () => {
    const state = recordReview(recordReview(defaultProgressState(), "a", "lancar", monday), "b", "lancar", monday);
    expect(state.streakDays).toBe(1);
    expect(sessionsOn(state, monday)).toBe(2);
  });
});

describe("storage", () => {
  function memoryStorage(initial?: string) {
    let value = initial;
    return {
      getItem: () => value ?? null,
      setItem: (_key: string, next: string) => {
        value = next;
      },
      read: () => value,
    };
  }

  it("round-trips a state", () => {
    const storage = memoryStorage();
    const state = practise(defaultProgressState(), 2);
    expect(writeProgress(storage, state)).toBe(true);
    expect(readProgress(storage)).toEqual(state);
  });

  it("starts clean rather than throwing on damaged or foreign data", () => {
    expect(readProgress(memoryStorage("not json"))).toEqual(defaultProgressState());
    expect(readProgress(memoryStorage(JSON.stringify({ version: 99 })))).toEqual(defaultProgressState());
    expect(readProgress(undefined)).toEqual(defaultProgressState());
  });

  it("survives storage that refuses to read or write", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readProgress(blocked)).toEqual(defaultProgressState());
    expect(writeProgress(blocked, defaultProgressState())).toBe(false);
  });

  it("keeps one key, so clearing it removes everything we stored", () => {
    expect(progressStorageKey).toBe("hafalku.progress.v1");
  });
});

describe("removing a doa", () => {
  it("forgets just that doa", () => {
    const state = recordReview(practise(defaultProgressState(), 2), "dua-2", "lancar", monday);
    const pruned = forgetDua(state, "dua-1");
    expect(Object.keys(pruned.items)).toEqual(["dua-2"]);
  });
});

describe("day labels a child hears", () => {
  it("uses words for the near days and a date for the far ones", () => {
    expect(describeDay("2026-10-05", "2026-10-05")).toBe("Hari ini");
    expect(describeDay("2026-10-04", "2026-10-05")).toBe("Hari ini");
    expect(describeDay("2026-10-06", "2026-10-05")).toBe("Besok");
    expect(describeDay("2026-10-07", "2026-10-05")).toBe("Lusa");
    expect(describeDay("2026-10-10", "2026-10-05")).toBe("5 hari lagi");
    expect(describeDay("2026-11-04", "2026-10-05")).toBe("4 November");
  });
});
