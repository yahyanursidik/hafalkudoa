/**
 * Memorisation chunks.
 *
 * A chunk is a pair of offsets into the canonical Arabic string plus the Latin
 * words that line up with it. The Arabic text itself is never rewritten,
 * re-spaced, or re-pointed: the UI slices the stored string with these offsets
 * (see 06-CONTENT-INTEGRITY.md, "UI chunks tidak boleh mengubah canonical Arabic").
 */

export type DuaChunk = {
  sequence: number;
  arabicStart: number;
  arabicEnd: number;
  latinSegment: string;
  visualGroup: number;
};

export const defaultWordsPerChunk = 4;
export const visualGroupCount = 5;

type Token = { start: number; end: number };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\S+/gu;
  let match = pattern.exec(text);
  while (match !== null) {
    tokens.push({ start: match.index, end: match.index + match[0].length });
    match = pattern.exec(text);
  }
  return tokens;
}

function groupSizes(tokenCount: number, wordsPerChunk: number): number[] {
  if (tokenCount === 0) {
    return [];
  }

  const sizes: number[] = [];
  for (let taken = 0; taken < tokenCount; taken += wordsPerChunk) {
    sizes.push(Math.min(wordsPerChunk, tokenCount - taken));
  }

  // A trailing single word is hard to recite on its own; fold it back.
  const last = sizes.length - 1;
  if (sizes.length > 1 && (sizes[last] ?? 0) === 1) {
    sizes[last - 1] = (sizes[last - 1] ?? 0) + 1;
    sizes.pop();
  }

  return sizes;
}

export function buildChunks(arabic: string, latin: string, wordsPerChunk = defaultWordsPerChunk): DuaChunk[] {
  if (wordsPerChunk < 1) {
    throw new Error("wordsPerChunk must be at least 1");
  }

  const arabicTokens = tokenize(arabic);
  const sizes = groupSizes(arabicTokens.length, wordsPerChunk);
  if (sizes.length === 0) {
    return [];
  }

  const latinWords = latin.split(/\s+/u).filter((word) => word.length > 0);
  const chunks: DuaChunk[] = [];
  let tokenCursor = 0;
  let consumedTokens = 0;

  sizes.forEach((size, index) => {
    const first = arabicTokens[tokenCursor];
    const last = arabicTokens[tokenCursor + size - 1];
    tokenCursor += size;

    const latinStart = Math.round((consumedTokens / arabicTokens.length) * latinWords.length);
    consumedTokens += size;
    const latinEnd = Math.round((consumedTokens / arabicTokens.length) * latinWords.length);

    chunks.push({
      sequence: index,
      arabicStart: first?.start ?? 0,
      arabicEnd: last?.end ?? 0,
      latinSegment: latinWords.slice(latinStart, latinEnd).join(" "),
      visualGroup: (index % visualGroupCount) + 1,
    });
  });

  return chunks;
}
