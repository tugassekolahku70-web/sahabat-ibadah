# Sahabat Ibadah — Standalone Source Package

Paket ini berisi source code frontend Sahabat Ibadah, asset gambar lokal, referensi desain, dan PRD. Paket telah diubah agar gambar tidak bergantung pada Manus Storage sehingga dapat diedit dan dijalankan secara mandiri.

## Isi paket

- `client/`: aplikasi React + Vite + Tailwind.
- `client/src/`: source code halaman, komponen, context, dan styling.
- `client/public/assets/`: ilustrasi lokal yang dipakai aplikasi.
- `references/provided-designs/`: seluruh gambar referensi yang diberikan.
- `Sahabat-Ibadah-PRD.md`: product requirements document untuk pengembangan backend dan database.
- `package.json` dan `pnpm-lock.yaml`: dependency dan lockfile.

## Prasyarat

- Node.js 20+ atau 22+.
- pnpm 10+ atau package manager yang kompatibel.

## Menjalankan proyek

```bash
pnpm install
pnpm run dev
```

Buka URL yang ditampilkan Vite. Untuk validasi typecheck dan build produksi:

```bash
pnpm exec tsc --noEmit
pnpm run build
```

## Struktur alur aplikasi

1. Beranda publik.
2. Pemilihan peran Orang Tua atau Guru.
3. Form login frontend.
4. Dashboard sesuai peran.

Saat ini autentikasi dan penyimpanan masih berada pada level frontend. Gunakan `Sahabat-Ibadah-PRD.md` sebagai acuan untuk menggantinya dengan database, backend API, autentikasi, dan kontrol akses produksi.

## Catatan editing

- Konten halaman utama berada di `client/src/pages/Home.tsx`.
- Design system dan responsive CSS berada di `client/src/index.css`.
- Asset lokal dapat diganti di `client/public/assets/`.
- Jangan menghapus `pnpm-lock.yaml` jika ingin menjaga versi dependency tetap konsisten.
