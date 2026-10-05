import { Link } from "react-router-dom";
import { childLearningPath } from "../content/child-learning-path.js";
import { sessionsOn, summarize } from "../content/progress.js";
import { copyForPlan, planForToday, remainingToday } from "../content/today.js";
import { Brand } from "./brand.js";
import { LearningIcon } from "./learning-icon.js";
import { useProgress } from "./progress-provider.js";
import { useDuaIndex } from "./use-dua-index.js";
import "../styles/home.css";

const pathExternalIds = childLearningPath.flatMap((stage) => stage.steps.map((step) => step.externalId));

export function HomePage() {
  const { state: progress, settings } = useProgress();
  const index = useDuaIndex();

  const items = index.status === "ready" ? index.items : [];
  const byExternalId = new Map(items.map((item) => [item.externalId, item]));
  const pathIds = pathExternalIds.flatMap((externalId) => {
    const item = byExternalId.get(externalId);
    return item ? [item.id] : [];
  });
  const kidsIds = items.filter((item) => item.curation?.audience === "KIDS").map((item) => item.id);
  const candidateIds = [...pathIds, ...kidsIds.filter((id) => !pathIds.includes(id))];

  const plan = planForToday(progress, candidateIds);
  const copy = copyForPlan(plan);
  const summary = summarize(progress);
  const target = remainingToday(progress);
  const destination = plan.kind === "ulangi" ? "/murajaah" : plan.kind === "selesai" ? "/doa" : `/hafalan/${plan.duaId}`;
  const suggested = plan.kind === "selesai" ? undefined : index.status === "ready" ? items.find((item) => item.id === plan.duaId) : undefined;

  return (
    <article className="home-path">
      <section className="home-hero" aria-labelledby="landing-title">
        <Brand className="home-brand" />
        <p className="home-greeting">Assalamu’alaikum</p>
        <h1 id="landing-title">Satu doa<br />hari ini.</h1>
        <p className="home-lede">Pilih satu doa, baca bersama Ayah, Bunda, atau guru, lalu ulangi pelan-pelan.</p>
        <Link className="home-hero-link" to={destination}>
          <LearningIcon name="steps" />
          <span>{index.status === "ready" ? copy.action : "Ayo mulai"}</span>
          <LearningIcon name="arrowRight" />
        </Link>
      </section>

      <section className="home-feature" aria-labelledby="featured-dua-title">
        <header>
          <p className="landing-kicker">{copy.kicker}</p>
          <h2 id="featured-dua-title">{copy.headline}</h2>
          <p>
            {target > 0
              ? `Sisa ${target} putaran untuk memenuhi target hari ini.`
              : `Target hari ini sudah tercapai — ${sessionsOn(progress)} putaran.`}
          </p>
        </header>
        {suggested && (
          <article className="feature-card">
            <div className="feature-card-copy">
              <span className="feature-card-icon"><LearningIcon name="book" /></span>
              <p>{suggested.curation?.chapter ?? suggested.group ?? "Doa"}</p>
              <h3>{suggested.title}</h3>
              <span>Arab · Latin · Arti</span>
            </div>
            <Link to={`/hafalan/${suggested.id}`}><span>Belajar doa ini</span><LearningIcon name="arrowRight" /></Link>
          </article>
        )}
      </section>

      {summary.started > 0 && (
        <section className="home-progress" aria-labelledby="home-progress-title">
          <h2 id="home-progress-title">Sejauh ini</h2>
          <dl>
            <div><dt>Sudah hafal</dt><dd>{summary.memorised}</dd></div>
            <div><dt>Sedang dihafal</dt><dd>{summary.learning}</dd></div>
            <div><dt>Hari berturut-turut</dt><dd>{progress.streakDays}</dd></div>
          </dl>
          <p>Target harian {settings.dailyTarget} putaran. Ubah di ruang pendamping bila perlu.</p>
        </section>
      )}

      <section className="home-start" aria-labelledby="home-start-title">
        <header>
          <h2 id="home-start-title">Mau belajar yang mana?</h2>
          <p>Pilih satu kegiatan yang paling ingin kamu lakukan sekarang.</p>
        </header>
        <div className="starter-grid">
          <Link className="starter-card starter-card-library" to="/doa">
            <span className="starter-card-icon"><LearningIcon name="collection" /></span>
            <span>Daftar doa</span>
            <strong>Pilih doa</strong>
            <small>Lihat semua doa</small>
            <LearningIcon className="starter-card-arrow" name="arrowRight" />
          </Link>
          <Link className="starter-card starter-card-memorize" to="/hafalan">
            <span className="starter-card-icon"><LearningIcon name="steps" /></span>
            <span>Hafalan</span>
            <strong>Ikuti langkah</strong>
            <small>Mulai dari doa sehari-hari</small>
            <LearningIcon className="starter-card-arrow" name="arrowRight" />
          </Link>
          <Link className="starter-card starter-card-review" to="/murajaah">
            <span className="starter-card-icon"><LearningIcon name="repeat" /></span>
            <span>Ulangi</span>
            <strong>{summary.dueToday > 0 ? `${summary.dueToday} siap diulang` : "Ingat lagi"}</strong>
            <small>Ucapkan doa yang sudah dipelajari</small>
            <LearningIcon className="starter-card-arrow" name="arrowRight" />
          </Link>
        </div>
      </section>
    </article>
  );
}
