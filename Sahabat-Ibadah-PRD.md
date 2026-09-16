# Product Requirements Document (PRD)

## Sahabat Ibadah

**Versi:** 1.0  
**Status:** Draft untuk penyelarasan produk dan engineering  
**Tanggal:** 14 September 2026  
**Pemilik produk:** Tim Sahabat Ibadah  
**Penulis:** Manus AI  

---

## 1. Ringkasan Eksekutif

Sahabat Ibadah adalah platform web yang membantu orang tua dan guru membangun, mencatat, serta memantau kebiasaan ibadah dan kebiasaan baik anak usia sekolah. Orang tua menjadi pihak yang mencatat aktivitas anak di rumah. Guru memantau perkembangan siswa dalam konteks kelas, memberikan apresiasi, dan berkomunikasi dengan orang tua jika diperlukan.

Produk ini dirancang sebagai ruang kolaborasi antara rumah dan sekolah. Fokusnya bukan sekadar mengumpulkan checklist, tetapi membantu anak membangun rutinitas melalui umpan balik yang positif, konsisten, dan mudah dipahami.

Versi frontend saat ini telah memiliki halaman beranda publik, halaman pemilihan peran, form login, dashboard orang tua, dashboard guru, checklist interaktif, ringkasan progres, laporan, pesan, dan pengaturan sebagai struktur pengalaman pengguna. PRD ini mendefinisikan kebutuhan produk yang diperlukan untuk mengubah frontend tersebut menjadi aplikasi produksi dengan autentikasi, database, backend API, notifikasi, pelaporan, dan kontrol akses yang benar.

> **Prinsip produk:** orang tua mencatat dengan cepat, guru memahami progres dengan jelas, dan anak menerima dukungan yang positif.

---

## 2. Latar Belakang dan Masalah

Kebiasaan ibadah anak di rumah sering kali tidak terlihat oleh sekolah. Sebaliknya, orang tua tidak selalu memperoleh gambaran yang jelas mengenai perkembangan kebiasaan anak secara konsisten. Komunikasi antara kedua pihak dapat tersebar di grup pesan, catatan manual, atau laporan berkala yang tidak terstruktur.

Masalah utama yang hendak diselesaikan adalah sebagai berikut.

| ID | Masalah | Dampak |
|---|---|---|
| P-01 | Orang tua sulit mencatat ibadah dan kebiasaan baik secara konsisten. | Catatan terlewat, data tidak lengkap, dan rutinitas sulit dievaluasi. |
| P-02 | Guru tidak memiliki ringkasan progres siswa yang terstruktur. | Guru terlambat mengetahui siswa yang memerlukan dukungan. |
| P-03 | Orang tua dan guru memiliki konteks yang terpisah. | Apresiasi, pengingat, dan tindak lanjut tidak selaras. |
| P-04 | Anak dapat merasa checklist sebagai bentuk pengawasan semata. | Motivasi internal dan rasa pencapaian tidak berkembang. |
| P-05 | Data kebiasaan anak termasuk data pribadi anak dan keluarga. | Dibutuhkan kontrol akses, audit, dan perlindungan data yang kuat. |

---

## 3. Tujuan Produk

### 3.1 Tujuan bisnis

1. Menyediakan satu platform kolaborasi rumah-sekolah untuk pemantauan kebiasaan ibadah anak.
2. Mengurangi ketergantungan pada pencatatan manual dan komunikasi yang tersebar.
3. Membantu sekolah membangun program pembiasaan yang terukur dan berkelanjutan.
4. Menyediakan data agregat yang membantu sekolah mengevaluasi program tanpa mengekspos data anak secara berlebihan.

### 3.2 Tujuan pengguna

| Persona | Hasil yang diharapkan |
|---|---|
| Orang tua | Dapat mengisi checklist harian dalam waktu singkat, melihat progres anak, dan menerima dukungan dari guru. |
| Guru | Dapat memantau progres kelas, menemukan siswa yang memerlukan perhatian, dan memberikan apresiasi atau pesan. |
| Anak | Mendapat pengalaman kebiasaan yang positif melalui target, streak, poin, dan apresiasi yang sesuai usia. |
| Admin sekolah | Dapat mengelola kelas, akun, daftar kebiasaan, periode pembiasaan, dan laporan sekolah. |
| Pengelola produk | Dapat menjaga keamanan, keandalan, auditabilitas, dan kualitas layanan. |

### 3.3 Sasaran terukur versi pertama

Target berikut berlaku setelah minimal satu bulan penggunaan aktif pada satu sekolah percontohan.

| Metrik | Target awal |
|---|---:|
| Orang tua yang menyelesaikan onboarding | ≥ 85% dari akun yang diundang |
| Orang tua aktif mingguan | ≥ 70% |
| Rata-rata checklist yang terisi per anak | ≥ 5 hari per minggu |
| Guru yang membuka dashboard mingguan | ≥ 90% |
| Waktu pengisian checklist harian | ≤ 2 menit untuk anak yang sudah terdaftar |
| Notifikasi pengingat yang menghasilkan pengisian | ≥ 20% dari notifikasi relevan |
| Error API kritis | 0 error yang menyebabkan kehilangan data |

---

## 4. Non-Goals

Hal berikut tidak termasuk dalam versi produksi pertama kecuali disetujui melalui perubahan scope.

1. Aplikasi mobile native iOS atau Android.
2. Penilaian kesalehan, diagnosis psikologis, atau pemberian sanksi kepada anak.
3. Verifikasi otomatis bahwa anak benar-benar melakukan ibadah.
4. Fitur pembayaran, marketplace, atau penggalangan dana.
5. Fitur percakapan publik antar keluarga.
6. Penggunaan AI untuk menilai ibadah anak atau membuat keputusan disipliner.
7. Integrasi perangkat wearable atau sensor rumah.
8. Penyimpanan foto/video anak sebagai kewajiban pengisian harian.

