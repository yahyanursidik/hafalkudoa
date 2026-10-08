import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { duaPageCount, fetchActiveDuaList, paginateDua, type DuaAudience, type PublicDuaListItem } from "../content/dua-api.js";
import { LearningIcon } from "./learning-icon.js";
import "../styles/dua-library.css";

type CatalogState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly items: PublicDuaListItem[] }
  | { readonly status: "error" };

type AudienceFilter = DuaAudience | "ALL";

const audienceFilters: { readonly value: AudienceFilter; readonly label: string }[] = [
  { value: "KIDS", label: "Untuk anak" },
  { value: "FAMILY", label: "Bersama orang tua" },
  { value: "ALL", label: "Semua doa" },
];

const difficultyLabels = ["", "Mudah", "Sedang", "Panjang"];

export function DuaCatalogPage() {
  const [state, setState] = useState<CatalogState>({ status: "loading" });
  const [page, setPage] = useState(0);
  const [audience, setAudience] = useState<AudienceFilter>("KIDS");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let current = true;
    setState({ status: "loading" });
    setPage(0);
    void fetchActiveDuaList(audience)
      .then((items) => {
        if (current) {
          setState({ status: "ready", items });
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
  }, [audience]);

  const filters = (
    <nav aria-label="Pilih kelompok doa" className="dua-filters">
      {audienceFilters.map((filter) => (
        <button
          aria-pressed={audience === filter.value}
          className="dua-filter"
          key={filter.value}
          onClick={() => setAudience(filter.value)}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </nav>
  );

  if (state.status === "loading") {
    return (
      <section className="dua-library">
        {filters}
        <p className="dua-status" role="status">Sebentar, doa sedang disiapkan…</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="dua-library">
        {filters}
        <div className="dua-status">
          <h1>Daftar doa belum bisa dibuka.</h1>
          <p>Coba lagi saat koneksi internet sudah siap.</p>
        </div>
      </section>
    );
  }

  const query = search.trim().toLocaleLowerCase("id");
  const matchedItems = state.items.filter((dua) =>
    [dua.title, dua.group, dua.curation?.chapter, ...dua.tags].some((text) => text?.toLocaleLowerCase("id").includes(query)),
  );
  const totalPages = duaPageCount(matchedItems.length);
  const visibleItems = paginateDua(matchedItems, page);

  return (
    <section className="dua-library" aria-labelledby="dua-library-title">
      <header className="dua-library-heading">
        <p className="landing-kicker">Koleksi doa</p>
        <h1 id="dua-library-title">Pilih doa untuk dibaca.</h1>
        <p>Ada {state.items.length} doa. Setiap doa punya Arab, Latin, arti, dan sumber.</p>
      </header>

      {filters}

      <div className="dua-search">
        <label htmlFor="dua-search">Mau baca doa apa?</label>
        <input
          id="dua-search"
          type="search"
          placeholder="Coba ketik: makan, tidur, belajar…"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(0); }}
          aria-describedby="dua-search-results"
        />
        <p id="dua-search-results" role="status">{query ? `${matchedItems.length} doa ditemukan` : "Pilih satu doa untuk mulai membaca."}</p>
      </div>

      {matchedItems.length === 0 && (
        <div className="dua-status">
          <h2>Doanya belum ketemu.</h2>
          <p>Coba kata yang lebih pendek, atau pilih kelompok doa lain.</p>
          <button className="primary-action" type="button" onClick={() => { setSearch(""); setPage(0); }}>Lihat semua</button>
        </div>
      )}

      <ol className="dua-list" start={page * 12 + 1}>
        {visibleItems.map((dua) => (
          <li key={dua.id}>
            <Link to={`/doa/${dua.id}`}>
              <span>
                <strong>{dua.title}</strong>
                {dua.curation ? (
                  <small>
                    {dua.curation.chapter} · {difficultyLabels[dua.curation.difficulty]}
                  </small>
                ) : (
                  dua.group && <small>{dua.group}</small>
                )}
              </span>
              <span className="dua-list-action"><span>Baca</span><LearningIcon name="arrowRight" /></span>
            </Link>
          </li>
        ))}
      </ol>

      {matchedItems.length > 0 && <nav className="dua-pagination" aria-label="Halaman daftar doa">
        <button aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => setPage((current) => current - 1)} type="button">
          <LearningIcon name="arrowLeft" /><span>Kembali</span>
        </button>
        <p aria-live="polite">Halaman {page + 1} dari {totalPages}</p>
        <button aria-label="Halaman berikutnya" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)} type="button">
          <span>Lanjut</span><LearningIcon name="arrowRight" />
        </button>
      </nav>}
    </section>
  );
}
