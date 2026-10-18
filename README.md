# Void AI Vusion

Chat, gambar, musik, dan pembuat app dalam satu web bergaya Gen Z.

## Struktur
| Bagian | Teknologi |
|---|---|
| `index.html`, `css/`, `js/` | Frontend (HTML, CSS, JavaScript) |
| `server/` | Backend proxy (Node.js + Express) agar API key aman |
| `.github/workflows/pages.yml` | Deploy otomatis ke GitHub Pages (YAML) |

## Jalankan lokal
Frontend: buka `index.html`, atau `npx serve .`

Backend (opsional):
```bash
cd server
cp .env.example .env   # isi AI_API_KEY
npm install
npm start
```
Lalu isi `apiBase` di `js/config.js` dengan `http://localhost:3000`.

## Deploy
1. Push ke GitHub (branch `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Deploy backend `server/` ke Render/Railway/Fly (root directory: `server`, start command: `npm start`, isi env dari `.env.example`).
4. Isi `apiBase` di `js/config.js` dengan URL backend, lalu push lagi.

Jangan pernah commit file `.env`.