---

## 5. Prinsip Pengalaman dan Kebijakan Produk

### 5.1 Prinsip UX

- **Hangat dan tidak menghakimi.** Bahasa menekankan dukungan, apresiasi, dan proses.
- **Cepat.** Pengisian harian harus selesai dengan jumlah langkah minimum.
- **Terlihat terhubung.** Orang tua memahami bahwa catatannya berguna bagi guru, dan guru memahami sumber datanya.
- **Aman sejak awal.** Pengguna selalu mengetahui akun, sekolah, anak, dan konteks data yang sedang dilihat.
- **Tidak menyerupai aplikasi demo.** Semua angka, pesan, status, dan CTA di lingkungan produksi harus berasal dari data backend atau status kosong yang dirancang secara eksplisit.
- **Aksesibel dan responsif.** Antarmuka harus dapat digunakan pada desktop, tablet, dan ponsel dengan keyboard serta screen reader dasar.

### 5.2 Kebijakan pembiasaan

1. Checklist hanya mencatat status yang dikonfirmasi oleh orang tua atau pihak yang diberi kewenangan.
2. Tidak ada penalti otomatis karena checklist kosong.
3. Streak dapat berhenti atau mengalami jeda tanpa bahasa yang mempermalukan anak.
4. Poin dan badge harus menjadi bentuk apresiasi, bukan ukuran nilai agama anak.
5. Guru hanya melihat siswa yang berada dalam kelas atau sekolah yang menjadi kewenangannya.
6. Orang tua hanya melihat anak yang terhubung dengan akunnya.
7. Penghapusan data anak membutuhkan konfirmasi eksplisit dan dicatat dalam audit log.

---

## 6. Struktur Informasi dan Alur Utama

### 6.1 Struktur halaman publik

1. **Beranda**
   - Hero dengan pesan utama.
   - Penjelasan singkat manfaat.
   - CTA “Mulai Sekarang” dan “Masuk”.
   - Empat keunggulan: Pantau Ibadah, Kolaborasi, Mudah Digunakan, Aman & Terpercaya.
   - Bagian Tentang Kami.
   - Footer dengan kontak dan akses masuk.
2. **Fitur**
   - Penjelasan fitur orang tua, guru, dan laporan.
3. **Tentang Kami**
   - Visi, pendekatan pembiasaan, dan prinsip perlindungan anak.
4. **Kontak**
   - Form pertanyaan umum atau informasi kontak sekolah/pengelola.
5. **Pemilihan peran**
   - Kartu Orang Tua dan Guru.
6. **Login**
   - Form login sesuai peran yang dipilih.

### 6.2 Alur autentikasi

```text
Beranda
  → Masuk / Mulai Sekarang
  → Pilih peran: Orang Tua atau Guru
  → Masukkan email/nomor telepon dan kata sandi
  → Verifikasi kredensial
  → Jika akun belum menyelesaikan onboarding, arahkan ke onboarding
  → Jika berhasil, arahkan ke dashboard sesuai peran
```

Aplikasi harus menyimpan sesi secara aman. Pengguna tidak boleh mengakses dashboard hanya dengan mengganti URL tanpa token sesi dan pemeriksaan otorisasi di backend.

### 6.3 Alur orang tua

```text
Login
  → Dashboard orang tua
  → Pilih anak jika memiliki lebih dari satu anak
  → Buka checklist hari ini
  → Tandai aktivitas yang selesai
  → Tambahkan catatan opsional
  → Simpan
  → Lihat progres dan pesan guru
```

### 6.4 Alur guru

```text
Login
  → Dashboard kelas
  → Pilih periode atau kelas
  → Lihat ringkasan progres
  → Buka detail siswa
  → Kirim apresiasi atau pengingat
  → Lihat laporan mingguan
```

---

## 7. Requirement Fungsional

### 7.1 Beranda publik

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-PUB-01 | Sistem menampilkan beranda publik sebelum pengguna login. | Must | Pengguna yang membuka root URL melihat hero dan navigasi publik, bukan dashboard. |
| FR-PUB-02 | Beranda menampilkan CTA untuk masuk atau mulai. | Must | CTA membuka halaman pemilihan peran. |
| FR-PUB-03 | Beranda menampilkan manfaat produk tanpa angka operasional palsu. | Must | Tidak ada angka siswa, progres, atau klaim yang tidak berasal dari CMS/config resmi. |
| FR-PUB-04 | Beranda responsif. | Must | Layout dapat digunakan pada lebar 360 px sampai desktop 1440 px. |
| FR-PUB-05 | Navigasi anchor dan footer berfungsi. | Should | Klik Fitur, Tentang Kami, dan Kontak berpindah ke bagian atau halaman yang sesuai. |

### 7.2 Pemilihan peran dan login

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-AUTH-01 | Pengguna memilih Orang Tua atau Guru sebelum login. | Must | Setiap kartu menampilkan deskripsi dan CTA yang jelas. |
| FR-AUTH-02 | Form login menyesuaikan peran. | Must | Label, placeholder, dan tujuan redirect mengikuti peran. |
| FR-AUTH-03 | Form memvalidasi field wajib. | Must | Email/nomor telepon dan kata sandi tidak boleh kosong. |
| FR-AUTH-04 | Sistem menampilkan pesan error yang aman. | Must | Error tidak membocorkan apakah email tertentu terdaftar. |
| FR-AUTH-05 | Sistem mendukung logout. | Must | Logout menghapus sesi lokal dan mengarahkan ke halaman login. |
| FR-AUTH-06 | Sistem mendukung reset kata sandi. | Should | Pengguna dapat meminta tautan reset melalui email atau kanal yang dipilih sekolah. |
| FR-AUTH-07 | Sistem mendukung undangan sekolah. | Must | Akun dapat diaktifkan menggunakan invitation token yang kedaluwarsa. |
| FR-AUTH-08 | Sistem mendukung pembatasan percobaan login. | Must | Percobaan gagal berulang memicu throttling atau lockout sementara. |

