import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchActiveDuaDetail, type PublicDuaDetail } from "../content/dua-api.js";
import { useLearningFocus } from "./learning-focus.js";
import { LearningIcon, type LearningIconName } from "./learning-icon.js";
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
  const latinReading = isLatinVisible && (
    <section className={`dua-copy reader-latin${isLatinLarge ? " is-large" : ""}`} aria-labelledby="latin-title">
      <h2 id="latin-title">Bantuan baca</h2>
      <p>{dua.latin}</p>
    </section>
  );

  return (
    <article className="dua-detail" aria-labelledby="dua-detail-title">
      <div className="reader-topline">
        <Link className="back-link" to="/doa"><LearningIcon name="arrowLeft" />Daftar doa</Link>
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
          <p>{isLatinVisible || isTranslationVisible ? "Baca pelan-pelan. Saat siap, coba ucapkan sendiri." : "Bantuan disembunyikan. Coba ucapkan doa dari ingatan."}</p>
          <button
            className="primary-action"
            onClick={() => {
              const nextVisible = !(isLatinVisible || isTranslationVisible);
              setLatinVisible(nextVisible);
              setTranslationVisible(false);
            }}
            type="button"
          >
            <LearningIcon name={isLatinVisible || isTranslationVisible ? "try" : "help"} />
            <span>{isLatinVisible || isTranslationVisible ? "Coba sendiri" : "Lihat bantuan"}</span>
          </button>
        </div>

        <div className="reader-control-grid">
          <ReaderControl icon="order" isPressed={isLatinFirst} label="Letak Latin" onClick={() => { setLatinVisible(true); setLatinFirst((current) => !current); }} detail={isLatinFirst ? "Di atas Arab" : "Di bawah Arab"} />
          <ReaderControl icon="textLarge" isPressed={isLatinLarge} label="Latin besar" onClick={() => { setLatinLarge((current) => !current); setLatinVisible(true); }} detail={isLatinLarge ? "Sudah besar" : "Mudah dibaca"} />
          <ReaderControl icon="help" isPressed={isTranslationVisible} label="Lihat arti" onClick={() => setTranslationVisible((current) => !current)} detail={isTranslationVisible ? "Arti terlihat" : "Arti Indonesia"} />
          <ReaderControl icon="color" isPressed={isColorGuidance} label="Warna bantu" onClick={() => { setColorGuidance((current) => !current); setLatinVisible(true); }} detail={isColorGuidance ? "Warna aktif" : "Tandai teks"} />
          <ReaderControl icon="textSmall" isPressed={arabicSize === "small"} label="Arab kecil" onClick={() => setArabicSize("small")} detail="Ukuran kecil" />
          <ReaderControl icon="textMedium" isPressed={arabicSize === "medium"} label="Arab sedang" onClick={() => setArabicSize("medium")} detail="Ukuran nyaman" />
          <ReaderControl icon="textLarge" isPressed={arabicSize === "large"} label="Arab besar" onClick={() => setArabicSize("large")} detail="Mudah dilihat" />
          <ReaderControl icon="focus" isPressed={isFocusMode} label="Mode fokus" onClick={() => setFocusMode(!isFocusMode)} detail={isFocusMode ? "Kembali ke menu" : "Sembunyikan menu"} />
        </div>
      </section>

      <details className="dua-source" open>
        <summary>Sumber doa</summary>
        <p>{dua.source}</p>
      </details>
    </article>
  );
}

type ReaderControlProps = {
  readonly detail: string;
  readonly icon: LearningIconName;
  readonly isPressed: boolean;
  readonly label: string;
  readonly onClick: () => void;
};

function ReaderControl({ detail, icon, isPressed, label, onClick }: ReaderControlProps) {
  return (
    <button aria-pressed={isPressed} className="reader-control" onClick={onClick} type="button">
      <span className="reader-control-heading"><LearningIcon name={icon} /><strong>{label}</strong></span>
      <span className="reader-control-detail">{detail}</span>
    </button>
  );
}
