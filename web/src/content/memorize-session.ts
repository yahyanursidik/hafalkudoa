/**
 * One memorisation round, as a small state machine.
 *
 * The flow mirrors how a child is taught at home: read it together, then add
 * one piece at a time, then try it from memory with help one tap away. Nothing
 * here touches the Arabic text — stages only decide how much of it is shown.
 */

export const sessionStages = ["baca", "potong", "coba", "selesai"] as const;
export type SessionStage = (typeof sessionStages)[number];

export type SessionState = {
  readonly stage: SessionStage;
  /** How many chunks have been introduced during the "potong" stage. */
  readonly revealed: number;
  /** Chunks the child asked to see again during the "coba" stage. */
  readonly peeked: readonly number[];
};

/** A doa this short is read whole; splitting it would not help anyone. */
export const minimumChunksToSplit = 2;

export function startSession(): SessionState {
  return { stage: "baca", revealed: 1, peeked: [] };
}

export function advance(state: SessionState, chunkCount: number): SessionState {
  if (state.stage === "baca") {
    return chunkCount >= minimumChunksToSplit
      ? { stage: "potong", revealed: 1, peeked: [] }
      : { stage: "coba", revealed: chunkCount, peeked: [] };
  }

  if (state.stage === "potong") {
    return state.revealed < chunkCount
      ? { ...state, revealed: state.revealed + 1 }
      : { stage: "coba", revealed: chunkCount, peeked: [] };
  }

  return state;
}

export function back(state: SessionState): SessionState {
  if (state.stage === "potong" && state.revealed > 1) {
    return { ...state, revealed: state.revealed - 1 };
  }
  if (state.stage === "potong") {
    return startSession();
  }
  if (state.stage === "coba") {
    return { stage: "potong", revealed: state.revealed, peeked: [] };
  }
  return state;
}

export function peek(state: SessionState, index: number): SessionState {
  if (state.stage !== "coba" || state.peeked.includes(index)) {
    return state;
  }
  return { ...state, peeked: [...state.peeked, index] };
}

export function isPeeked(state: SessionState, index: number): boolean {
  return state.peeked.includes(index);
}

export function finish(state: SessionState): SessionState {
  return { ...state, stage: "selesai" };
}

export function isChunkVisible(state: SessionState, index: number): boolean {
  if (state.stage === "baca" || state.stage === "selesai") {
    return true;
  }
  if (state.stage === "potong") {
    return index < state.revealed;
  }
  return isPeeked(state, index);
}

export type SessionGuide = {
  readonly title: string;
  readonly instruction: string;
  readonly primaryLabel: string;
};

export function guideFor(state: SessionState, chunkCount: number): SessionGuide {
  if (state.stage === "baca") {
    return {
      title: "Baca bersama",
      instruction: "Dengarkan pendamping membacanya, lalu baca bersama-sama dengan suara pelan.",
      primaryLabel: chunkCount >= minimumChunksToSplit ? "Potong jadi bagian kecil" : "Coba dari ingatan",
    };
  }

  if (state.stage === "potong") {
    const isLast = state.revealed >= chunkCount;
    return {
      title: `Bagian ${state.revealed} dari ${chunkCount}`,
      instruction: "Ulangi bagian ini sampai lancar, baru tambah bagian berikutnya.",
      primaryLabel: isLast ? "Coba dari ingatan" : "Tambah bagian",
    };
  }

  if (state.stage === "coba") {
    return {
      title: "Coba dari ingatan",
      instruction: "Ucapkan doanya sendiri. Ketuk bagian yang lupa untuk mengintip sebentar.",
      primaryLabel: "Selesai",
    };
  }

  return { title: "Selesai", instruction: "Satu putaran selesai.", primaryLabel: "Kembali" };
}

/**
 * The child's own answer decides it, but a round where almost everything had
 * to be peeked is offered as "belum lancar" first, so the honest answer is
 * also the easy one.
 */
export function suggestedOutcome(state: SessionState, chunkCount: number): "lancar" | "belum" {
  if (chunkCount === 0) {
    return "lancar";
  }
  return state.peeked.length * 2 > chunkCount ? "belum" : "lancar";
}