### 7.3 Onboarding

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-ONB-01 | Orang tua dapat melengkapi profil dasar. | Must | Nama, kontak, dan zona waktu tersimpan. |
| FR-ONB-02 | Orang tua dapat menghubungkan satu atau lebih anak. | Must | Hubungan hanya dapat dibuat melalui undangan atau kode sekolah yang valid. |
| FR-ONB-03 | Guru dapat memilih kelas yang menjadi tanggung jawabnya. | Must | Akses guru dibatasi pada kelas yang ditetapkan admin. |
| FR-ONB-04 | Sistem menampilkan persetujuan penggunaan data. | Must | Persetujuan dicatat dengan versi kebijakan dan timestamp. |

### 7.4 Checklist orang tua

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-CHK-01 | Sistem membuat daftar checklist berdasarkan template kebiasaan aktif. | Must | Daftar dapat berubah per sekolah, kelas, atau periode. |
| FR-CHK-02 | Orang tua dapat menandai status selesai atau belum selesai. | Must | Perubahan tersimpan dan memiliki timestamp serta actor. |
| FR-CHK-03 | Orang tua dapat mengedit checklist pada hari berjalan. | Must | Edit tercatat dalam audit log. |
| FR-CHK-04 | Sistem mendukung catatan opsional per hari atau per aktivitas. | Should | Catatan memiliki batas panjang dan tidak boleh memuat data sensitif yang tidak perlu. |
| FR-CHK-05 | Sistem menampilkan progres harian dan mingguan. | Must | Persentase dihitung dari aktivitas aktif pada periode tersebut. |
| FR-CHK-06 | Sistem menangani hari tanpa pengisian. | Must | Status kosong dibedakan dari status tidak dilakukan. |
| FR-CHK-07 | Orang tua dapat berpindah anak dengan cepat. | Must | Pengguna tidak perlu logout untuk mengganti anak yang terhubung. |
| FR-CHK-08 | Sistem memberi konfirmasi penyimpanan. | Must | Pengguna melihat status tersimpan atau error yang dapat ditindaklanjuti. |

### 7.5 Dashboard guru

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-TEA-01 | Guru melihat ringkasan kelas. | Must | Ringkasan memuat jumlah siswa aktif, tingkat pengisian, dan progres agregat. |
| FR-TEA-02 | Guru dapat memfilter kelas dan periode. | Must | Hasil filter konsisten pada kartu, grafik, dan daftar siswa. |
| FR-TEA-03 | Guru dapat melihat daftar siswa dengan progres terbaik. | Should | Daftar dapat diurutkan berdasarkan progres, konsistensi, atau nama. |
| FR-TEA-04 | Guru dapat melihat siswa yang belum mengisi. | Must | Sistem menampilkan rentang hari kosong tanpa mempermalukan siswa. |
| FR-TEA-05 | Guru dapat membuka detail siswa. | Must | Detail hanya menampilkan siswa dalam kewenangan guru. |
| FR-TEA-06 | Guru dapat mengirim apresiasi atau pengingat. | Should | Pesan tercatat dan dapat dilihat oleh orang tua yang terkait. |
| FR-TEA-07 | Guru tidak dapat mengubah catatan orang tua tanpa hak khusus. | Must | Hak tulis dibatasi; koreksi dilakukan melalui mekanisme revisi. |

### 7.6 Progres, laporan, dan komunikasi

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-REP-01 | Sistem menghitung progres harian, mingguan, dan periode. | Must | Formula konsisten dan terdokumentasi. |
| FR-REP-02 | Sistem menyediakan laporan mingguan anak. | Must | Laporan menampilkan aktivitas selesai, kosong, tren, dan catatan. |
| FR-REP-03 | Guru dapat melihat laporan kelas agregat. | Must | Laporan tidak mengekspos data anak di luar kelas. |
| FR-REP-04 | Pengguna dapat mengunduh laporan PDF. | Should | PDF memuat tanggal pembuatan dan sumber data. |
| FR-MSG-01 | Orang tua dan guru dapat bertukar pesan dalam konteks anak. | Should | Pesan terikat pada sekolah, anak, dan thread. |
| FR-MSG-02 | Sistem menampilkan status belum dibaca. | Must | Status dibaca diperbarui per pengguna. |
| FR-MSG-03 | Sistem mengirim notifikasi untuk pesan atau pengingat. | Should | Pengguna dapat mengatur preferensi notifikasi. |

### 7.7 Pengaturan dan admin sekolah

| ID | Requirement | Prioritas | Acceptance criteria |
|---|---|---|---|
| FR-ADM-01 | Admin dapat membuat sekolah dan periode pembiasaan. | Must | Semua data baru memiliki owner sekolah. |
| FR-ADM-02 | Admin dapat membuat kelas dan menetapkan guru. | Must | Satu guru dapat memiliki beberapa kelas sesuai kebijakan sekolah. |
| FR-ADM-03 | Admin dapat mengundang orang tua dan guru. | Must | Token undangan unik, kedaluwarsa, dan sekali pakai. |
| FR-ADM-04 | Admin dapat mengelola template kebiasaan. | Must | Template dapat diaktifkan, dinonaktifkan, dan diarsipkan tanpa merusak histori. |
| FR-ADM-05 | Admin dapat melihat audit log. | Must | Perubahan data sensitif dapat ditelusuri. |
| FR-ADM-06 | Pengguna dapat mengelola profil dan preferensi. | Must | Pengaturan tidak boleh mengubah hak akses. |

---

## 8. Model Peran dan Hak Akses

Gunakan **role-based access control** dengan pembatasan berbasis sekolah dan relasi data.

