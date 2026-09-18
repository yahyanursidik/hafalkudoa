import { Link } from "react-router-dom";
import { Brand } from "./brand.js";
import { LearningIcon } from "./learning-icon.js";
import { featuredDua } from "../content/featured-dua.js";
import "../styles/home.css";

export function HomePage() {
  return (
    <article className="home-path">
      <section className="home-hero" aria-labelledby="landing-title">
        <Brand className="home-brand" />
        <p className="home-greeting">Assalamu’alaikum</p>
        <h1 id="landing-title">Satu doa<br />hari ini.</h1>
        <p className="home-lede">Pilih satu doa, baca bersama Ayah, Bunda, atau guru, lalu ulangi pelan-pelan.</p>
        <Link className="home-hero-link" to="/hafalan"><LearningIcon name="steps" /><span>Ayo mulai</span><LearningIcon name="arrowRight" /></Link>
      </section>

      <section className="home-feature" aria-labelledby="featured-dua-title">
        <header>
          <p className="landing-kicker">Pilihan untuk hari ini</p>
          <h2 id="featured-dua-title">Doa pertama untuk hari ini.</h2>
          <p>Teks Arab selalu ada. Nyalakan Latin atau arti saat perlu bantuan membaca.</p>
        </header>
        <article className="feature-card">
          <div className="feature-card-copy">
            <span className="feature-card-icon"><LearningIcon name="book" /></span>
            <p>{featuredDua.group}</p>
            <h3>{featuredDua.title}</h3>
            <span>Arab · Latin · Arti</span>
          </div>
          <Link to="/hafalan"><span>Belajar doa ini</span><LearningIcon name="arrowRight" /></Link>
        </article>
      </section>

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
            <strong>Ingat lagi</strong>
            <small>Ucapkan doa yang sudah dipelajari</small>
            <LearningIcon className="starter-card-arrow" name="arrowRight" />
          </Link>
        </div>
      </section>
    </article>
  );
}
