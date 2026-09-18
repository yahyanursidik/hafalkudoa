import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { childLearningPath } from "../content/child-learning-path.js";
import { fetchActiveDuaList, type PublicDuaListItem } from "../content/dua-api.js";
import { LearningIcon } from "./learning-icon.js";
import "../styles/child-learning.css";

type LearningState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly itemsByExternalId: ReadonlyMap<string, PublicDuaListItem> }
  | { readonly status: "error" };

export function ChildLearningPage() {
  const [state, setState] = useState<LearningState>({ status: "loading" });

  useEffect(() => {
    let current = true;
    void fetchActiveDuaList()
      .then((items) => {
        if (current) {
          setState({ status: "ready", itemsByExternalId: new Map(items.map((item) => [item.externalId, item])) });
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
  }, []);

  if (state.status === "loading") {
    return <p className="dua-status" role="status">Sebentar, langkah hafalan sedang disiapkan…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="dua-status" aria-labelledby="learning-path-error">
        <h1 id="learning-path-error">Jalur hafalan belum bisa dibuka.</h1>
        <p>Coba lagi saat koleksi doa sudah siap.</p>
      </section>
    );
  }

  return (
    <article className="child-learning-path" aria-labelledby="child-learning-title">
      <header className="child-learning-hero">
        <p className="landing-kicker">Jalur hafalan anak</p>
        <h1 id="child-learning-title">Ayo hafalkan doa yang sering dipakai.</h1>
        <p>Pilih satu doa, baca bersama, lalu coba pakai dalam kegiatan hari ini.</p>
      </header>

      <ol className="learning-stage-list">
        {childLearningPath.map((stage, stageIndex) => (
          <li className={`learning-stage learning-stage-${stageIndex + 1}`} key={stage.id}>
            <header>
              <p>Tahap {stageIndex + 1}</p>
              <h2>{stage.title}</h2>
              <span>{stage.description}</span>
            </header>
            <ol>
              {stage.steps.map((step, stepIndex) => {
                const item = state.itemsByExternalId.get(step.externalId);
                return item ? (
                  <li key={step.externalId}>
                    <Link to={`/doa/${item.id}`}>
                      <span className="learning-step-number">{stepIndex + 1}</span>
                      <span>
                        <small>{step.cue}</small>
                        <strong>{item.title}</strong>
                      </span>
                      <span className="learning-step-action"><span>Belajar</span><LearningIcon name="arrowRight" /></span>
                    </Link>
                  </li>
                ) : null;
              })}
            </ol>
          </li>
        ))}
      </ol>

      <p className="child-learning-note">Tidak perlu selesai semua. Pilih satu doa hari ini, ulangi saat perlu, lalu lanjut besok.</p>
    </article>
  );
}