| Resource | Orang Tua | Guru | Admin Sekolah | Superadmin |
|---|---|---|---|---|
| Profil sendiri | Baca/Ubah terbatas | Baca/Ubah terbatas | Baca/Ubah | Baca/Ubah |
| Profil anak terhubung | Baca | Baca siswa dalam kelas | Baca/Ubah dalam sekolah | Baca/Ubah |
| Checklist anak | Buat/Ubah milik anak terhubung | Baca | Baca | Baca |
| Catatan guru | Baca jika dibagikan | Buat/Ubah kelas | Baca/Ubah | Baca/Ubah |
| Template kebiasaan | Baca | Baca | Buat/Ubah | Buat/Ubah |
| Kelas | Baca relasi | Baca relasi | Buat/Ubah | Buat/Ubah |
| Laporan anak | Baca anak terhubung | Baca siswa kelas | Baca sekolah | Baca semua sesuai kebijakan |
| Laporan agregat | Tidak | Baca kelas | Baca sekolah | Baca semua |
| Pesan | Buat/Baca thread terkait | Buat/Baca thread terkait | Baca sesuai kebijakan | Akses dukungan terbatas |
| Audit log | Tidak | Tidak | Baca sekolah | Baca semua |
| Hapus data | Request | Request | Sesuai kebijakan | Sesuai prosedur resmi |

Backend wajib menegakkan hak akses. Pembatasan pada UI tidak dianggap sebagai kontrol keamanan.

---

## 9. Rancangan Data dan Database

### 9.1 Rekomendasi teknologi

Gunakan database relasional seperti PostgreSQL atau MySQL/TiDB karena data memiliki relasi kuat antara sekolah, pengguna, kelas, anak, template kebiasaan, checklist, laporan, dan pesan. Gunakan UUID atau ULID sebagai primary key publik untuk menghindari enumerasi ID berurutan pada API.

Semua tabel utama harus memiliki `created_at`, `updated_at`, dan jika relevan `deleted_at` untuk soft delete. Gunakan timezone UTC pada penyimpanan, lalu tampilkan berdasarkan timezone sekolah atau pengguna.

### 9.2 Entitas inti

| Entitas | Tujuan |
|---|---|
| `schools` | Menyimpan organisasi sekolah dan konfigurasi tenant. |
| `users` | Menyimpan akun login dan status akun. |
| `user_roles` | Menghubungkan pengguna dengan peran dalam sekolah. |
| `children` | Menyimpan profil minimal anak. |
| `parent_child_links` | Menghubungkan orang tua dengan anak. |
| `classes` | Menyimpan rombel atau kelas. |
| `teacher_class_links` | Menghubungkan guru dengan kelas. |
| `student_class_links` | Menghubungkan anak dengan kelas dan periode. |
| `habit_templates` | Mendefinisikan kebiasaan yang tersedia. |
| `habit_template_items` | Mendefinisikan item seperti Shalat Subuh atau Membaca Al-Qur'an. |
| `habit_periods` | Mendefinisikan periode pembiasaan aktif. |
| `checklist_entries` | Menyimpan status aktivitas anak pada tanggal tertentu. |
| `checklist_notes` | Menyimpan catatan orang tua atau guru. |
| `streak_snapshots` | Menyimpan hasil perhitungan konsistensi yang dapat diaudit. |
| `points_ledger` | Menyimpan perubahan poin secara immutable. |
| `badges` | Mendefinisikan badge apresiasi. |
| `child_badges` | Menyimpan badge yang diperoleh anak. |
| `messages` | Menyimpan pesan dalam thread kontekstual. |
| `message_threads` | Mengelompokkan pesan orang tua-guru per anak. |
| `notifications` | Menyimpan notifikasi dalam aplikasi. |
| `notification_preferences` | Menyimpan preferensi notifikasi pengguna. |
| `invitations` | Menyimpan token undangan akun atau relasi anak. |
| `consents` | Menyimpan persetujuan kebijakan. |
| `audit_logs` | Menyimpan aktivitas penting dan perubahan data. |
| `reports` | Menyimpan metadata laporan yang telah dibuat. |

### 9.3 Skema tabel inti

#### `schools`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | UUID/ULID | Primary key |
| `name` | varchar(160) | Nama sekolah |
| `code` | varchar(40) | Kode unik untuk undangan |
| `timezone` | varchar(50) | Default `Asia/Jakarta` |
| `status` | enum | `active`, `suspended`, `archived` |
| `settings_json` | json | Konfigurasi non-kritis |
| `created_at` | timestamp | UTC |
| `updated_at` | timestamp | UTC |

#### `users`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | UUID/ULID | Primary key |
| `email` | varchar(254) nullable | Normalized lowercase, unique bila ada |
| `phone` | varchar(30) nullable | E.164 bila memungkinkan |
| `password_hash` | varchar | Jangan simpan password mentah |
| `full_name` | varchar(160) | Nama tampilan |
| `avatar_url` | varchar nullable | URL storage terproteksi |
| `status` | enum | `invited`, `active`, `suspended`, `deleted` |
| `last_login_at` | timestamp nullable | Audit aktivitas |
| `created_at` | timestamp | UTC |
| `updated_at` | timestamp | UTC |

#### `children`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | UUID/ULID | Primary key |
| `school_id` | UUID | Foreign key ke `schools` |
| `full_name` | varchar(160) | Nama resmi atau nama panggilan sesuai kebijakan |
| `preferred_name` | varchar(80) nullable | Nama yang tampil di UI |
| `birth_date` | date nullable | Simpan hanya jika dibutuhkan |
| `grade_level` | varchar(30) nullable | Tingkat kelas |
| `status` | enum | `active`, `inactive`, `archived` |
| `created_at` | timestamp | UTC |
| `updated_at` | timestamp | UTC |

