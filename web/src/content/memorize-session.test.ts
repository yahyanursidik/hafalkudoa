import { describe, expect, it } from "vitest";

import {
  advance,
  back,
  finish,
  guideFor,
  isChunkVisible,
  peek,
  startSession,
  suggestedOutcome,
} from "./memorize-session.js";

/** Walks a session all the way to the recall stage. */
function recallStage(chunkCount: number) {
  let state = startSession();
  while (state.stage !== "coba") {
    state = advance(state, chunkCount);
  }
  return state;
}

describe("memorisation session", () => {
  it("adds one chunk at a time before asking for recall", () => {
    let state = startSession();
    expect(state.stage).toBe("baca");

    state = advance(state, 3);
    expect(state).toMatchObject({ stage: "potong", revealed: 1 });
    expect(isChunkVisible(state, 0)).toBe(true);
    expect(isChunkVisible(state, 1)).toBe(false);

    state = advance(state, 3);
    state = advance(state, 3);
    expect(state.revealed).toBe(3);

    state = advance(state, 3);
    expect(state.stage).toBe("coba");
  });

  it("reads a one-piece doa whole instead of splitting it", () => {
    const state = advance(startSession(), 1);
    expect(state.stage).toBe("coba");
  });

  it("hides everything during recall until a chunk is tapped", () => {
    let state = recallStage(2);
    expect(state.stage).toBe("coba");
    expect(isChunkVisible(state, 0)).toBe(false);

    state = peek(state, 0);
    expect(isChunkVisible(state, 0)).toBe(true);
    expect(isChunkVisible(state, 1)).toBe(false);
    expect(peek(state, 0).peeked).toEqual([0]);
  });

  it("can step back without losing the round", () => {
    const atSecondChunk = advance(advance(startSession(), 3), 3);
    expect(back(atSecondChunk).revealed).toBe(1);
    expect(back(back(atSecondChunk)).stage).toBe("baca");
  });

  it("suggests 'belum' only when most of it had to be peeked", () => {
    const recall = recallStage(4);
    expect(recall.stage).toBe("coba");
    expect(suggestedOutcome(recall, 4)).toBe("lancar");
    expect(suggestedOutcome(peek(peek(peek(recall, 0), 1), 2), 4)).toBe("belum");
  });

  it("shows the whole doa again once the round is finished", () => {
    const done = finish(advance(startSession(), 2));
    expect(isChunkVisible(done, 5)).toBe(true);
    expect(guideFor(done, 2).title).toBe("Selesai");
  });

  it("tells the child what to do at each stage", () => {
    expect(guideFor(startSession(), 3).primaryLabel).toBe("Potong jadi bagian kecil");
    expect(guideFor(startSession(), 1).primaryLabel).toBe("Coba dari ingatan");
    expect(guideFor({ stage: "potong", revealed: 2, peeked: [] }, 3).title).toBe("Bagian 2 dari 3");
    expect(guideFor({ stage: "potong", revealed: 3, peeked: [] }, 3).primaryLabel).toBe("Coba dari ingatan");
  });
});
