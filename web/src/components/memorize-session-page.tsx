import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchActiveDuaDetail, type PublicDuaDetail } from "../content/dua-api.js";
import {
  advance,
  back,
  finish,
  guideFor,
  isChunkVisible,
  peek,
  startSession,
  suggestedOutcome,
  type SessionState,
} from "../content/memorize-session.js";
import { addDays, dayKey, describeDay, intervalFor, type RecallOutcome } from "../content/progress.js";
import { LearningIcon } from "./learning-icon.js";
import { useProgress } from "./progress-provider.js";
import "../styles/memorize.css";

type DetailState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly dua: PublicDuaDetail }
  | { readonly status: "error" };

export function MemorizeSessionPage() {
  const { id } = useParams();
  const { review, settings, state: progress } = useProgress();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [session, setSession] = useState<SessionState>(startSession);
  const [recorded, setRecorded] = useState<RecallOutcome | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setState({ status: "error" });
      return undefined;
    }

    let current = true;
    setSession(startSession());
    setRecorded(undefined);
    void fetchActiveDuaDetail(id)
      .then((dua) => {
        if (current) {
          setState({ status: "ready", dua });
        }
      })
      .catch(() => {
        if (current) {
          setState({ status: "error" });
        }
      });
    return () => {
      current = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return <p className="dua-status" role="status">Sebentar, doa sedang disiapkan…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="dua-status" aria-labelledby="memorize-error">
        <h1 id="memorize-error">Doa ini belum bisa dibuka.</h1>
        <Link className="back-link" to="/hafalan"><LearningIcon name="arrowLeft" />Kembali ke hafalan</Link>
      </section>
    );
  }

  const { dua } = state;
  const chunks = dua.chunks.length > 0 ? dua.chunks : [{ sequence: 0, arabicStart: 0, arabicEnd: dua.arabic.length, latinSegment: dua.latin, visualGroup: 1 }];
  const guide = guideFor(session, chunks.length);
  const activeIndex = session.stage === "potong" ? session.revealed - 1 : -1;

  if (session.stage === "selesai") {
    return (
      <SessionResult
        dua={dua}
        session={session}
        recorded={recorded}
        onChoose={(outcome) => {
          review(dua.id, outcome);
          setRecorded(outcome);
        }}
        onRepeat={() => {
          setSession(startSession());
          setRecorded(undefined);
        }}
        streakOfRecalls={progress.items[dua.id]?.streakOfRecalls ?? 0}
      />
    );
  }

  return (
    <article className="memorize" aria-labelledby="memorize-title">
      <div className="reader-topline">
        <Link className="back-link" to="/hafalan"><LearningIcon name="arrowLeft" />Hafalan</Link>
        <p>{dua.curation?.chapter ?? dua.group ?? "Doa"}</p>
      </div>

      <header className="memorize-heading">
        <h1 id="memorize-title">{dua.title}</h1>
        <p className="memorize-stage">{guide.title}</p>
        <p className="memorize-instruction">{guide.instruction}</p>
      </header>

      <ol className={`memorize-chunks arabic-size-${settings.arabicSize}`} aria-label="Bagian doa">
        {chunks.map((chunk, index) => {
          const visible = isChunkVisible(session, index);
          const arabic = dua.arabic.slice(chunk.arabicStart, chunk.arabicEnd);
          const isActive = index === activeIndex;

          if (visible) {
            return (
              <li className={`memorize-chunk${isActive ? " is-active" : ""}`} key={chunk.sequence}>
                <span className="memorize-chunk-number" aria-hidden="true">{index + 1}</span>
                <p className="memorize-arabic" lang="ar" dir="rtl">{arabic}</p>
                {settings.latinVisible && chunk.latinSegment.length > 0 && (
                  <p className="memorize-latin">{chunk.latinSegment}</p>
                )}
              </li>
            );
          }

          // Only during recall is a hidden chunk something to tap; while chunks
          // are still being introduced it is simply not its turn yet.
          if (session.stage === "potong") {
            return (
              <li className="memorize-chunk is-waiting" key={chunk.sequence}>
                <span className="memorize-chunk-number" aria-hidden="true">{index + 1}</span>
                <span className="memorize-peek-label">Belum dibuka</span>
              </li>
            );
          }

          return (
            <li className="memorize-chunk is-hidden" key={chunk.sequence}>
              <button
                aria-label={`Lihat bagian ${index + 1}`}
                className="memorize-peek"
                onClick={() => setSession((current) => peek(current, index))}
                type="button"
              >
                <span className="memorize-chunk-number" aria-hidden="true">{index + 1}</span>
                <span className="memorize-peek-label">Ketuk untuk lihat</span>
              </button>
            </li>
          );
        })}
      </ol>

      {session.stage === "baca" && settings.translationVisible && (
        <section className="memorize-translation" aria-labelledby="memorize-translation-title">
          <h2 id="memorize-translation-title">Arti</h2>
          <p>{dua.translation}</p>
        </section>
      )}

      <div className="memorize-actions">
        <button
          className="primary-action"
          onClick={() => {
            setSession((current) => (current.stage === "coba" ? finish(current) : advance(current, chunks.length)));
          }}
          type="button"
        >
          <LearningIcon name={session.stage === "coba" ? "try" : "arrowRight"} />
          <span>{guide.primaryLabel}</span>
        </button>
        <button
          className="secondary-action"
          disabled={session.stage === "baca"}
          onClick={() => setSession((current) => back(current))}
          type="button"
        >
          <LearningIcon name="arrowLeft" />
          <span>Mundur</span>
        </button>
      </div>

      <details className="dua-source">
        <summary>Sumber doa</summary>
        <p>{dua.source}</p>
      </details>
    </article>
  );
}