#### `habit_template_items`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | UUID/ULID | Primary key |
| `school_id` | UUID | Tenant owner |
| `category` | enum/varchar | `ibadah_wajib`, `ibadah_harian`, `kebiasaan_baik` |
| `name` | varchar(120) | Nama kebiasaan |
| `description` | varchar(255) nullable | Penjelasan singkat |
| `icon_key` | varchar(50) nullable | Key icon frontend, bukan SVG mentah |
| `sort_order` | integer | Urutan tampilan |
| `is_active` | boolean | Status aktif |
| `created_at` | timestamp | UTC |
| `updated_at` | timestamp | UTC |

#### `checklist_entries`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | UUID/ULID | Primary key |
| `school_id` | UUID | Tenant owner |
| `child_id` | UUID | Anak |
| `habit_item_id` | UUID | Item kebiasaan |
| `entry_date` | date | Tanggal lokal sekolah |
| `status` | enum | `completed`, `not_completed`, `not_reported` |
| `reported_by` | UUID | User yang mengubah |
| `reported_at` | timestamp | UTC |
| `source` | enum | `parent`, `teacher`, `admin`, `system` |
| `version` | integer | Optimistic concurrency |
| `created_at` | timestamp | UTC |
| `updated_at` | timestamp | UTC |

Buat unique constraint pada `(child_id, habit_item_id, entry_date)` agar satu aktivitas hanya memiliki satu status aktif per anak per hari. Perubahan status sebaiknya tetap dicatat dalam `audit_logs` atau tabel history terpisah.

#### `message_threads` dan `messages`

`message_threads` memiliki `id`, `school_id`, `child_id`, `created_by`, `status`, `created_at`, dan `updated_at`. `messages` memiliki `id`, `thread_id`, `sender_id`, `body`, `sent_at`, `read_at` nullable, dan `deleted_at` nullable. Batasi ukuran pesan dan sanitasi HTML untuk mencegah XSS.

#### `audit_logs`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | UUID/ULID | Primary key |
| `school_id` | UUID nullable | Tenant context |
| `actor_user_id` | UUID nullable | Pelaku, null untuk proses sistem |
| `action` | varchar(80) | Contoh `checklist.updated` |
| `entity_type` | varchar(80) | Contoh `checklist_entry` |
| `entity_id` | UUID nullable | Target |
| `before_json` | json nullable | Snapshot terbatas |
| `after_json` | json nullable | Snapshot terbatas |
| `ip_hash` | varchar nullable | Hindari menyimpan IP mentah bila tidak perlu |
| `created_at` | timestamp | UTC |

### 9.4 Indeks minimum

1. `users(email)` dan `users(phone)` dengan normalisasi.
2. `children(school_id, status)`.
3. `student_class_links(class_id, status)`.
4. `checklist_entries(child_id, entry_date)`.
5. `checklist_entries(school_id, entry_date)` untuk laporan agregat.
6. `messages(thread_id, sent_at)`.
7. `notifications(user_id, read_at, created_at)`.
8. `audit_logs(school_id, created_at)`.

---

## 10. Kontrak API Backend

API dapat menggunakan REST versioned `/api/v1` atau GraphQL. Rancangan berikut memakai REST karena mudah dipahami dan cocok untuk frontend saat ini.

### 10.1 Auth

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login berdasarkan email/telepon, password, dan role context. |
| `POST` | `/api/v1/auth/logout` | Mengakhiri sesi. |
| `GET` | `/api/v1/auth/me` | Mengambil identitas dan scope akses. |
| `POST` | `/api/v1/auth/refresh` | Memperbarui access token bila memakai refresh token. |
| `POST` | `/api/v1/auth/forgot-password` | Meminta reset password. |
| `POST` | `/api/v1/auth/reset-password` | Mengatur password baru dengan token. |
| `POST` | `/api/v1/invitations/accept` | Menerima undangan sekolah atau relasi anak. |

### 10.2 Orang tua dan anak

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/v1/parent/children` | Daftar anak yang terhubung. |
| `GET` | `/api/v1/children/:childId/summary?period=week` | Ringkasan progres anak. |
| `GET` | `/api/v1/children/:childId/checklists?date=YYYY-MM-DD` | Checklist harian. |
| `PUT` | `/api/v1/children/:childId/checklists/:habitItemId` | Membuat atau mengubah status aktivitas. |
| `POST` | `/api/v1/children/:childId/checklists/notes` | Menyimpan catatan harian. |
| `GET` | `/api/v1/children/:childId/reports?period=week` | Mengambil laporan anak. |

Contoh request perubahan checklist:

```json
{
  "entryDate": "2026-09-14",
  "status": "completed",
  "note": "Membaca bersama setelah Maghrib",
  "clientVersion": 3
}
```

Contoh response:

```json
{
  "id": "01J...",
  "childId": "01J...",
  "habitItemId": "01J...",
  "entryDate": "2026-09-14",
  "status": "completed",
  "reportedBy": "01J...",
  "reportedAt": "2026-09-14T10:30:00Z",
  "version": 4
}
```

### 10.3 Guru

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/v1/teacher/classes` | Daftar kelas yang diajar. |
| `GET` | `/api/v1/classes/:classId/summary?period=week` | Ringkasan kelas. |
| `GET` | `/api/v1/classes/:classId/students?sort=progress` | Daftar siswa dan progres. |
| `GET` | `/api/v1/classes/:classId/students/attention` | Siswa yang belum mengisi atau trennya menurun. |
| `GET` | `/api/v1/students/:studentId/progress?period=week` | Detail progres siswa. |
| `POST` | `/api/v1/children/:childId/teacher-notes` | Catatan atau apresiasi guru. |
| `POST` | `/api/v1/children/:childId/reminders` | Mengirim pengingat kepada orang tua. |

