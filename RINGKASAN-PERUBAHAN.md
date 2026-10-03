# Ringkasan Perubahan

## FITUR BARU: Mode Gelap & Terang

Semua token warna (`shihu-bg`, `shihu-card`, `shihu-border`, `shihu-text`,
`shihu-corona`, dst — yang dipakai di HAMPIR SEMUA komponen, baik halaman
customer, admin, maupun worker) sekarang berbasis CSS variable, bukan hex
statis lagi. Satu toggle otomatis mengubah tampilan di SELURUH situs
sekaligus (customer + admin + worker), karena semuanya pakai sistem token
yang sama.

### Cara kerja
- `tailwind.config.ts`: tiap token `shihu.*` sekarang menunjuk ke
  `rgb(var(--shihu-xxx) / <alpha-value>)` alih-alih hex langsung — supaya
  modifier opacity yang sudah dipakai di banyak tempat (`bg-shihu-corona/10`,
  dst) tetap berfungsi normal.
- `app/globals.css`: nilai variable didefinisikan 2x — `:root` untuk mode
  gelap (default, sama persis seperti tampilan sebelumnya), dan
  `[data-theme="light"]` untuk override ke versi terang.
- `app/layout.tsx`: ada script kecil di `<head>` yang jalan SEBELUM React
  hydrate, baca preferensi dari `localStorage` (atau `prefers-color-scheme`
  sistem kalau belum pernah di-set), lalu pasang `data-theme` di `<html>` —
  ini mencegah "flash" tema salah sekilas pas reload halaman.
- `components/ui/ThemeToggle.tsx`: tombol toggle (ikon matahari/bulan),
  nyimpen pilihan ke `localStorage` key `shihu-theme`.
- Dipasang di 3 tempat: `Navbar.tsx` (customer), sidebar + mobile header
  admin (`app/admin/(protected)/layout.tsx`), dan header worker
  (`app/worker/(protected)/layout.tsx`).

### Keputusan desain yang perlu kamu tahu
- **Warna aksen `corona`/`coronaTo`/`violet` sedikit digelapkan** di mode
  terang (dari `#4D9CFF` jadi `#1B6FE3`, dst) — supaya tetap cukup kontras
  dipakai sebagai warna teks/link di atas background putih (biru terang
  aslinya kebacanya samar di atas putih, meski bagus di atas navy gelap).
- **Warna per-game** (`game.genshin/wuwa/neverness`) sengaja TIDAK berubah
  antar tema — dipakai cuma sebagai dot/badge kecil, bukan teks besar.
- **Banner hero di homepage** (`.hero-character`) sengaja TETAP gelap di
  kedua tema — gambar karakternya sendiri sudah dirancang dengan gradasi
  gelap di tepinya biar menyatu ke background gelap; kalau overlay-nya ikut
  jadi terang, hasilnya malah terlihat patah/tidak nyambung sama gambarnya.
  Ini jadi semacam "pulau gelap" yang konsisten di kedua tema — pola yang
  umum dipakai banyak situs untuk mempertahankan band hero/branding.
- Tombol CTA utama (`bg-corona`, gradient biru) dan top-bar loading juga
  sengaja tetap statis di kedua tema, karena sudah "mandiri" (py sendiri
  teks kontrasnya sendiri, tidak bergantung warna halaman di sekitarnya).

### Testing yang disarankan
Karena saya tidak punya `node_modules`/browser untuk screenshot langsung,
tolong cek manual setelah `npm run dev`:
1. Klik toggle di navbar customer, admin, dan worker — pastikan semuanya
   switch barengan (karena 1 sistem variable global).
2. Reload halaman setelah pilih mode terang — pastikan TIDAK ada flash
   balik ke gelap sebelum "loncat" ke terang.
3. Cek beberapa halaman dengan banyak teks `shihu-faint`/`shihu-muted` di
   mode terang — kalau ada yang terasa kurang kontras di kasus tertentu,
   kasih tahu, gampang disesuaikan lagi nilai variable-nya di
   `app/globals.css`.

---


Cara pakai: timpa file-file ini ke lokasi yang sama persis di project asli kamu
(struktur foldernya sudah sama persis dengan project), lalu jalankan
`npx prisma generate` (jika perlu) dan `npm run build` / `npm run dev` untuk
memastikan semuanya jalan normal di environment kamu (di sini saya tidak
punya `node_modules`/`package.json`-nya jadi tidak bisa full build, tapi
sudah saya cek sintaksnya dengan `tsc` standalone dan aman).

---

