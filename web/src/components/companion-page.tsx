import { useState } from "react";
import { Link } from "react-router-dom";
import { dayKey, describeDay, sessionsOn, startedDuaIds, summarize } from "../content/progress.js";
import { LearningIcon } from "./learning-icon.js";
import { useProgress } from "./progress-provider.js";
import { useDuaIndex } from "./use-dua-index.js";
import "../styles/companion.css";

const statusLabels = { baru: "Baru", belajar: "Sedang dihafal", hafal: "Sudah hafal" } as const;
const arabicSizes = [
  { value: "small", label: "Kecil" },
  { value: "medium", label: "Sedang" },
  { value: "large", label: "Besar" },
] as const;

export function CompanionPage() {
  const { changeSettings, forget, isSaved, resetAll, settings, state: progress } = useProgress();
  const index = useDuaIndex();
  const [isConfirmingReset, setConfirmingReset] = useState(false);

  const summary = summarize(progress);
  const today = sessionsOn(progress);
  const started = startedDuaIds(progress);
  const todayKey = dayKey(new Date());

  return (
    <article className="companion" aria-labelledby="companion-title">
      <header className="companion-heading">
        <p className="landing-kicker">Ruang pendamping</p>
        <h1 id="companion-title">Catatan belajar anak.</h1>
        <p>Semua catatan tersimpan di perangkat ini saja. Tidak ada akun dan tidak ada data yang dikirim ke mana pun.</p>
      </header>

      {!isSaved && (
        <p className="companion-warning" role="status">
          Perangkat ini sedang tidak mengizinkan penyimpanan, jadi catatan akan hilang saat halaman ditutup. Doa tetap bisa dibaca dan dilatih.
        </p>
      )}

      <section className="companion-summary" aria-labelledby="companion-summary-title">
        <h2 id="companion-summary-title">Ringkasan</h2>
        <dl>
          <div><dt>Sudah hafal</dt><dd>{summary.memorised}</dd></div>
          <div><dt>Sedang dihafal</dt><dd>{summary.learning}</dd></div>
          <div><dt>Perlu diulang</dt><dd>{summary.dueToday}</dd></div>
          <div><dt>Hari berturut-turut</dt><dd>{progress.streakDays}</dd></div>
        </dl>
        <p className="companion-today">
          Hari ini sudah {today} putaran dari target {settings.dailyTarget}.
          {today >= settings.dailyTarget ? " Target hari ini tercapai." : " Satu putaran singkat sudah cukup."}
        </p>
      </section>

      <section className="companion-setting" aria-labelledby="companion-target-title">
        <h2 id="companion-target-title">Target harian</h2>
        <p>Berapa putaran latihan yang diharapkan dalam sehari. Target kecil lebih mudah dijaga.</p>
        <div className="companion-choices" role="group" aria-label="Target putaran per hari">
          {[1, 2, 3, 5].map((target) => (
            <button
              aria-pressed={settings.dailyTarget === target}
              className="companion-choice"
              key={target}
              onClick={() => changeSettings({ dailyTarget: target })}
              type="button"
            >
              {target}×
            </button>
          ))}
        </div>
      </section>

      <section className="companion-setting" aria-labelledby="companion-reading-title">
        <h2 id="companion-reading-title">Tampilan bacaan</h2>
        <p>Pengaturan awal setiap kali doa dibuka. Anak tetap bisa mengubahnya sendiri saat membaca.</p>

        <div className="companion-choices" role="group" aria-label="Ukuran huruf Arab">
          {arabicSizes.map((size) => (
            <button
              aria-pressed={settings.arabicSize === size.value}
              className="companion-choice"
              key={size.value}
              onClick={() => changeSettings({ arabicSize: size.value })}
              type="button"
            >
              Arab {size.label}
            </button>
          ))}
        </div>

        <ul className="companion-toggles">
          <CompanionToggle
            detail="Membantu anak yang belum lancar membaca Arab."
            isOn={settings.latinVisible}
            label="Tampilkan Latin"
            onToggle={() => changeSettings({ latinVisible: !settings.latinVisible })}
          />
          <CompanionToggle
            detail="Arti bahasa Indonesia tampil tanpa perlu ditekan dulu."
            isOn={settings.translationVisible}
            label="Tampilkan arti"
            onToggle={() => changeSettings({ translationVisible: !settings.translationVisible })}
          />
        </ul>
      </section>

      {started.length > 0 && index.status === "ready" && (
        <section className="companion-setting" aria-labelledby="companion-list-title">
          <h2 id="companion-list-title">Doa yang sedang dijalani</h2>
          <ul className="companion-dua-list">
            {started.map((id) => {
              const item = index.byId.get(id);
              const record = progress.items[id];
              return item && record ? (
                <li key={id}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{statusLabels[record.status]} · terakhir {describeDay(record.lastReviewedOn, todayKey).toLowerCase()}</small>
                  </span>
                  <button className="companion-remove" onClick={() => forget(id)} type="button">
                    Hapus catatan
                  </button>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      <section className="companion-setting" aria-labelledby="companion-reset-title">
        <h2 id="companion-reset-title">Mulai dari awal</h2>
        <p>Menghapus seluruh catatan latihan di perangkat ini. Koleksi doa tidak terpengaruh.</p>
        {isConfirmingReset ? (
          <div className="companion-confirm">
            <p>Hapus semua catatan latihan? Tindakan ini tidak bisa dibatalkan.</p>
            <div className="companion-choices">
              <button
                className="companion-choice is-danger"
                onClick={() => {
                  resetAll();
                  setConfirmingReset(false);
                }}
                type="button"
              >
                Ya, hapus
              </button>
              <button className="companion-choice" onClick={() => setConfirmingReset(false)} type="button">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button className="companion-choice" onClick={() => setConfirmingReset(true)} type="button">
            Hapus catatan latihan
          </button>
        )}
      </section>

      <Link className="primary-action" to="/hafalan"><LearningIcon name="steps" /><span>Lanjut belajar</span></Link>
    </article>
  );
}

type CompanionToggleProps = {
  readonly detail: string;
  readonly isOn: boolean;
  readonly label: string;
  readonly onToggle: () => void;
};

function CompanionToggle({ detail, isOn, label, onToggle }: CompanionToggleProps) {
  return (
    <li>
      <button aria-pressed={isOn} className="companion-toggle" onClick={onToggle} type="button">
        <span>
          <strong>{label}</strong>
          <small>{detail}</small>
        </span>
        <span className="companion-toggle-state">{isOn ? "Aktif" : "Mati"}</span>
      </button>
    </li>
  );
}
