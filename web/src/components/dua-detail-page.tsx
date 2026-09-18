import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchActiveDuaDetail, type PublicDuaDetail } from "../content/dua-api.js";
import { useLearningFocus } from "./learning-focus.js";
import "../styles/dua-library.css";

type DetailState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly dua: PublicDuaDetail }
  | { readonly status: "error" };

export function DuaDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [isLatinVisible, setLatinVisible] = useState(true);
  const [isLatinFirst, setLatinFirst] = useState(false);
  const [isLatinLarge, setLatinLarge] = useState(false);
  const [isTranslationVisible, setTranslationVisible] = useState(false);
  const [isColorGuidance, setColorGuidance] = useState(false);
  const [arabicSize, setArabicSize] = useState<"small" | "medium" | "large">("medium");
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
    return <p className="dua-status" role="status">Memuat doa…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="dua-status" aria-labelledby="dua-detail-error">
        <h1 id="dua-detail-error">Doa belum dapat ditampilkan.</h1>
        <p>Doa hanya dapat dipelajari bila Arab, Latin, arti, dan sumbernya lengkap.</p>
        <Link className="back-link" to="/doa">Lihat koleksi doa</Link>
      </section>
    );
  }

  const { dua } = state;
  const latinReading = isLatinVisible && (
    <section className={`dua-copy reader-latin${isLatinLarge ? " is-large" : ""}`} aria-labelledby="latin-title">
      <h2 id="latin-title">Bantuan baca</h2>
      <p>{dua.latin}</p>
    </section>
  );

  return (
    <article className="dua-detail" aria-labelledby="dua-detail-title">
      <div className="reader-topline">
        <Link className="back-link" to="/doa">← Koleksi doa</Link>
        <p>{dua.group ?? "Doa"}</p>
      </div>
      <header className="dua-reader-heading">
        <h1 id="dua-detail-title">{dua.title}</h1>
        {!isFocusMode && dua.tags.length > 0 && (
          <ul className="tag-list" aria-label="Tag doa">
            {dua.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}
      </header>

      <section className={`reader-stage arabic-size-${arabicSize}${isColorGuidance ? " has-color-guidance" : ""}`} aria-label="Teks doa">
        {isLatinFirst && latinReading}
        <p className="dua-arabic" lang="ar" dir="rtl">{dua.arabic}</p>
        {!isLatinFirst && latinReading}
        {isTranslationVisible && (
          <section className="dua-copy reader-translation" aria-labelledby="translation-title">
            <h2 id="translation-title">Arti</h2>
            <p>{dua.translation}</p>
          </section>
        )}
      </section>

      <section className="reader-actions" aria-label="Pengaturan belajar">
        <div className="recall-action">
          <p>{isLatinVisible || isTranslationVisible ? "Baca perlahan. Saat siap, coba ucapkan tanpa bantuan." : "Bantuan sedang disembunyikan. Coba ucapkan dari ingatan."}</p>
          <button
            className="primary-action"
            onClick={() => {
              const nextVisible = !(isLatinVisible || isTranslationVisible);
              setLatinVisible(nextVisible);
              setTranslationVisible(false);
            }}
            type="button"
          >
            {isLatinVisible || isTranslationVisible ? "Coba dari ingatan" : "Tampilkan bantuan"}
          </button>
        </div>

        <div className="reader-control-grid">
          <button
            aria-pressed={isLatinFirst}
            className="reader-control"
            onClick={() => {
              setLatinVisible(true);
              setLatinFirst((current) => !current);
            }}
            type="button"
          >
            <strong>Posisi Latin</strong><span>{isLatinFirst ? "Latin di atas" : "Latin di bawah"}</span>
          </button>
          <button
            aria-pressed={isLatinLarge}
            className="reader-control"
            onClick={() => {
              setLatinLarge((current) => !current);
              setLatinVisible(true);
            }}
            type="button"
          >
            <strong>Latin besar</strong><span>{isLatinLarge ? "Ukuran besar aktif" : "Perbesar Latin"}</span>
          </button>
          <button aria-pressed={isTranslationVisible} className="reader-control" onClick={() => setTranslationVisible((current) => !current)} type="button">
            <strong>Arti doa</strong><span>{isTranslationVisible ? "Arti sedang tampil" : "Tampilkan arti"}</span>
          </button>
          <button
            aria-pressed={isColorGuidance}
            className="reader-control"
            onClick={() => {
              setColorGuidance((current) => !current);
              setLatinVisible(true);
            }}
            type="button"
          >
            <strong>Warna bantu</strong><span>{isColorGuidance ? "Penanda warna aktif" : "Tandai dua teks"}</span>
          </button>
          <button aria-pressed={arabicSize === "small"} className="reader-control" onClick={() => setArabicSize("small")} type="button">
            <strong>A−</strong><span>Arab kecil</span>
          </button>
          <button aria-pressed={arabicSize === "medium"} className="reader-control" onClick={() => setArabicSize("medium")} type="button">
            <strong>A</strong><span>Arab sedang</span>
          </button>
          <button aria-pressed={arabicSize === "large"} className="reader-control" onClick={() => setArabicSize("large")} type="button">
            <strong>A+</strong><span>Arab besar</span>
          </button>
          <button aria-pressed={isFocusMode} className="reader-control" onClick={() => setFocusMode(!isFocusMode)} type="button">
            <strong>Fokus</strong><span>{isFocusMode ? "Kembali ke aplikasi" : "Tanpa navigasi"}</span>
          </button>
        </div>
      </section>

      <details className="dua-source" open>
        <summary>Lihat sumber doa</summary>
        <p>{dua.source}</p>
      </details>
    </article>
  );
}