## 0. FITUR BARU: Progress Paket Joki sekarang per-item (BUTUH MIGRASI DB)

**Masalah sebelumnya:** saat customer beli Paket Joki, order cuma menyimpan
SATU baris (OrderLine) untuk seluruh paket. Di layar update progress admin/
worker, tiap item isi paket TERLIHAT punya panel sendiri-sendiri, tapi semua
panel itu diam-diam menyimpan datanya ke SATU baris yang sama -- jadi semua
update/screenshot/persen/status "selesai" tercampur antar item.

**Perbaikan:** sekarang saat order dibuat, Paket Joki dipecah jadi BANYAK
OrderLine (satu per Joki Item isi paket), masing-masing punya riwayat
update, persen, dan status selesai SENDIRI-SENDIRI. Semua baris ini tetap
dikelompokkan jadi SATU tab "Paket X" di layar progress (baik admin, worker,
maupun tampilan read-only customer), lewat kolom baru `paketGroupId`.

### ⚠️ WAJIB: jalankan migrasi Prisma

```bash
npx prisma migrate dev --name add_paket_group_id
```

Ini menambah 1 kolom nullable (`paketGroupId`) ke tabel `OrderLine` -- aman,
tidak menghapus/mengubah data yang sudah ada.

### Yang perlu kamu tahu

- **Cuma berlaku untuk order BARU** setelah migrasi ini. Order lama yang
  paketnya sudah kesimpen sebagai 1 baris gabungan TIDAK otomatis kepecah --
  progress yang sudah ada sebelumnya tetap seperti semula, tidak hilang.
  Kalau kamu mau order lama juga dimigrasikan, itu perlu skrip migrasi data
  terpisah (belum dibuat -- tinggal bilang kalau perlu).
- **Harga per item di dalam paket TIDAK ditampilkan** di mana pun (sesuai
  yang kita sepakati) -- Paket tetap dijual 1 harga borongan, cuma sekarang
  breakdown "bagian dari Paket X" muncul di daftar order (tanpa harga per
  item) di `OrderRowItem.tsx`.
- **Item Material di dalam Paket** belum punya target kuantitas (skema
  `JokiPaketItem` memang tidak menyimpan itu) -- progress-nya tetap bisa
  diisi (hitungan naik), cuma belum ada bar persen berbasis target. Kalau
  mau ditambah, perlu 1 kolom baru lagi di `JokiPaketItem` + form isinya di
  admin saat membuat/edit Paket -- belum saya kerjakan karena di luar
  lingkup permintaan awal.
- **Item Rawat Akun di dalam Paket** (kalau ada) otomatis dapat kalender
  Rawat Akun sendiri, dihitung dari `durationDays` Joki Item tsb (mulai hari
  order dibuat) -- sebelumnya ini tidak pernah dihitung sama sekali karena
  paket selalu dianggap 1 baris generik.

### File yang berubah untuk fitur ini
- `prisma/schema.prisma` -- kolom baru `paketGroupId` di `OrderLine`.
- `lib/actions/order.ts` -- logika pembuatan order: paket dipecah per item.
- `lib/order-progress-grouping.ts` -- helper baru `groupPaketPurchases()` &
  `groupPaketItemsByCategory()`, menggantikan `getPaketLines()` yang lama.
- `lib/order-display.ts` -- `buildOrderTitle()` diperbaiki supaya order
  paket tetap tampil sebagai "Paket X" (bukan daftar tiap item isinya).
- `components/admin/OrderProgressTabs.tsx` -- panel admin/worker, disusun
  ulang total: tiap item paket sekarang render dari OrderLine asli.
- `components/CustomerAccountTabs.tsx` -- versi read-only customer, sama.
- `components/admin/OrderRowItem.tsx` -- breakdown baris order tidak lagi
  menampilkan harga individual untuk item di dalam paket.
- `app/admin/(protected)/progress/[orderId]/page.tsx`,
  `app/worker/(protected)/orders/[orderId]/page.tsx`,
  `app/progress/[slug]/page.tsx` -- query disederhanakan, tidak perlu lagi
  menarik isi paket secara nested untuk breakdown buatan sendiri.

---

## 1. Fix bug "Item tidak dikenal"

**Penyebab:** beberapa query Prisma tidak meng-*include*/select relasi
`endgameContent` (dan sebagian juga `patchEvent`) pada baris order, padahal
fallback judul butuh itu.

- `app/history/page.tsx` — tambah `endgameContent: true` ke include query,
  dan pindahkan logic pembangun detail baris ke helper bersama.