### 10.4 Admin

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/v1/admin/school` | Konfigurasi sekolah. |
| `POST` | `/api/v1/admin/classes` | Membuat kelas. |
| `POST` | `/api/v1/admin/invitations` | Membuat undangan. |
| `GET` | `/api/v1/admin/habit-items` | Daftar template kebiasaan. |
| `POST` | `/api/v1/admin/habit-items` | Membuat item kebiasaan. |
| `PATCH` | `/api/v1/admin/habit-items/:id` | Mengubah atau menonaktifkan item. |
| `GET` | `/api/v1/admin/audit-logs` | Melihat audit log sesuai scope. |

### 10.5 Error format

Semua error API harus menggunakan format konsisten.

```json
{
  "error": {
    "code": "CHECKLIST_VERSION_CONFLICT",
    "message": "Data checklist sudah berubah. Muat ulang sebelum menyimpan kembali.",
    "requestId": "req_01J...",
    "details": {}
  }
}
```

Gunakan HTTP status yang tepat: `400` untuk input tidak valid, `401` untuk belum login, `403` untuk tidak berwenang, `404` untuk resource tidak ditemukan, `409` untuk konflik versi, `429` untuk rate limit, dan `500` untuk error internal.

---

## 11. Perhitungan Progres

### 11.1 Status dasar

Setiap item kebiasaan pada suatu tanggal memiliki salah satu status berikut.

- `completed`: orang tua atau actor berwenang menyatakan aktivitas dilakukan.
- `not_completed`: aktivitas dilaporkan belum dilakukan.
- `not_reported`: tidak ada laporan.

`not_reported` tidak boleh otomatis dihitung sebagai `not_completed` karena keduanya memiliki makna berbeda.

### 11.2 Progres harian

```text
progres_harian = jumlah completed / jumlah item aktif pada tanggal tersebut × 100
```

Jika tidak ada item aktif, sistem menampilkan status konfigurasi, bukan `0%`.

### 11.3 Progres mingguan

Versi pertama menggunakan rata-rata progres harian yang memiliki setidaknya satu input. Alternatif yang lebih ketat dapat memakai jumlah item completed dibagi total item aktif dikalikan jumlah hari yang diharapkan. Formula final harus dipilih sebelum laporan produksi dirilis dan digunakan konsisten di frontend, API, dan export PDF.

### 11.4 Streak

Streak dihitung dari hari berturut-turut dengan progres minimal yang ditentukan oleh sekolah. Default awal dapat menggunakan `≥ 80%` item aktif selesai pada hari tersebut. Streak harus memiliki konfigurasi sekolah dan tidak boleh dipakai untuk menghukum anak.

### 11.5 Poin dan badge

Poin disimpan sebagai ledger, bukan hanya angka agregat, agar setiap perubahan dapat diaudit. Badge ditentukan oleh aturan yang dapat dikonfigurasi, misalnya:

| Badge | Aturan awal |
|---|---|
| Langkah Pertama | Checklist pertama disimpan |
| Konsisten 3 Hari | Progres minimum tercapai tiga hari berturut-turut |
| Sahabat Al-Qur'an | Item membaca Al-Qur'an selesai minimal lima kali dalam satu minggu |
| Semangat Berbagi | Kebiasaan baik selesai minimal tiga kali dalam satu minggu |

---

## 12. Keamanan, Privasi, dan Perlindungan Anak

1. Password harus di-hash menggunakan Argon2id atau bcrypt dengan cost yang sesuai.
2. Gunakan HTTPS untuk semua environment non-local.
3. Gunakan access token berdurasi pendek dan refresh token yang dapat dicabut, atau session cookie `HttpOnly`, `Secure`, dan `SameSite`.
4. Terapkan rate limiting pada login, reset password, undangan, dan pengiriman pesan.
5. Terapkan tenant isolation pada semua query berdasarkan `school_id`.
6. Jangan mengandalkan filter frontend untuk pembatasan akses.
7. Sanitasi dan validasi semua input teks.
8. Jangan menyimpan password, token mentah, atau data sensitif dalam log.
9. Pisahkan data analitik agregat dari data identitas anak.
10. Batasi data anak pada field yang benar-benar dibutuhkan.
11. Sediakan proses koreksi, ekspor, dan penghapusan data sesuai kebijakan sekolah.
12. Simpan versi kebijakan privasi dan persetujuan pengguna.
13. Audit semua perubahan checklist, relasi anak, hak akses, dan penghapusan data.
14. Gunakan signed URL untuk aset privat seperti avatar jika storage memerlukannya.
15. Tetapkan retensi pesan dan audit log berdasarkan kebijakan sekolah.
16. Sediakan mekanisme pelaporan masalah atau permintaan dukungan.

PRD ini bukan pengganti tinjauan hukum. Sebelum produksi, sekolah atau pengelola harus mengonfirmasi persyaratan perlindungan data anak dan kebijakan persetujuan yang berlaku pada wilayah operasional.

---

## 13. Notifikasi

### 13.1 Event notifikasi

| Event | Penerima | Kanal awal |
|---|---|---|
| Checklist belum diisi mendekati batas harian | Orang tua | In-app, opsional email/push |
| Checklist tersimpan | Orang tua | In-app confirmation |
| Siswa belum mengisi beberapa hari | Guru | In-app |
| Guru mengirim apresiasi | Orang tua | In-app, opsional email |
| Pesan baru | Penerima thread | In-app, opsional email |
| Undangan akun | Orang tua/guru | Email atau kanal yang disetujui |
| Reset password | Pemilik akun | Email atau kanal yang disetujui |

### 13.2 Aturan notifikasi

- Pengguna dapat mengatur jam tenang.
- Sistem tidak boleh mengirim pengingat berulang tanpa batas.
- Pengingat harus menggunakan bahasa suportif.
- Notifikasi yang gagal dikirim harus masuk ke retry queue dengan batas percobaan.
- Semua notifikasi memiliki status `pending`, `sent`, `delivered` bila tersedia, atau `failed`.

---

## 14. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Largest Contentful Paint halaman publik target ≤ 2,5 detik pada koneksi 4G yang wajar. Dashboard utama target dapat digunakan ≤ 3 detik setelah data utama diterima. |
| Availability | Target availability awal 99,5% per bulan di luar maintenance terjadwal. |
| Scalability | Versi awal harus mampu melayani minimal 20 sekolah, 10.000 anak, dan 100.000 checklist per bulan tanpa perubahan arsitektur besar. |
| Accessibility | Target WCAG 2.2 AA untuk navigasi keyboard, kontras, label form, fokus, dan alternatif teks. |
| Responsiveness | Dukungan layar 360 px, 768 px, 1024 px, dan 1440 px. |
| Observability | Log terstruktur, request ID, error tracking, metrik latency, dan health check. |
| Backup | Backup database terjadwal dan uji pemulihan minimal per kuartal. |
| Data consistency | Update checklist menggunakan optimistic concurrency atau aturan last-write yang terdokumentasi. |
| Localization | Bahasa awal Bahasa Indonesia; tanggal dan zona waktu mengikuti sekolah. |
| Maintainability | Komponen frontend, service backend, dan query database memiliki test otomatis pada bagian kritis. |
| SEO | Halaman publik memiliki title, description, heading hierarchy, dan metadata sosial. |
| Media | Gambar hero dikompresi, memiliki ukuran responsive, alt text, dan fallback. |

---

## 15. Analytics dan Observability Produk

Kumpulkan hanya event yang diperlukan untuk memahami penggunaan produk. Hindari memasukkan nama lengkap anak atau isi pesan ke sistem analytics.

| Event | Properti non-sensitif |
|---|---|
| `public_home_viewed` | `source`, `viewport_class` |
| `role_selected` | `role` |
| `login_succeeded` | `role`, `school_id_hash` |
| `login_failed` | `role`, `reason_category` |
| `child_selected` | `child_count_bucket` |
| `checklist_opened` | `day_offset`, `item_count` |
| `checklist_saved` | `completed_count`, `item_count` |
| `teacher_dashboard_viewed` | `class_count` |
| `student_detail_viewed` | `role`, `period` |
| `message_sent` | `role`, `channel` |
| `report_downloaded` | `report_type`, `period` |

Metrik teknis minimum mencakup latency API per endpoint, error rate, authentication failure rate, queue delay, database connection pool, storage error, dan jumlah audit log yang gagal ditulis.

---

## 16. QA dan Acceptance Criteria End-to-End

### 16.1 Skenario autentikasi

1. Pengguna anonim membuka root dan melihat beranda publik.
2. Pengguna memilih Masuk dan melihat dua kartu peran.
3. Pengguna memilih Orang Tua dan form menampilkan konteks Orang Tua.
4. Login dengan kredensial valid mengarahkan ke dashboard orang tua.
5. Login dengan kredensial invalid menampilkan error aman tanpa membocorkan akun.
6. Guru tidak dapat membuka endpoint checklist anak yang bukan kewenangannya.
7. Logout menghapus sesi dan mencegah akses ke halaman privat.

### 16.2 Skenario checklist

1. Orang tua membuka anak yang terhubung.
2. Sistem menampilkan daftar item aktif sesuai periode.
3. Orang tua menandai satu item selesai.
4. Sistem menyimpan perubahan satu kali dan menampilkan konfirmasi.
5. Refresh halaman mempertahankan data dari backend.
6. Konflik versi menampilkan opsi muat ulang tanpa menimpa perubahan lain.
7. Hari tanpa laporan tampil sebagai `Belum diisi`, bukan `Tidak dilakukan`.

### 16.3 Skenario guru

1. Guru melihat kelas yang ditetapkan.
2. Guru memfilter periode.
3. Ringkasan kelas berubah sesuai filter.
4. Guru membuka detail siswa.
5. Guru mengirim apresiasi.
6. Orang tua menerima pesan pada thread anak yang benar.
7. Guru tidak melihat anak dari sekolah lain.

### 16.4 Skenario privasi

1. Pengguna tanpa akses menerima `403` untuk resource terlarang.
2. Audit log tercatat saat checklist diubah.
3. Token undangan kedaluwarsa tidak dapat digunakan.
4. Password tidak muncul pada response atau log.
5. Data anak tidak masuk ke analytics sebagai nama atau isi pesan.

---

## 17. Strategi Implementasi dan Roadmap

### Fase 0 — Finalisasi desain dan keputusan data

- Validasi alur publik, pemilihan peran, login, onboarding, checklist, guru, laporan, dan pesan.
- Finalisasi formula progres, streak, poin, dan definisi `not_reported`.
- Finalisasi kebijakan privasi, persetujuan orang tua, dan retensi data.
- Finalisasi struktur tenant sekolah.

**Keluaran:** spesifikasi UX final, ERD, kontrak API, dan decision log.

### Fase 1 — Fondasi backend

- Menyiapkan database dan migrasi.
- Menyiapkan autentikasi, session management, role-based access control, dan invitation.
- Menyiapkan sekolah, kelas, pengguna, anak, dan relasi.
- Menyiapkan audit log dan observability dasar.

**Keluaran:** API auth, onboarding, dan admin sekolah minimum.

### Fase 2 — Checklist dan dashboard orang tua

- CRUD habit template.
- Endpoint checklist dan notes.
- Perhitungan progres harian/mingguan.
- Integrasi dashboard orang tua dengan data backend.
- Pengujian concurrency dan offline-friendly retry sederhana.

**Keluaran:** orang tua dapat mengisi checklist produksi.

### Fase 3 — Dashboard guru dan laporan

- Ringkasan kelas.
- Daftar perhatian dan detail siswa.
- Catatan/apresiasi guru.
- Laporan mingguan anak dan kelas.
- Export PDF bila diperlukan.

**Keluaran:** guru dapat memantau dan menindaklanjuti data.

### Fase 4 — Notifikasi dan penyempurnaan

- In-app notification.
- Email/push opsional.
- Message thread.
- Badge dan poin berbasis ledger.
- Accessibility audit, performance optimization, dan security review.

**Keluaran:** release candidate untuk sekolah percontohan.

### Fase 5 — Pilot dan scale

- Pilot pada satu atau beberapa sekolah.
- Pelatihan admin dan guru.
- Pengumpulan feedback terstruktur.
- Perbaikan retention, onboarding, dan formulir.
- Rollout bertahap dengan feature flags.

---

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Orang tua tidak konsisten mengisi | Data progres kosong | Onboarding singkat, reminder yang dapat diatur, input cepat, dan dukungan wali kelas. |
| Data dianggap sebagai penilaian agama | Resistensi atau dampak negatif pada anak | Bahasa non-menghakimi, status `not_reported`, tidak ada ranking publik, dan edukasi penggunaan. |
| Kesalahan hak akses | Pelanggaran privasi | Tenant isolation, authorization server-side, test matrix, dan audit log. |
| Formula progres membingungkan | Keputusan guru tidak konsisten | Dokumentasikan formula, tampilkan definisi di UI, dan gunakan satu service kalkulasi. |
| Terlalu banyak notifikasi | Pengguna mematikan notifikasi | Quiet hours, frequency cap, dan preferensi per event. |
| Data input tidak akurat | Laporan menyesatkan | Tampilkan sumber input, timestamp, dan histori perubahan. |
| Ketergantungan pada satu sekolah | Produk tidak generik | Model tenant, template per sekolah, dan konfigurasi tanpa fork kode. |
| Foto atau catatan memuat data sensitif | Risiko privasi | Batasi media pada fase awal, sanitasi input, dan kebijakan retensi. |

---

## 19. Pertanyaan Terbuka yang Harus Diputuskan

1. Apakah satu akun orang tua dapat terhubung ke beberapa sekolah?
2. Apakah anak memiliki akun sendiri atau seluruh interaksi dilakukan oleh orang tua dan guru?
3. Apakah guru boleh mengubah status checklist, atau hanya memberi catatan dan meminta koreksi?
4. Batas waktu pengeditan checklist harian berapa lama?
5. Apakah sekolah menggunakan email, nomor telepon, atau kode undangan sebagai identitas utama?
6. Apakah satu anak dapat berada di lebih dari satu kelas selama periode yang sama?
7. Formula progres mingguan mana yang akan digunakan secara resmi?
8. Apakah pesan guru harus melalui moderasi atau dapat langsung terkirim?
9. Berapa lama data anak, pesan, dan audit log dipertahankan?
10. Kanal notifikasi mana yang disetujui sekolah pada release pertama?
11. Apakah laporan perlu menggunakan kop sekolah dan tanda tangan digital?
12. Apakah ada kebutuhan integrasi dengan sistem akademik sekolah yang sudah ada?

---

## 20. Definition of Ready dan Definition of Done

### Definition of Ready

Sebuah fitur siap dikerjakan jika memiliki tujuan pengguna yang jelas, acceptance criteria, scope akses, desain responsif, kontrak data atau API, keputusan error state, dan definisi event analytics bila diperlukan.

### Definition of Done

Sebuah fitur selesai jika:

1. UI desktop dan mobile telah diimplementasikan.
2. Backend memvalidasi input dan hak akses.
3. Migrasi database dan indeks tersedia.
4. Unit test untuk aturan bisnis utama lulus.
5. Integration test untuk endpoint utama lulus.
6. Error state dan empty state tersedia.
7. Audit log diterapkan untuk operasi sensitif.
8. Accessibility dasar telah diperiksa.
9. Tidak ada data demo atau placeholder yang tampil pada production build.
10. Dokumentasi API dan keputusan formula diperbarui.
11. Monitoring dan logging dasar tersedia.
12. QA menyetujui acceptance criteria.

---

## 21. Rekomendasi Prioritas Teknis

Prioritas pertama adalah membangun fondasi autentikasi dan tenant isolation sebelum menambahkan fitur gamifikasi. Tanpa fondasi ini, data checklist anak berisiko tercampur antar sekolah atau terbaca oleh pengguna yang salah.

Prioritas kedua adalah memindahkan formula progres ke backend atau shared domain service. Frontend boleh menghitung tampilan sementara untuk respons cepat, tetapi nilai resmi untuk laporan harus berasal dari satu sumber kalkulasi yang konsisten.

Prioritas ketiga adalah membangun checklist dengan status `not_reported` yang jelas. Keputusan ini mencegah sistem menyamakan tidak adanya laporan dengan kegagalan ibadah.

Prioritas keempat adalah menyediakan audit log dan histori perubahan sejak versi awal. Data kebiasaan anak bersifat sensitif dan perlu dapat dijelaskan ketika terjadi koreksi atau sengketa.

Prioritas kelima adalah menguji produk bersama orang tua dan guru nyata dalam pilot kecil. Kecepatan pengisian, bahasa yang tidak menghakimi, dan ketepatan notifikasi lebih penting daripada menambah banyak modul pada release pertama.

---

## 22. Referensi

Dokumen ini disusun berdasarkan frontend Sahabat Ibadah yang telah dibuat dan referensi visual yang diberikan pengguna. Referensi tersebut digunakan untuk memahami alur publik, pemilihan peran, dashboard orang tua, dashboard guru, checklist, progres, laporan, notifikasi, dan pengaturan.

[1]: file:///home/ubuntu/reference_sekolah/1.png "Referensi visual beranda Sahabat Ibadah"
[2]: file:///home/ubuntu/reference_sekolah/2.png "Referensi visual pemilihan peran Sahabat Ibadah"
[3]: file:///home/ubuntu/sahabat-ibadah/client/src/pages/Home.tsx "Implementasi frontend Sahabat Ibadah"
[4]: file:///home/ubuntu/sahabat-ibadah/client/src/index.css "Design system dan stylesheet Sahabat Ibadah"
