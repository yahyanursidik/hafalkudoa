/**
 * Curation layer.
 *
 * Curation never touches canonical content. It only records, in a separate
 * table, how an already ACTIVE doa should be presented to a child: which
 * chapter it belongs to, who it is meant for, and how hard it is to memorise.
 * Arabic, Latin, translation, and source_reference stay exactly as imported
 * (see 06-CONTENT-INTEGRITY.md).
 */

export type CurationAudience = "KIDS" | "FAMILY" | "ADULT";

export type CuratableDua = {
  id: string;
  title: string;
  group: string | null;
  arabic: string;
  tags: string[];
};

export type CurationDecision = {
  duaId: string;
  audience: CurationAudience;
  chapter: string;
  chapterOrder: number;
  difficulty: 1 | 2 | 3;
  displayOrder: number;
  curationRule: string;
};

/** Arabic longer than this is never offered to a child as a first target. */
export const kidsArabicLengthLimit = 220;

/**
 * Chapters in the order a child meets them during the day. Each entry is a
 * keyword matched case-insensitively against the upstream group name.
 */
const chapterPath = [
  "tidur",
  "wudhu",
  "kamar mandi",
  "adzan",
  "shalat",
  "makan",
  "berpakaian",
  "rumah",
  "perjalanan",
  "majelis",
  "orang tua",
  "anak",
  "ilmu",
  "akhlak",
  "dzikir",
  "istighfar",
  "ampun",
  "memohon kebaikan",
  "surga",
  "perlindungan",
  "berlindung",
  "setan",
  "syirik",
  "kagum",
  "fenomena alam",
  "kabar",
  "sakit",
  "sedih",
  "musibah",
  "puasa",
  "ramadhan",
  "hari raya",
  "pernikahan",
  "istri",
  "harta",
  "hutang",
  "musuh",
  "zalim",
  "jenazah",
  "wafat",
];

/** Topics a child app should not lead with; kept in the catalogue for parents. */
const adultTopics = [
  "jenazah",
  "wafat",
  "kematian",
  "kubur",
  "musuh",
  "penguasa",
  "zalim",
  "kafir",
  "pernikahan",
  "istri",
  "hutang",
  "harta",
  "hisab",
];

/** Topics a child may learn, but normally alongside a parent. */
const familyTopics = [
  "puasa",
  "ramadhan",
  "haji",
  "umrah",
  "baru lahir",
  "orang sakit",
  "musibah",
  "sedih",
  "sulit",
  "kecelakaan",
];

/** Everyday topics a child can own by themselves. */
const kidsTopics = [
  "tidur",
  "makan",
  "minum",
  "berpakaian",
  "pakaian",
  "wudhu",
  "kamar mandi",
  "rumah",
  "perjalanan",
  "adzan",
  "shalat",
  "orang tua",
  "ilmu",
  "majelis",
  "kagum",
  "hari raya",
  "istighfar",
  "dzikir",
  "setan",
  "syirik",
  "akhlak",
  "surga",
  "fenomena alam",
  "kabar",
  "sakit",
  "perlindungan",
  "memohon kebaikan",
  "ampun",
  "taubat",
  "neraka",
  "adab",
  "keutamaan",
  "bersin",
  "salam",
  "marah",
  "takut",
  "syukur",
  "berbuat baik",
];

export const fallbackChapter = "Doa Harian Lainnya";

function haystack(dua: CuratableDua): string {
  return `${dua.group ?? ""} ${dua.title} ${dua.tags.join(" ")}`.toLowerCase();
}

function firstMatch(text: string, topics: readonly string[]): string | undefined {
  return topics.find((topic) => text.includes(topic));
}

export function normalizeChapter(group: string | null): string {
  const chapter = (group ?? "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
  return chapter.length > 0 ? chapter : fallbackChapter;
}

export function chapterOrder(chapter: string): number {
  const index = chapterPath.findIndex((keyword) => chapter.toLowerCase().includes(keyword));
  return index >= 0 ? index : chapterPath.length;
}

export function arabicWordCount(arabic: string): number {
  return arabic.split(/\s+/).filter((word) => word.length > 0).length;
}

export function difficultyOf(arabic: string): 1 | 2 | 3 {
  const words = arabicWordCount(arabic);
  if (words <= 8) {
    return 1;
  }
  return words <= 20 ? 2 : 3;
}

export function audienceOf(dua: CuratableDua): { audience: CurationAudience; rule: string } {
  const text = haystack(dua);

  const adultTopic = firstMatch(text, adultTopics);
  if (adultTopic) {
    return { audience: "ADULT", rule: `adult-topic:${adultTopic}` };
  }

  const familyTopic = firstMatch(text, familyTopics);
  if (familyTopic) {
    return { audience: "FAMILY", rule: `family-topic:${familyTopic}` };
  }

  if (dua.arabic.length > kidsArabicLengthLimit) {
    return { audience: "FAMILY", rule: `too-long:${dua.arabic.length}` };
  }

  const kidsTopic = firstMatch(text, kidsTopics);
  if (kidsTopic) {
    return { audience: "KIDS", rule: `kids-topic:${kidsTopic}` };
  }

  return { audience: "FAMILY", rule: "unmatched-topic" };
}

/**
 * Deterministic: the same input always produces the same plan, so a re-run
 * after an upstream sync is a reviewable diff rather than a reshuffle.
 */
export function buildCurationPlan(items: readonly CuratableDua[]): CurationDecision[] {
  const decided = items.map((dua) => {
    const { audience, rule } = audienceOf(dua);
    const chapter = normalizeChapter(dua.group);
    return {
      duaId: dua.id,
      audience,
      chapter,
      chapterOrder: chapterOrder(chapter),
      difficulty: difficultyOf(dua.arabic),
      curationRule: rule,
      title: dua.title,
    };
  });

  decided.sort((left, right) => {
    return (
      left.chapterOrder - right.chapterOrder ||
      left.chapter.localeCompare(right.chapter, "id") ||
      left.difficulty - right.difficulty ||
      left.title.localeCompare(right.title, "id")
    );
  });

  return decided.map((decision, index) => {
    const { title, ...stored } = decision;
    void title;
    return { ...stored, displayOrder: index };
  });
}

export function summarizePlan(plan: readonly CurationDecision[]): Record<CurationAudience | "chapters", number> {
  return {
    KIDS: plan.filter((entry) => entry.audience === "KIDS").length,
    FAMILY: plan.filter((entry) => entry.audience === "FAMILY").length,
    ADULT: plan.filter((entry) => entry.audience === "ADULT").length,
    chapters: new Set(plan.map((entry) => entry.chapter)).size,
  };
}