- `app/progress/[slug]/page.tsx` — query `oldCompletedOrders` sekarang ikut
  select `patchEvent` & `endgameContent`.
- **BARU:** `lib/order-line-detail.ts` — helper `buildOrderLineDetails()`
  yang dipakai bersama oleh kedua halaman di atas, supaya perilaku "Lihat
  Detail" konsisten dan tidak ada duplikasi logic.

## 2. Tombol "Lihat Detail" di history customer

- `app/progress/[slug]/page.tsx`:
  - Order yang baru selesai (≤7 hari, sudah punya data nested lengkap)
    sekarang dapat tombol **"Lihat Detail"** persis seperti di `/history`.
  - Order lama tetap ringkas (title-only) — ini keputusan sadar supaya
    tidak mengulang masalah performa yang sebelumnya sudah sengaja
    dioptimasi developer sebelumnya (ada komentar soal itu di kode asli).
    Kalau kamu mau full detail juga untuk order lama, tinggal bilang —
    tinggal extend query `oldCompletedOrders` supaya sama seperti
    `recentCompletedOrders`.
  - Manual history entries (`jokiHistoryEntry`) yang tadinya pakai
    `HistoryRow` polos (tanpa detail apapun) diganti jadi
    `JokiHistoryPublicRow` — sekarang punya toggle detail note+screenshot
    juga, sama seperti di `/history`.

## 3. Loading spinner di setiap proses

Pattern yang dipakai konsisten dengan yang sudah ada di codebase kamu:
`useTransition` dari React + atribut `aria-busy` (CSS spinner-nya sudah
otomatis muncul lewat aturan `button[aria-busy="true"]::before` di
`globals.css` kamu — tidak perlu ubah CSS apapun).

Sebelumnya, HAMPIR SEMUA tombol "Hapus" di admin panel (dan beberapa
"Simpan") tidak punya indikator loading sama sekali — langsung memanggil
server action tanpa disable/spinner apapun. Sudah diperbaiki di:

**Row item admin (Simpan + Hapus):**
- `CustomerRowItem.tsx`
- `GameRowItem.tsx`
- `GameRegionRowItem.tsx`
- `JokiCategoryRowItem.tsx`
- `QuestTypeRowItem.tsx`
- `TestimonialRowItem.tsx`
- `OrderRowItem.tsx` (+ dropdown assign worker ke order)

**Row item admin (cuma tombol Hapus, karena Simpan sudah punya pending
sebelumnya lewat `useActionState`):**
- `EndgameContentRowItem.tsx`
- `JokiItemRowItem.tsx`
- `JokiPaketRowItem.tsx`
- `PatchEventRowItem.tsx`
- `PatchRowItem.tsx`
- `WorkerRowItem.tsx`
- `JokiHistoryRowItem.tsx`

**Panel progress (dipakai worker & admin untuk update progress order):**
- `ExplorationProgressPanel.tsx`
- `CountProgressPanel.tsx`
- `OrderLineProgressPanel.tsx` (termasuk tombol hapus per-riwayat update,
  sekarang jadi komponen kecil `UpdateDeleteButton` supaya tiap baris
  punya status loading sendiri-sendiri, tidak saling mengunci)
- `OrderProgressTabs.tsx` (tombol "Tandai selesai" / "Batalkan selesai")

**Sudah dicek dan TIDAK perlu diubah** (loading sudah ada / sudah tercover):
- Halaman login admin & worker
- `JokiHistoryTestimonialForm.tsx`, `TestimonialPrompt.tsx`
- Semua `CreateXxxForm.tsx` (form tambah data baru)
- `RawatAkunProgressPanel.tsx`
- Loading level-halaman (`app/loading.tsx`,
  `app/admin/(protected)/loading.tsx`, `app/worker/(protected)/loading.tsx`)
  sudah pakai `PageLoader`, dan top progress bar (`NavigationProgress`)
  sudah ter-mount di root layout — ini semua sudah jalan otomatis tiap
  pindah halaman, tidak perlu diapa-apakan lagi.

## Catatan verifikasi

Karena zip yang di-upload tidak menyertakan `package.json`/`node_modules`,
saya tidak bisa menjalankan `next build` penuh. Sebagai gantinya saya
jalankan `tsc` standalone per file yang saya ubah untuk memastikan tidak
ada syntax error — semuanya lolos. Tetap disarankan jalankan
`npm run build` di environment kamu sendiri sebelum deploy, untuk
menangkap error tipe (kalau ada) yang tidak bisa saya deteksi tanpa
`node_modules` project asli.
