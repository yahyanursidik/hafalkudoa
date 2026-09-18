export type ChildLearningStep = {
  readonly externalId: string;
  readonly cue: string;
};

export type ChildLearningStage = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly steps: readonly ChildLearningStep[];
};

/**
 * Editorial learning order only. Canonical religious content, translation,
 * and source remain in the active upstream-backed doa item.
 */
export const childLearningPath: readonly ChildLearningStage[] = [
  {
    id: "mulai-sehari-hari",
    title: "Mulai dari yang dekat",
    description: "Doa pendek untuk kebiasaan yang anak temui hampir setiap hari.",
    steps: [
      { externalId: "135", cue: "Sebelum makan" },
      { externalId: "9", cue: "Keluar kamar mandi" },
      { externalId: "129", cue: "Masuk rumah" },
      { externalId: "95", cue: "Sebelum belajar" },
    ],
  },
  {
    id: "rutinitas-diri",
    title: "Rutinitas diri",
    description: "Setelah tahap pertama terasa lancar, lanjutkan dengan doa pagi, kebersihan, dan keluarga.",
    steps: [
      { externalId: "6", cue: "Bangun tidur" },
      { externalId: "10", cue: "Sebelum wudhu" },
      { externalId: "128", cue: "Keluar rumah" },
      { externalId: "68", cue: "Untuk orang tua" },
    ],
  },
  {
    id: "situasi-khusus",
    title: "Saat ada keadaan khusus",
    description: "Pilih setelah kebiasaan utama telah sering diulang bersama pendamping.",
    steps: [
      { externalId: "136", cue: "Lupa sebelum makan" },
      { externalId: "189", cue: "Saat bersin" },
      { externalId: "197", cue: "Saat marah" },
      { externalId: "48", cue: "Naik kendaraan" },
    ],
  },
];

export function childLearningStepCount(path: readonly ChildLearningStage[] = childLearningPath): number {
  return path.reduce((count, stage) => count + stage.steps.length, 0);
}

export function hasUniqueChildLearningSteps(path: readonly ChildLearningStage[] = childLearningPath): boolean {
  const externalIds = path.flatMap((stage) => stage.steps.map((step) => step.externalId));
  return new Set(externalIds).size === externalIds.length;
}
