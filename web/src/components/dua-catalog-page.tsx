import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { duaPageCount, fetchActiveDuaList, paginateDua, type PublicDuaListItem } from "../content/dua-api.js";
import "../styles/dua-library.css";

type CatalogState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly items: PublicDuaListItem[] }
  | { readonly status: "error" };

export function DuaCatalogPage() {
  const [state, setState] = useState<CatalogState>({ status: "loading" });
  const [page, setPage] = useState(0);

  useEffect(() => {
    let current = true;
    void fetchActiveDuaList()
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
  }, []);

  if (state.status === "loading") {
    return <p className="dua-status" role="status">Menyiapkan koleksi doa…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="dua-status" aria-labelledby="dua-load-error">
        <h1 id="dua-load-error">Daftar doa belum tersedia.</h1>
        <p>Coba lagi setelah koneksi ke koleksi doa tersedia.</p>
      </section>
    );
  }

  const totalPages = duaPageCount(state.items.length);
  const visibleItems = paginateDua(state.items, page);

  return (
    <section className="dua-library" aria-labelledby="dua-library-title">
      <header className="dua-library-heading">
        <p className="landing-kicker">Koleksi doa</p>
        <h1 id="dua-library-title">Cari doa yang ingin dibaca.</h1>
        <p>Ada {state.items.length} doa lengkap. Buka satu doa untuk melihat Arab, bantuan baca, arti, dan sumbernya.</p>
      </header>

      <ol className="dua-list" start={page * 12 + 1}>
        {visibleItems.map((dua) => (
          <li key={dua.id}>
            <Link to={`/doa/${dua.id}`}>
              <span>
                <strong>{dua.title}</strong>
                {dua.group && <small>{dua.group}</small>}
              </span>
              <span aria-hidden="true">Buka doa</span>
            </Link>
          </li>
        ))}
      </ol>

      <nav className="dua-pagination" aria-label="Halaman daftar doa">
        <button aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => setPage((current) => current - 1)} type="button">
          Kembali
        </button>
        <p aria-live="polite">Halaman {page + 1} dari {totalPages}</p>
        <button aria-label="Halaman berikutnya" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)} type="button">
          Lanjut
        </button>
      </nav>
    </section>
  );
}
