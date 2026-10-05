import { z } from "zod";

/**
 * Learning progress for one child, kept on their own device.
 *
 * There is no account and nothing is sent anywhere: a child's practice record
 * is not content we have any business collecting. Everything here is pure, so
 * the scheduling rules can be tested without a browser.
 */

export const recallOutcomes = ["lancar", "belum"] as const;
export type RecallOutcome = (typeof recallOutcomes)[number];

export const duaStatuses = ["baru", "belajar", "hafal"] as const;
export type DuaStatus = (typeof duaStatuses)[number];

/** Days until the next review, by how many times it was recalled in a row. */
export const reviewIntervals = [1, 2, 4, 7, 15, 30] as const;

/** Recalled this many times in a row counts as memorised. */
export const masteryThreshold = 3;

const duaProgressSchema = z.object({
  duaId: z.string().min(1),
  status: z.enum(duaStatuses),
  streakOfRecalls: z.number().int().nonnegative(),
  reviews: z.number().int().nonnegative(),
  lastReviewedOn: z.string().min(8),
  dueOn: z.string().min(8),
});

export const appSettingsSchema = z.object({
  arabicSize: z.enum(["small", "medium", "large"]),
  latinVisible: z.boolean(),
  latinFirst: z.boolean(),
  latinLarge: z.boolean(),
  translationVisible: z.boolean(),
  colorGuidance: z.boolean(),
  dailyTarget: z.number().int().min(1).max(10),
});

export const progressStateSchema = z.object({
  version: z.literal(1),
  items: z.record(z.string(), duaProgressSchema),
  settings: appSettingsSchema,
  streakDays: z.number().int().nonnegative(),
  longestStreakDays: z.number().int().nonnegative(),
  lastPracticeOn: z.string().nullable(),
  sessionsByDay: z.record(z.string(), z.number().int().nonnegative()),
});

export type DuaProgress = z.infer<typeof duaProgressSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type ProgressState = z.infer<typeof progressStateSchema>;

export const defaultSettings: AppSettings = {
  arabicSize: "medium",
  latinVisible: true,
  latinFirst: false,
  latinLarge: false,
  translationVisible: false,
  colorGuidance: false,
  dailyTarget: 1,
};

export function defaultProgressState(): ProgressState {
  return {
    version: 1,
    items: {},
    settings: { ...defaultSettings },
    streakDays: 0,
    longestStreakDays: 0,
    lastPracticeOn: null,
    sessionsByDay: {},
  };
}