type SessionResultProps = {
  readonly dua: PublicDuaDetail;
  readonly session: SessionState;
  readonly recorded: RecallOutcome | undefined;
  readonly onChoose: (outcome: RecallOutcome) => void;
  readonly onRepeat: () => void;
  readonly streakOfRecalls: number;
};

function SessionResult({ dua, onChoose, onRepeat, recorded, session, streakOfRecalls }: SessionResultProps) {
  const suggestion = suggestedOutcome(session, dua.chunks.length);

  if (!recorded) {
    return (
      <section className="memorize-result" aria-labelledby="memorize-result-title">
        <h1 id="memorize-result-title">Bagaimana tadi?</h1>
        <p className="memorize-instruction">
          Jawab apa adanya. Kalau belum lancar, doa ini akan muncul lagi besok — itu bukan nilai, hanya pengingat.
        </p>
        <div className="memorize-outcome">
          <button
            className={`outcome-choice${suggestion === "lancar" ? " is-suggested" : ""}`}
            onClick={() => onChoose("lancar")}
            type="button"
          >
            <strong>Sudah lancar</strong>
            <small>Bisa diucapkan tanpa melihat</small>
          </button>
          <button
            className={`outcome-choice${suggestion === "belum" ? " is-suggested" : ""}`}
            onClick={() => onChoose("belum")}
            type="button"
          >
            <strong>Belum lancar</strong>
            <small>Masih perlu dibantu</small>
          </button>
        </div>
      </section>
    );
  }

  const today = dayKey(new Date());
  const nextDay = addDays(today, recorded === "lancar" ? intervalFor(streakOfRecalls) : 1);

  return (
    <section className="memorize-result" aria-labelledby="memorize-done-title">
      <h1 id="memorize-done-title">{recorded === "lancar" ? "Satu putaran selesai." : "Tidak apa-apa, besok diulang."}</h1>
      <p className="memorize-instruction">
        {recorded === "lancar"
          ? `Sudah ${streakOfRecalls}× lancar berturut-turut.`
          : "Doa ini kembali ke urutan awal supaya lebih sering diulang."}
      </p>
      <dl className="memorize-next">
        <dt>Diulang lagi</dt>
        <dd>{describeDay(nextDay, today)}</dd>
      </dl>
      <div className="memorize-actions">
        <Link className="primary-action" to="/hafalan"><LearningIcon name="steps" /><span>Pilih doa lain</span></Link>
        <button className="secondary-action" onClick={onRepeat} type="button">
          <LearningIcon name="repeat" />
          <span>Ulangi sekarang</span>
        </button>
      </div>
      <details className="dua-source">
        <summary>Sumber doa</summary>
        <p>{dua.source}</p>
      </details>
    </section>
  );
}
