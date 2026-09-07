# Shihu Service

Website joki game untuk **Genshin Impact**, **Wuthering Waves**, dan **Neverness to Everness**. Dibangun dengan Next.js (App Router) + Prisma + PostgreSQL, siap di-hosting gratis di Vercel dengan database dari Neon.

## Fitur

**Tampilan customer**
- Beranda dengan banner tiap game
- List joki (paket layanan) dengan filter per game
- Antrian joki real-time (papan publik, ringkas: status + persen saja, tanpa detail item atau harga)
- History joki yang sudah selesai
- Testimoni customer
- **Halaman progress per Customer** (`/progress/[slug]`, publik tanpa login) — link personal yang bisa dikirim ke tiap customer, menampilkan nama, tab per akun/order yang sedang berjalan lengkap dengan detail progres per item dan riwayat update, serta history pesanan selesai

**Panel admin** (`/admin`, dilindungi password)
- Dashboard ringkasan
- **Data master** (pondasi Joki Item):
  - Game — data 3 game yang tersedia
  - Kategori joki — per game, dengan toggle "wajib Region", "wajib Jenis Quest", "Rawat Akun", dan "Material"
  - Region — wilayah/map per game
  - Jenis quest — per game, dengan toggle "spesifik region tertentu" dan klasifikasi jenis (World Quest / Archon Quest / Lainnya)
  - Patch — nomor/nama patch per game dengan rentang tanggal, beserta Event di dalamnya (rentang tanggal + harga sendiri)
  - Konten endgame — konten yang dikerjakan berulang sesuai siklus reset (Harian, 1/2/3 minggu, 1 bulan, atau 1 patch)
- **Operasional**:
  - Customer — data pemesan dan riwayat seluruh order miliknya (bisa lintas akun/game), beserta link halaman progress publiknya
  - Joki item — layanan yang tampil ke customer, dengan form dinamis: field Region/Jenis Quest/pengaturan Rawat Akun muncul otomatis sesuai kategori; kategori Quest menampilkan input Act (default 1); kategori Material menampilkan harga per jumlah (mis. Rp 10.000 / 100)
  - Paket joki — kumpulan beberapa Joki Item dijual satu harga, dengan opsi Region + All Map Region untuk menyertakan Eksplorasi/World Quest/Archon Quest sekaligus
  - Pesanan — order dibuat oleh admin (belum ada order mandiri dari customer), form multi-akun: isi data customer sekali, lalu tab per akun (bisa beda game per akun) yang masing-masing menghasilkan Order terpisah dengan harga otomatis terhitung per kategori (lihat "Customer & Order" di bawah); update status & progress, tandai selesai (otomatis masuk history)
  - **Update progress per item** (`/admin/progress/[orderId]`) — tab per item dalam satu order (langsung tampil tanpa tab kalau cuma 1 item), form tambah catatan + link screenshot bukti + lokasi reset harian (lihat "Update progress" di bawah)
  - Testimoni (tambah/edit/sembunyikan/hapus)

## Stack