/** Local calendar day, because "hari ini" means the child's day, not UTC. */
export function dayKey(moment: Date): string {
  const year = moment.getFullYear();
  const month = `${moment.getMonth() + 1}`.padStart(2, "0");
  const day = `${moment.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const moment = new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
  moment.setDate(moment.getDate() + days);
  return dayKey(moment);
}

export function daysBetween(from: string, to: string): number {
  const parse = (day: string): number => {
    const [year, month, date] = day.split("-").map(Number);
    return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1).getTime();
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

export function intervalFor(streakOfRecalls: number): number {
  const index = Math.min(Math.max(streakOfRecalls - 1, 0), reviewIntervals.length - 1);
  return reviewIntervals[index] ?? 1;
}

export function statusFor(streakOfRecalls: number): DuaStatus {
  if (streakOfRecalls >= masteryThreshold) {
    return "hafal";
  }
  return streakOfRecalls > 0 ? "belajar" : "baru";
}

export function progressFor(state: ProgressState, duaId: string): DuaProgress | undefined {
  return state.items[duaId];
}

export function statusOf(state: ProgressState, duaId: string): DuaStatus {
  return state.items[duaId]?.status ?? "baru";
}

function nextStreak(state: ProgressState, today: string): { streakDays: number; longestStreakDays: number } {
  if (state.lastPracticeOn === today) {
    return { streakDays: state.streakDays, longestStreakDays: state.longestStreakDays };
  }
  const continued = state.lastPracticeOn !== null && daysBetween(state.lastPracticeOn, today) === 1;
  const streakDays = continued ? state.streakDays + 1 : 1;
  return { streakDays, longestStreakDays: Math.max(streakDays, state.longestStreakDays) };
}

/**
 * One finished practice round. "belum" is never a penalty: it just brings the
 * doa back tomorrow, so a child who forgets simply meets it again sooner.
 */
export function recordReview(
  state: ProgressState,
  duaId: string,
  outcome: RecallOutcome,
  now: Date = new Date(),
): ProgressState {
  const today = dayKey(now);
  const existing = state.items[duaId];
  const streakOfRecalls = outcome === "lancar" ? (existing?.streakOfRecalls ?? 0) + 1 : 0;

  const item: DuaProgress = {
    duaId,
    status: statusFor(streakOfRecalls),
    streakOfRecalls,
    reviews: (existing?.reviews ?? 0) + 1,
    lastReviewedOn: today,
    dueOn: addDays(today, outcome === "lancar" ? intervalFor(streakOfRecalls) : 1),
  };

  return {
    ...state,
    items: { ...state.items, [duaId]: item },
    ...nextStreak(state, today),
    lastPracticeOn: today,
    sessionsByDay: { ...state.sessionsByDay, [today]: (state.sessionsByDay[today] ?? 0) + 1 },
  };
}

export function sessionsOn(state: ProgressState, now: Date = new Date()): number {
  return state.sessionsByDay[dayKey(now)] ?? 0;
}

export function dailyTargetMet(state: ProgressState, now: Date = new Date()): boolean {
  return sessionsOn(state, now) >= state.settings.dailyTarget;
}

/** Doa whose review day has arrived, soonest first. */
export function dueDuaIds(state: ProgressState, now: Date = new Date()): string[] {
  const today = dayKey(now);
  return Object.values(state.items)
    .filter((item) => daysBetween(item.dueOn, today) >= 0)
    .sort((left, right) => left.dueOn.localeCompare(right.dueOn) || left.duaId.localeCompare(right.duaId))
    .map((item) => item.duaId);
}

export function startedDuaIds(state: ProgressState): string[] {
  return Object.values(state.items)
    .sort((left, right) => right.lastReviewedOn.localeCompare(left.lastReviewedOn))
    .map((item) => item.duaId);
}

export type ProgressSummary = {
  readonly started: number;
  readonly memorised: number;
  readonly learning: number;
  readonly dueToday: number;
};

export function summarize(state: ProgressState, now: Date = new Date()): ProgressSummary {
  const items = Object.values(state.items);
  return {
    started: items.length,
    memorised: items.filter((item) => item.status === "hafal").length,
    learning: items.filter((item) => item.status === "belajar").length,
    dueToday: dueDuaIds(state, now).length,
  };
}

export function updateSettings(state: ProgressState, patch: Partial<AppSettings>): ProgressState {
  return { ...state, settings: { ...state.settings, ...patch } };
}

export function forgetDua(state: ProgressState, duaId: string): ProgressState {
  const { [duaId]: _removed, ...items } = state.items;
  void _removed;
  return { ...state, items };
}

export const progressStorageKey = "hafalku.progress.v1";

/**
 * Storage can be unavailable or hold something older or corrupted. None of
 * that should ever block a child from opening a doa, so every failure falls
 * back to a clean state instead of throwing.
 */
export function readProgress(storage: Pick<Storage, "getItem"> | undefined): ProgressState {
  try {
    const raw = storage?.getItem(progressStorageKey);
    if (!raw) {
      return defaultProgressState();
    }
    const parsed = progressStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return defaultProgressState();
    }
    return { ...parsed.data, settings: { ...defaultSettings, ...parsed.data.settings } };
  } catch {
    return defaultProgressState();
  }
}

export function writeProgress(storage: Pick<Storage, "setItem"> | undefined, state: ProgressState): boolean {
  try {
    storage?.setItem(progressStorageKey, JSON.stringify(state));
    return storage !== undefined;
  } catch {
    return false;
  }
}

const indonesianMonths = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "Besok" reads better to a child than a date, but a far-off day needs one. */
export function describeDay(day: string, today: string): string {
  const distance = daysBetween(today, day);
  if (distance <= 0) {
    return "Hari ini";
  }
  if (distance === 1) {
    return "Besok";
  }
  if (distance === 2) {
    return "Lusa";
  }
  if (distance <= 6) {
    return `${distance} hari lagi`;
  }
  const [, month, date] = day.split("-").map(Number);
  return `${date ?? 1} ${indonesianMonths[(month ?? 1) - 1] ?? ""}`.trim();
}
