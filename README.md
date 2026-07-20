


https://github.com/user-attachments/assets/bd3ddc69-2d25-4730-b2d6-c2fce0c605cf

<div align="center">

# 📚 کتابخانه سه‌بعدی — 3D Interactive Book Reader

**A bilingual (Persian / English) web app with a 3D wooden bookshelf — pick up a leather-bound book, watch it open, and read it with realistic page-turning physics.**

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![Filament](https://img.shields.io/badge/Filament-v3-FDAE4B?logo=laravel&logoColor=white)](https://filamentphp.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r185-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)

</div>

---

## ✨ Features

- **3D bookshelf** — a two-row wooden bookcase holding up to 24 books, spines out like a real library. Cover colors are driven by genre.
- **Procedural book covers** — leather grain, embossed gold frames, decorative spine bands, and the title/author lettered in gold — all drawn at runtime onto canvas textures. No image assets.
- **Cinematic interactions** — the camera glides up to the shelf on load; hovering a book pulls it forward with a warm candle-glow and a floating info card; clicking dollies in, dims the room, and swings the cover open.
- **Realistic page physics** — pages bend as inextensible paper strips (arc-length-preserving curl, velocity lag on fast flips) with a dynamic soft shadow under the turning page. Drag to turn, or use arrow keys; blank filler pages riffle past automatically.
- **Text as texture** — the admin types page content in Filament; the reader lays it out (word-wrap, paragraph breaks, overflow guard) on an HTML canvas in the Vazirmatn typeface and maps it onto the 3D page as a `CanvasTexture`, cached in a bounded LRU with GPU disposal.
- **First-class RTL** — per-paragraph direction detection, so a Persian page with an English quotation renders both correctly. The UI mirrors where it should and nowhere it shouldn't.
- **Self-hosted fonts** — Vazirmatn variable font, split into Arabic/Latin subsets with `unicode-range` and `font-display: swap` (~80 KB total, zero third-party requests).
- **Book suggestions** — a public form (native `<dialog>`) with Laravel rate limiting (5/min per IP). No login required anywhere on the reader.
- **Admin panel** — full CRUD for genres, books, pages, and suggestions via Filament v3.

## 🏗 Architecture

```
book-blog/
├── backend/    Laravel 11 (API-only) + Filament v3 admin
│               MySQL · REST endpoints · rate limiting · CORS
└── frontend/   React 19 + Vite 8 + Three.js / react-three-fiber
                zustand state · axios API layer · canvas-texture pipeline
```

| Endpoint | Description |
|---|---|
| `GET /api/genres` | List genres with colors |
| `GET /api/books` | Published books, ordered by shelf position |
| `GET /api/books/{id}` | One book with its pages |
| `POST /api/suggestions` | Public book suggestion (throttled 5/min/IP) |

**Data model:** `Genre 1—n Book 1—n Page`. Pages have a `type` (`toc` / `blank` / `content`), a page number, and bilingual content fields. Everything an admin writes in Filament appears in the reader on next fetch — the text-to-texture pipeline re-renders automatically.

## 🚀 Getting Started

### Prerequisites

- PHP ≥ 8.2, Composer
- MySQL ≥ 8 (or MariaDB)
- Node.js ≥ 20, npm

### 1 · Backend

```bash
cd backend
composer install
cp .env.example .env          # then set your DB_* credentials
php artisan key:generate
php artisan migrate --seed    # creates schema + 5 sample books + admin user
php artisan serve             # → http://localhost:8000
```

The seeder creates a Filament admin at **`/admin`**:

```
email:    admin@example.com
password: password
```

> ⚠️ Change these credentials before deploying anywhere public.

### 2 · Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000/api
npm run dev                   # → http://localhost:5173
```

Open the URL Vite prints. If port 5173 is busy, Vite picks the next free port — any localhost port is allowed by the dev CORS config.

### Reading controls

| Action | Input |
|---|---|
| Open a book | Click it on the shelf |
| Turn page | Drag across the page, or `→` / `←` |
| Close book | `Esc` or the Close button |

## 📦 Deployment

**Frontend — GitHub Pages** (included workflow `.github/workflows/deploy-pages.yml`):
1. Enable *Settings → Pages → Source: GitHub Actions*
2. Add a repository **variable** `VITE_API_URL` pointing at your hosted API
3. Push to `main` — the workflow builds with the correct sub-path base automatically

**Frontend — Vercel** (included `frontend/vercel.json`): import the repo, set the root directory to `frontend/`, add the `VITE_API_URL` env var.

**Backend** — any PHP host (Laravel Forge, a VPS, shared hosting with PHP 8.2). After deploying, add your frontend origin to `FRONTEND_URLS` in the backend `.env` so CORS allows it:

```env
FRONTEND_URLS=https://your-username.github.io
```

## 🔧 Technical Highlights

<details>
<summary><b>Page-flip physics</b></summary>

Each page is modeled as an inextensible strip hinged at the spine. The bend angle along the page follows `φ(u) = φ₀ + b·u^1.7` — stiffer near the spine, loose at the free edge — and vertex positions come from midpoint integration of the angle field, so the paper's arc length is preserved exactly at every instant of the turn (paper never stretches). A velocity term makes the free edge trail during fast flips. The turning page casts a fake radial-gradient contact shadow that tracks its projected edge — no extra lights or shadow-map cost.
</details>

<details>
<summary><b>Text-to-texture pipeline</b></summary>

Admin-entered text is laid out on a 1024×1500 canvas: hard line breaks are respected, each paragraph independently detects its direction (so mixed Persian/English pages align both scripts correctly), long text truncates gracefully with an ellipsis instead of overflowing. The canvas becomes a `THREE.CanvasTexture` keyed by a content hash in an LRU cache (36 entries) that disposes GPU textures on eviction. Textures drawn before the webfont loads re-render themselves once `document.fonts` resolves.
</details>

<details>
<summary><b>Procedural covers</b></summary>

Covers and spines are generated per book from its title, author, and genre color: leather base with vignette and grain speckle, an embossed gold frame (shadow/highlight offset strokes), corner diamonds, a center emblem, and RTL-aware gold lettering. One texture per cover and spine, cached — the whole shelf renders in roughly 35 draw calls.
</details>

<details>
<summary><b>Performance</b></summary>

- Bundle split into `app` (7 kB gz) / `vendor` (73 kB gz) / `three` (242 kB gz) chunks — app code redeploys cheaply, Three.js stays cached
- Settled pages skip all vertex work; only an actively turning page deforms
- Single 1024² shadow map from one spotlight; procedural `RoomEnvironment` env-map (no runtime HDR download)
- `dpr` capped at 1.5; textures `anisotropy 8`; bounded texture cache
</details>

## 🗺 Roadmap

- [x] Laravel + Filament + seed data
- [x] REST API with rate limiting
- [x] 3D bookshelf, procedural covers, hover/open animations
- [x] Page-flip physics with dynamic shadow
- [x] Canvas-texture text rendering with RTL
- [x] Self-hosted subset fonts, full RTL/LTR UI
- [x] Deploy configs (GitHub Pages / Vercel)
- [ ] Sound design (page rustle, shelf thud)
- [ ] Bookmarks & reading progress (localStorage)
- [ ] More shelf rows / pagination for large libraries

## 📄 License

MIT — do whatever brings you joy, attribution appreciated.

---

<div align="center">
<i>Built with Laravel, React, and an unreasonable affection for old books.</i>
</div>