- **Next.js 15** (App Router, Server Actions, Server Components)
- **TypeScript**
- **Tailwind CSS 3**
- **Prisma ORM 5** → **PostgreSQL** (didesain untuk [Neon](https://neon.tech), tapi provider Postgres lain juga bisa)
- Auth admin sederhana berbasis cookie + middleware (tanpa library eksternal)

## Setup lokal

### 1. Install dependencies

```bash
npm install
```

### 2. Buat database di Neon

1. Daftar/masuk ke [neon.tech](https://neon.tech) (gratis)
2. Buat project baru → buat database
3. Dari dashboard Neon, salin **dua** connection string:
   - **Pooled connection** (biasanya ada `-pooler` di hostname) → untuk `DATABASE_URL`
   - **Direct connection** (tanpa `-pooler`) → untuk `DIRECT_URL`

### 3. Buat file `.env`

Salin `.env.example` menjadi `.env`, lalu isi:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/<dbname>?sslmode=require"
ADMIN_PASSWORD="ganti-dengan-password-kuat"
```

### 4. Push schema ke database & isi data awal

```bash
npm run db:push
npm run db:seed
```

`db:push` membuat semua tabel sesuai `prisma/schema.prisma`. `db:seed` mengisi data awal: 3 game, 8 paket joki, beberapa pesanan contoh (antrian & history), dan testimoni.

### 5. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk tampilan customer, dan [http://localhost:3000/admin](http://localhost:3000/admin) untuk panel admin (login dengan `ADMIN_PASSWORD` yang sudah diisi di `.env`).

## Deploy ke Vercel (gratis)

1. Push project ini ke repository GitHub/GitLab/Bitbucket
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repository tadi
3. Di step **Environment Variables**, tambahkan tiga variabel yang sama seperti di `.env`:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `ADMIN_PASSWORD`
4. Klik **Deploy**

Vercel otomatis menjalankan `npm install` (yang men-trigger `prisma generate` lewat script `postinstall`) lalu `npm run build` (yang juga menjalankan `prisma generate` sebagai jaga-jaga). Schema database **tidak** otomatis ter-push saat deploy — jalankan `npm run db:push` dan `npm run db:seed` sekali dari komputer lokal (dengan `.env` yang menunjuk ke database Neon yang sama) sebelum atau setelah deploy pertama.

Setelah deploy selesai, situs bisa diakses di domain `*.vercel.app` yang diberikan Vercel (atau domain custom jika sudah dihubungkan).

## Struktur data master → Joki Item

Joki Item dibangun di atas 4 tabel pondasi, harus diisi berurutan:

1. **Game** (wajib) — 3 game yang tersedia
2. **Kategori joki** (wajib) — dibuat per game (mis. "Push Rank", "Eksplorasi", "Quest"). Setiap kategori punya dua toggle independen yang diatur manual oleh admin:
   - **Wajib Region** — aktifkan jika kategori ini selalu terikat ke satu wilayah (mis. kategori Eksplorasi)
   - **Wajib Jenis Quest** — aktifkan jika kategori ini selalu terikat ke satu jenis quest (mis. kategori Quest)
3. **Region** — wilayah per game (mis. Mondstadt, Liyue), hanya relevan untuk kategori yang mengaktifkan "Wajib Region"
4. **Jenis quest** — jenis quest per game (mis. Archon Quest, World Quest), hanya relevan untuk kategori yang mengaktifkan "Wajib Jenis Quest". Setiap jenis quest punya toggle **"Spesifik ke region tertentu"** — jika aktif, Joki Item dengan jenis quest tersebut wajib juga mengisi Region meski kategorinya sendiri tidak mewajibkan Region secara langsung.

Saat membuat **Joki Item** di `/admin/joki`, form akan otomatis menyesuaikan: field Jenis Quest hanya muncul kalau kategori terpilih mewajibkannya, dan field Region muncul kalau kategori mewajibkannya secara langsung ATAU jenis quest yang dipilih bertanda spesifik-region. Validasi ini juga dijalankan ulang di server (`lib/joki-rules.ts`) supaya tidak bisa dilewati dari luar form.

## Patch, Event, dan Konten Endgame

Tiga tabel ini independen dari 4 tabel pondasi di atas, tapi saling terhubung lewat waktu:

**Patch** (`/admin/patch`) — data patch/update besar per game, dengan tanggal mulai dan selesai. Di dalam satu Patch, admin bisa menambahkan **Event** (nama, deskripsi, harga, tanggal mulai & selesai sendiri).

- Event **otomatis tampil** ke customer di `/joki` (badge "Event") begitu tanggal mulainya tiba, dan **otomatis hilang** begitu tanggal selesainya lewat. Tidak ada toggle manual — statusnya selalu dihitung ulang dari tanggal saat ini vs `startDate`/`endDate` (`lib/patch-schedule.ts`).

**Konten endgame** (`/admin/endgame`) — konten yang dikerjakan berulang, sengaja dipisah dari Patch supaya siklusnya fleksibel:
- Siklus **1/2/3 minggu** atau **1 bulan**: admin set satu tanggal mulai awal ("anchor"), lalu sistem otomatis menghitung ulang periode reset berikutnya kelipatan periode tersebut — admin tidak perlu input manual tiap siklus baru.
- Siklus **1 patch**: admin set "mulai berapa hari setelah patch berganti" (mis. 3 hari). Tanggal selesainya otomatis mengikuti tanggal selesai Patch yang sedang berjalan saat ini. Logika perhitungan ada di `lib/endgame-schedule.ts`.

## Joki Item kategori Rawat Akun

Kategori dengan toggle **"Kategori Rawat Akun"** aktif (diatur di `/admin/kategori`) memunculkan pengaturan tambahan saat membuat Joki Item di kategori tersebut:

- **Include event** — toggle; jika aktif, paket rawat akun ini otomatis dianggap mencakup event yang sedang berjalan di patch aktif.
- **Rawat akun 1 patch** — toggle; jika aktif, Joki Item ini terikat ke satu **Patch** tertentu secara utuh (bukan ke konten endgame spesifik):
  - **Tampil** ke customer sejak Patch tersebut **dibuat** di `/admin/patch` — bukan sejak patch itu mulai berjalan. Ini sengaja, supaya rawat akun untuk patch berikutnya sudah bisa mulai dipesan sebelum patch itu berjalan, walau patch yang sedang aktif belum selesai.
  - **Hilang** begitu **H+1 setelah `Patch.startDate`** terlewati.
  - Logika ini ada di `isPatchWideRawatAkunLive()` (`lib/patch-schedule.ts`).
- Jika **bukan** rawat akun 1-patch, admin memilih satu atau lebih **Konten endgame** spesifik yang tercakup dalam paket tersebut (multi-select).

## Joki Item kategori Quest — field Act

Setiap Joki Item dengan kategori yang mewajibkan Jenis Quest (`requiresQuestType = true`) otomatis menampilkan input **Act**, default `1`. Berlaku untuk semua kategori Quest di semua game, tidak perlu toggle tambahan.

## Joki Item kategori Material

Kategori dengan toggle **"Kategori Material"** aktif (diatur di `/admin/kategori`) mengubah field harga Joki Item menjadi dua input: **harga** dan **jumlah**, mis. Rp 10.000 untuk 100 material. Ditampilkan ke customer sebagai `Rp 10.000 / 100`.

## Paket Joki

Paket joki (`/admin/paket`) adalah kumpulan beberapa Joki Item dijual sebagai satu paket dengan satu harga.

- **Harga**: default terisi otomatis dari total harga item yang dipilih (dihitung ulang tiap kali pilihan berubah), tapi selalu bisa ditimpa manual — mengetik di field harga langsung menghentikan auto-fill untuk sesi form itu.
- **Region** (opsional, satu paket = satu region): mengisi Region berarti paket ini juga mencakup layanan Eksplorasi untuk region tersebut, dan memunculkan toggle **All Map Region**.
  - **All Map ON** → seluruh Joki Item kategori Eksplorasi dan seluruh World Quest region tersebut otomatis tercakup (World Quest ikut terkunci ON, tidak bisa dimatikan manual selama All Map aktif). Archon Quest **tetap dipilih manual** meski All Map aktif.
  - **All Map OFF** → admin memilih manual mana saja Joki Item Eksplorasi, World Quest, dan Archon Quest (semuanya sudah difilter hanya menampilkan item yang region-nya cocok) yang masuk ke paket.
- World Quest dan Archon Quest yang bisa dipilih adalah Joki Item kategori Quest yang sudah ada, disaring lewat field `QuestType.questKind` (diatur di `/admin/quest`) — pastikan Jenis Quest yang relevan sudah diberi label "World Quest" atau "Archon Quest" di sana supaya muncul sebagai pilihan di form Paket.
- Data item yang termasuk paket selalu tersimpan utuh di database (baik saat All Map on maupun off), sehingga halaman customer tidak perlu menghitung ulang apa saja isi paket setiap saat.

## Customer & Order

Order (`/admin/antrian`) saat ini **hanya dibuat oleh admin** — belum ada alur order mandiri dari customer di halaman publik.

**Customer** adalah entitas terpisah dari Order — satu Customer bisa punya banyak Order (lintas akun game dan lintas game sekaligus). Order tetap **independen per akun/game** (progress, status, dan harga masing-masing sendiri-sendiri) — Customer hanya wadah pengelompokan supaya riwayat semua order milik satu orang bisa dilihat dalam satu tempat di `/admin/customer`. **Total harga TIDAK digabung lintas Order** — setiap Order tetap satu unit transaksi/tagihan sendiri; yang digabung hanyalah tampilan riwayatnya.

### Form pembuatan order (multi-akun)

Form "Buat pesanan baru" di `/admin/antrian` punya dua bagian:

1. **Data customer** (diisi sekali) — pilih Customer yang sudah ada atau ketik nama baru (otomatis dibuat), tempat order (Discord/Instagram/TikTok/WhatsApp) beserta Username, dan **Jumlah akun yang di-joki**.
2. **Tab per akun** — jumlah tab menyesuaikan angka "jumlah akun" di atas. Tiap tab benar-benar independen: pilih Game sendiri (boleh beda game antar tab), Joki Item/Paket Joki sendiri, nama joki dan estimasi sendiri, dengan subtotal harga per tab. Total keseluruhan (jumlah semua tab) ditampilkan di bagian bawah form, murni sebagai info — bukan satu tagihan gabungan.

Saat disubmit, form ini membuat **satu Order terpisah per tab/akun**, semuanya terhubung ke Customer yang sama, dalam satu transaksi database (kalau salah satu akun gagal disimpan, semuanya dibatalkan — tidak ada Order yang tersimpan setengah-setengah).

### Perhitungan harga per baris

Setiap baris Joki Item dalam satu akun menampilkan input tambahan tergantung kategorinya, dan harga tiap baris dihitung otomatis dengan rumus berbeda per kategori (lihat `lib/order-pricing.ts`):

| Kategori | Input tambahan | Rumus harga |
|---|---|---|
| Eksplorasi | Persentase map yang **sudah dikerjakan sendiri** oleh customer (0-100) | `(100 - persentase) × harga Joki Item` — harga di Joki Item adalah harga **per 1%** progress, jadi semakin besar persentase yang sudah dikerjakan sendiri, semakin murah sisanya |
| Quest | Act mulai (default 1) dan Act selesai (default = `actNumber` Joki Item) | `(Act selesai - Act mulai + 1) × harga Joki Item` — harga per Act dikalikan jumlah Act yang dikerjakan |
| Material | Jumlah item yang dicari | `(harga Joki Item ÷ jumlah satuan di Joki Item) × jumlah yang diminta` — dihitung harga per 1 material dulu, baru dikalikan |
| Rawat Akun | Jumlah (mis. jumlah minggu/siklus rawat akun) | `jumlah × harga Joki Item` |
| Kategori lain (Push Rank, Daily Commission, dll) | — | Harga tetap apa adanya dari Joki Item |
| Paket Joki | — | Harga tetap apa adanya dari `JokiPaket.priceRupiah`, tidak ada input tambahan |

Total harga tiap Order = jumlah harga seluruh baris di dalamnya, **disimpan** di `Order.totalPrice` (bukan dihitung ulang setiap render), supaya nilai order tetap konsisten secara historis meski admin mengubah harga Joki Item/Paket di kemudian hari.

Field lain pada Order:
- **Estimasi pengerjaan** — teks bebas per akun (mis. "2-3 hari"), terpisah dari `etaLabel` Joki Item.
- **Tempat order** — platform asal order beserta **Username**; khusus WhatsApp ada field tambahan **Nomor WhatsApp** (wajib). Field ini melekat ke Customer/Order saat dibuat dan tidak diedit lewat form edit (kalau salah input, hapus dan buat ulang order-nya).

## Update progress per item

Setiap baris pesanan (`OrderLine`) punya riwayat update sendiri (`OrderLineUpdate`), diisi dari `/admin/progress/[orderId]` (tombol "Progress" di setiap baris `/admin/antrian`):

- Kalau pesanan punya **lebih dari satu item**, muncul tab per item — pilih tab, lalu isi update untuk item itu. Kalau cuma satu item, form langsung tampil tanpa tab.
- Tiap update punya field **catatan** (opsional, bebas), dan salah satu dari dua field berikut tergantung jenis item:
  - **Lokasi reset** (opsional) — untuk Joki Item Rawat Akun yang mencakup Konten Endgame bersiklus **Harian** (mis. "habiskan resin di Domain X + weekly boss Y"). Field ini muncul otomatis kalau `JokiCategory.isRawatAkun` dan salah satu `EndgameContent` yang dicakupnya `resetCycle = HARIAN` (lihat `lib/order-progress-rules.ts`).
  - **Link screenshot bukti** (opsional) — untuk item lainnya. Karena tidak ada storage provider terpasang, admin upload gambar manual ke layanan seperti imgur/postimages lalu tempel link-nya di sini.
- Update lama tidak bisa diedit, hanya ditambah baru atau dihapus — riwayatnya jadi log kronologis progres pengerjaan.
- Progress keseluruhan (`Order.progressPct`, angka % yang tampil di papan antrian) tetap diisi manual oleh admin secara terpisah (di form edit pesanan) — tidak dihitung otomatis dari jumlah update, supaya admin punya kendali penuh menilai seberapa jauh progres sebenarnya.

## Halaman progress publik per Customer

Setiap Customer otomatis dapat `publicSlug` unik saat dibuat (baik lewat `/admin/customer` maupun otomatis dari form pesanan), yang jadi URL `/progress/[slug]` — halaman ini bisa dibagikan langsung ke customer tanpa perlu login.

Isinya:
- Nama customer.
- **Tab per akun** untuk semua Order yang sedang berjalan (status Menunggu/Dikerjakan/Finishing) — tiap tab independen: game sendiri, progress ring sendiri, dan tab-lagi per item di dalamnya (kalau lebih dari satu) lengkap dengan seluruh riwayat update (catatan, lokasi reset, screenshot).
- **History** — daftar Order yang sudah Selesai milik customer itu.

Link ini idealnya dikirim manual oleh admin ke customer (mis. lewat WhatsApp/Discord) setelah order dibuat — belum ada notifikasi otomatis yang mengirimkannya.

## Menghapus data master

Menghapus Kategori/Region/Jenis Quest/Patch yang masih dipakai oleh Joki Item akan gagal karena constraint relasi database (`onDelete` sengaja tidak di-cascade untuk relasi ini, supaya data Joki Item tidak hilang atau rusak diam-diam). Nonaktifkan (`isActive = false`, atau untuk Patch: cukup biarkan saja) sebagai gantinya jika datanya masih dipakai.

## Struktur project

```
app/
  page.tsx                 → Beranda
  joki/page.tsx             → List joki (gabungan Joki Item + Event live + Rawat Akun 1-patch eligible)
  antrian/page.tsx          → Antrian joki (papan publik, ringkas)
  history/page.tsx          → History joki
  testimoni/page.tsx        → Testimoni
  progress/[slug]/page.tsx  → Halaman progress publik per Customer
  admin/
    (auth)/login/page.tsx    → Login admin
    (protected)/             → Semua halaman admin (dilindungi middleware)
      page.tsx                → Dashboard
      game/page.tsx            → Data master: Game
      kategori/page.tsx        → Data master: Kategori joki
      region/page.tsx          → Data master: Region
      quest/page.tsx           → Data master: Jenis quest
      patch/page.tsx           → Data master: Patch & Event
      endgame/page.tsx         → Data master: Konten endgame
      joki/page.tsx            → Operasional: Joki item
      paket/page.tsx           → Operasional: Paket joki
      customer/page.tsx        → Operasional: Customer
      antrian/page.tsx         → Operasional: Pesanan
      progress/[orderId]/page.tsx → Operasional: Update progress per item
      testimoni/page.tsx       → Operasional: Testimoni
components/                → Komponen UI shared (customer + admin)
components/admin/          → Form & baris tabel khusus admin (termasuk form dinamis Joki Item, Paket Joki, Order multi-akun, & update progress)
lib/
  prisma.ts                 → Prisma client singleton
  format.ts                 → Helper format rupiah & tanggal
  date-input.ts              → Helper format tanggal untuk input datetime-local
  customer-slug.ts            → Generator slug acak untuk URL publik /progress/[slug]
  joki-rules.ts              → Logika terpusat aturan wajib-isi Region/Jenis Quest
  patch-schedule.ts          → Logika tampil/hilang Event & Rawat Akun 1-patch
  endgame-schedule.ts        → Logika perhitungan siklus reset Konten Endgame
  paket-rules.ts              → Logika hitung harga & filter item Eksplorasi/World Quest/Archon Quest untuk Paket
  order-pricing.ts            → Logika hitung harga tiap baris Order per kategori (Eksplorasi/Quest/Material/Rawat Akun)
  order-display.ts            → Helper judul ringkas gabungan untuk Order dengan banyak baris
  order-progress-rules.ts     → Logika deteksi item Rawat Akun reset-harian untuk form update progress
  actions/                   → Server Actions (create/update/delete), termasuk customer.ts & order-progress.ts
prisma/
  schema.prisma              → Skema database
  seed.ts                    → Data awal
middleware.ts                → Proteksi route /admin (TIDAK memproteksi /progress/[slug], sengaja publik)
```

## Catatan pengembangan lanjutan

- Saat ini order/pesanan dibuat manual dari panel admin (belum ada form order publik dari sisi customer). Bisa ditambahkan halaman `/joki/[id]` dengan form order yang membuat `Order` baru berstatus `MENUNGGU`.
- Auth admin memakai satu password bersama (bukan multi-user). Untuk kebutuhan lebih dari satu admin dengan akun terpisah, pertimbangkan menambah tabel `AdminUser` + hashing password (mis. dengan `bcrypt`).
- Notifikasi customer (WhatsApp/email saat status pesanan berubah, atau saat link `/progress/[slug]` pertama kali dibuat) belum diimplementasikan — bisa ditambahkan di dalam `updateOrder` atau `createOrder` server action.
- Status tampil/hilang Event dan Rawat Akun 1-patch dihitung on-the-fly setiap halaman `/joki` diakses (lihat `revalidate = 60` di halaman itu) — tidak ada cron job atau scheduled task yang mengubah data di database, sehingga tidak perlu infrastruktur tambahan di Vercel untuk fitur ini.
- Screenshot bukti progress saat ini berupa **link URL** yang ditempel manual oleh admin (lihat `.env.example`/README bagian "Update progress"), bukan upload file langsung — karena belum ada storage provider (Cloudinary/Vercel Blob/S3) yang dikonfigurasi. Kalau nanti mau upload file langsung dari form, field `screenshotUrl` di `OrderLineUpdate` sudah siap menampung URL hasil upload; tinggal ganti input teks jadi input file + endpoint upload ke storage provider pilihan.
- Halaman `/progress/[slug]` di-set `revalidate = 0` (selalu fresh, tidak di-cache) karena datanya berubah tiap admin menambah update — cocok untuk kebutuhan sekarang, tapi kalau traffic-nya besar di kemudian hari, pertimbangkan revalidate singkat (mis. 10-15 detik) untuk mengurangi beban database.
