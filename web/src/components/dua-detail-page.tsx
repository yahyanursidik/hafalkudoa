import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchActiveDuaDetail, type PublicDuaDetail } from "../content/dua-api.js";
import { useLearningFocus } from "./learning-focus.js";
import { LearningIcon } from "./learning-icon.js";
import { useProgress } from "./progress-provider.js";
import { ReaderControls } from "./reader-controls.js";
import "../styles/dua-library.css";

type DetailState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly dua: PublicDuaDetail }
  | { readonly status: "error" };

export function DuaDetailPage() {
  const { id } = useParams();
  const { changeSettings, settings } = useProgress();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const { isFocusMode, setFocusMode } = useLearningFocus();

  useEffect(() => {
    if (!id) {
      setState({ status: "error" });
      return undefined;
    }

    let current = true;
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

  useEffect(() => () => setFocusMode(false), [setFocusMode]);

  if (state.status === "loading") {
    return <p className="dua-status" role="status">Sebentar, doa sedang dibuka…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="dua-status" aria-labelledby="dua-detail-error">
        <h1 id="dua-detail-error">Doa belum bisa ditampilkan.</h1>
        <p>Doa hanya dapat dibuka bila Arab, Latin, arti, dan sumbernya lengkap.</p>
        <Link className="back-link" to="/doa"><LearningIcon name="arrowLeft" />Lihat daftar doa</Link>
      </section>
    );
  }

  const { dua } = state;
  const hasHelp = settings.latinVisible || settings.translationVisible;
  const latinReading = settings.latinVisible && (
    <section className={`dua-copy reader-latin${settings.latinLarge ? " is-large" : ""}`} aria-labelledby="latin-title">
      <h2 id="latin-title">Bantuan baca</h2>
      <p>{dua.latin}</p>
    </section>
  );

  return (
    <article className="dua-detail" aria-labelledby="dua-detail-title">
      <div className="reader-topline">
        <Link className="back-link" to="/doa"><LearningIcon name="arrowLeft" />Daftar doa</Link>
        <p>{dua.curation?.chapter ?? dua.group ?? "Doa"}</p>
      </div>
      <header className="dua-reader-heading">
        <h1 id="dua-detail-title">{dua.title}</h1>
        {!isFocusMode && dua.tags.length > 0 && (
          <ul className="tag-list" aria-label="Tag doa">
            {dua.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}
      </header>

      <section
        className={`reader-stage arabic-size-${settings.arabicSize}${settings.colorGuidance ? " has-color-guidance" : ""}`}
        aria-label="Teks doa"
      >
        {settings.latinFirst && latinReading}
        <p className="dua-arabic" lang="ar" dir="rtl">{dua.arabic}</p>
        {!settings.latinFirst && latinReading}
        {settings.translationVisible && (
          <section className="dua-copy reader-translation" aria-labelledby="translation-title">
            <h2 id="translation-title">Arti</h2>
            <p>{dua.translation}</p>
          </section>
        )}
      </section>

      <section className="reader-actions" aria-label="Pengaturan belajar">
        <Link className="primary-action reader-practice" to={`/hafalan/${dua.id}`}>
          <LearningIcon name="steps" />
          <span>Latih hafalan doa ini</span>
        </Link>
        <div className="recall-action">
          <p>{hasHelp ? "Baca pelan-pelan. Saat siap, coba ucapkan sendiri." : "Bantuan disembunyikan. Coba ucapkan doa dari ingatan."}</p>
          <button
            className="primary-action"
            onClick={() => changeSettings({ latinVisible: !hasHelp, translationVisible: false })}
            type="button"
          >
            <LearningIcon name={hasHelp ? "try" : "help"} />
            <span>{hasHelp ? "Coba sendiri" : "Lihat bantuan"}</span>
          </button>
        </div>

        <ReaderControls />
      </section>

      <details className="dua-source" open>
        <summary>Sumber doa</summary>
        <p>{dua.source}</p>
      </details>
    </article>
  );
}
