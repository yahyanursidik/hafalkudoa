import { Link } from "react-router-dom";
import { Brand } from "./brand.js";
import { featuredDua } from "../content/featured-dua.js";
import "../styles/home.css";

export function HomePage() {
  return (
    <article className="home-path">
      <section className="home-hero" aria-labelledby="landing-title">
        <Brand className="home-brand" />
        <p className="home-greeting">Assalamu’alaikum</p>
        <h1 id="landing-title">Satu doa<br />hari ini.</h1>
        <p className="home-lede">Pilih satu doa kecil, baca bersama, lalu ulangi lagi saat ada kesempatan.</p>
        <Link className="home-hero-link" to="/hafalan">Mulai hafalan <span aria-hidden="true">→</span></Link>
      </section>

      <section className="home-feature" aria-labelledby="featured-dua-title">
        <header>
          <p className="landing-kicker">Pilihan untuk hari ini</p>
          <h2 id="featured-dua-title">Mulai dari yang dekat.</h2>
          <p>Arab selalu ada. Latin dan arti bisa dipakai saat butuh bantuan membaca.</p>
        </header>
        <article className="feature-card">
          <div>
            <p>{featuredDua.group}</p>
            <h3>{featuredDua.title}</h3>
            <span>Arab · Latin · Arti</span>
          </div>
          <Link to="/hafalan">Buka doa ini <span aria-hidden="true">→</span></Link>
        </article>
      </section>

      <section className="home-start" aria-labelledby="home-start-title">
        <header>
          <h2 id="home-start-title">Pilih kegiatanmu.</h2>
          <p>Tiga cara sederhana untuk belajar sesuai kebutuhan hari ini.</p>
        </header>
        <div className="starter-grid">
          <Link className="starter-card starter-card-library" to="/doa">
            <span>Koleksi doa</span>
            <strong>Cari doa</strong>
            <small>Buka daftar lengkap</small>
            <i aria-hidden="true">→</i>
          </Link>
          <Link className="starter-card starter-card-memorize" to="/hafalan">
            <span>Hafalan</span>
            <strong>Ikuti langkah</strong>
            <small>Mulai dari yang sering dipakai</small>
            <i aria-hidden="true">→</i>
          </Link>
          <Link className="starter-card starter-card-review" to="/murajaah">
            <span>Murajaah</span>
            <strong>Ulangi hafalan</strong>
            <small>Jaga doa tetap ingat</small>
            <i aria-hidden="true">→</i>
          </Link>
        </div>
      </section>
    </article>
  );
}
