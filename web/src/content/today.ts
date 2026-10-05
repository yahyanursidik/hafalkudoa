import { dueDuaIds, sessionsOn, type ProgressState } from "./progress.js";

/**
 * What to offer when the app opens.
 *
 * One suggestion, never a list of competing calls to action: a child should
 * see a single next thing, and a parent should be able to say "ayo, yang ini".
 */
export type TodayPlan =
  | { readonly kind: "ulangi"; readonly duaId: string; readonly dueCount: number }
  | { readonly kind: "mulai"; readonly duaId: string }
  | { readonly kind: "lanjut"; readonly duaId: string }
  | { readonly kind: "selesai" };

export function planForToday(
  progress: ProgressState,
  candidateIds: readonly string[],
  now: Date = new Date(),
): TodayPlan {
  const candidates = new Set(candidateIds);
  const due = dueDuaIds(progress, now).filter((id) => candidates.has(id));

  if (due.length > 0 && due[0]) {
    return { kind: "ulangi", duaId: due[0], dueCount: due.length };
  }

  const untouched = candidateIds.find((id) => progress.items[id] === undefined);
  if (untouched) {
    return Object.keys(progress.items).length === 0
      ? { kind: "mulai", duaId: untouched }
      : { kind: "lanjut", duaId: untouched };
  }

  return { kind: "selesai" };
}

export type TodayCopy = {
  readonly kicker: string;
  readonly headline: string;
  readonly action: string;
};

export function copyForPlan(plan: TodayPlan): TodayCopy {
  if (plan.kind === "ulangi") {
    return {
      kicker: "Waktunya mengulang",
      headline: plan.dueCount === 1 ? "Ada 1 doa untuk diulang." : `Ada ${plan.dueCount} doa untuk diulang.`,
      action: "Ulangi sekarang",
    };
  }

  if (plan.kind === "mulai") {
    return { kicker: "Mulai hari ini", headline: "Satu doa untuk dihafal.", action: "Mulai doa pertama" };
  }

  if (plan.kind === "lanjut") {
    return { kicker: "Lanjutkan", headline: "Siap menambah satu doa baru.", action: "Belajar doa berikutnya" };
  }

  return { kicker: "Selesai", headline: "Semua doa di jalur ini sudah dijalani.", action: "Lihat semua doa" };
}

export function remainingToday(progress: ProgressState, now: Date = new Date()): number {
  return Math.max(0, progress.settings.dailyTarget - sessionsOn(progress, now));
}
