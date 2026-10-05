import { Link } from "react-router-dom";
import { dayKey, describeDay, dueDuaIds, startedDuaIds } from "../content/progress.js";
import { LearningIcon } from "./learning-icon.js";
import { useProgress } from "./progress-provider.js";
import { useDuaIndex } from "./use-dua-index.js";
import "../styles/review.css";

const statusLabels = { baru: "Baru", belajar: "Sedang dihafal", hafal: "Sudah hafal" } as const;

export function ReviewPage() {
  const { state: progress } = useProgress();
  const index = useDuaIndex();

  if (index.status === "loading") {
    return <p className="dua-status" role="status">Sebentar, daftar ulangan sedang disiapkan…</p>;
  }

  if (index.status === "error") {
    return (
      <section className="dua-status" aria-labelledby="review-error">
        <h1 id="review-error">Daftar ulangan belum bisa dibuka.</h1>
        <p>Coba lagi sebentar.</p>
      </section>
    );
  }

  const today = dayKey(new Date());
  const due = dueDuaIds(progress).filter((id) => index.byId.has(id));
  const upcoming = startedDuaIds(progress).filter((id) => !due.includes(id) && index.byId.has(id));

  if (startedDuaIds(progress).length === 0) {
    return (
      <section className="review-empty" aria-labelledby="review-empty-title">
        <h1 id="review-empty-title">Belum ada yang perlu diulang.</h1>
        <p>Setiap doa yang sudah dilatih akan muncul di sini pada hari berikutnya, supaya tidak cepat lupa.</p>
        <Link className="primary-action" to="/hafalan"><LearningIcon name="steps" /><span>Mulai hafalan pertama</span></Link>
      </section>
    );
  }

  return (
    <article className="review" aria-labelledby="review-title">
      <header className="review-heading">
        <p className="landing-kicker">Ulangi</p>
        <h1 id="review-title">{due.length > 0 ? `Ada ${due.length} doa untuk diulang.` : "Semua ulangan hari ini selesai."}</h1>
        <p>
          {due.length > 0
            ? "Satu putaran singkat per doa sudah cukup. Tidak perlu semuanya hari ini."
            : "Doa berikutnya akan muncul sesuai jadwalnya. Boleh juga mengulang lebih awal."}
        </p>
      </header>

      {due.length > 0 && (
        <ol className="review-list" aria-label="Doa yang siap diulang">
          {due.map((id) => {
            const item = index.byId.get(id);
            const record = progress.items[id];
            return item && record ? (
              <li key={id}>
                <Link to={`/hafalan/${id}`}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{statusLabels[record.status]} · {record.reviews}× dilatih</small>
                  </span>
                  <span className="review-action"><span>Ulangi</span><LearningIcon name="arrowRight" /></span>
                </Link>
              </li>
            ) : null;
          })}
        </ol>
      )}

      {upcoming.length > 0 && (
        <section className="review-upcoming" aria-labelledby="review-upcoming-title">
          <h2 id="review-upcoming-title">Terjadwal berikutnya</h2>
          <ul>
            {upcoming.map((id) => {
              const item = index.byId.get(id);
              const record = progress.items[id];
              return item && record ? (
                <li key={id}>
                  <Link to={`/hafalan/${id}`}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{statusLabels[record.status]}</small>
                    </span>
                    <span className="review-when">{describeDay(record.dueOn, today)}</span>
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
