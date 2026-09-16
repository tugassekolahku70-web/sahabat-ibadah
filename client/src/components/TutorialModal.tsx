import React, { useState, useEffect, useRef } from "react";
import {
  X,
  BookOpen,
  GraduationCap,
  Users,
  Sparkles,
  ArrowRight,
  ZoomIn,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Award,
} from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "teacher" | "parent";
  onLoginAction?: () => void;
}

interface DemoStep {
  title: string;
  subtitle: string;
  desc: string;
  img: string;
  caption: string;
}

const teacherDemoSteps: DemoStep[] = [
  {
    title: "Langkah 1",
    subtitle: "Dashboard Kelas & Ringkasan Siswa",
    desc: "Memantau rata-rata kepatuhan ibadah santri kelas 4A, daftar siswa butuh perhatian, dan santri berprestasi.",
    img: "/tutorial/guru-dashboard.png",
    caption: "Dashboard Guru: Ringkasan statistik kelas 4A, persentase kepatuhan, dan apresiasi santri aktif.",
  },
  {
    title: "Langkah 2",
    subtitle: "Kelola Data Siswa & Akun Orang Tua",
    desc: "Mendata santri, mengunggah foto profil anak, dan membuatkan akses login langsung untuk wali murid.",
    img: "/tutorial/guru-daftar-siswa.png",
    caption: "Panel Daftar Siswa: Pengaturan data santri, foto profil anak, dan aktivasi akun orang tua.",
  },
  {
    title: "Langkah 3",
    subtitle: "Laporan Mingguan & Evaluasi Guru",
    desc: "Analisis performa tiap amalan ibadah (shalat, Al-Qur'an, infaq) serta kolom evaluasi resmi untuk rapor anak.",
    img: "/tutorial/guru-laporan.png",
    caption: "Laporan Mingguan: Distribusi aktivitas ibadah dan pengisian catatan pembina untuk lembar rapor.",
  },
  {
    title: "Langkah 4",
    subtitle: "Pesan & Konsultasi Wali Murid",
    desc: "Komunikasi dua arah langsung antara guru dan orang tua dengan foto profil nyata dan arsip percakapan aman.",
    img: "/tutorial/guru-pesan.png",
    caption: "Ruang Pesan Guru: Percakapan interaktif terarah untuk koordinasi kebiasaan ibadah ananda di rumah.",
  },
  {
    title: "Langkah 5",
    subtitle: "Profil Guru & Logo Resmi Sekolah",
    desc: "Memperbarui identitas pendidik serta mengunggah logo sekolah yang otomatis muncul pada kop rapor PDF & Word.",
    img: "/tutorial/guru-pengaturan.png",
    caption: "Pengaturan Guru: Form profil pembina dan integrasi logo sekolah resmi pada dokumen mutaba'ah.",
  },
];

const parentDemoSteps: DemoStep[] = [
  {
    title: "Langkah 1",
    subtitle: "Checklist Harian Ibadah di Rumah",
    desc: "Mendampingi ananda mencentang shalat fardhu 5 waktu, dhuha, tadarus Al-Qur'an, sedekah, dan adab setiap malam.",
    img: "/tutorial/ortu-checklist.png",
    caption: "Checklist Harian Orang Tua: Formulir ramah smartphone untuk mencatat ibadah ananda secara konsisten.",
  },
  {
    title: "Langkah 2",
    subtitle: "Grafik Progres 14 Hari & Lencana",
    desc: "Memantau perkembangan konsistensi ibadah lewat diagram batang 14 hari dan koleksi 4 Lencana Keberkahan.",
    img: "/tutorial/ortu-progres.png",
    caption: "Halaman Progres Anak: Grafik tren kepatuhan 14 hari dan apresiasi lencana islami penambah semangat.",
  },
  {
    title: "Langkah 3",
    subtitle: "Rapor Mutaba'ah Resmi (PDF & Word)",
    desc: "Pratinjau lembar A4 dan unduh berkas resmi PDF / Word bertanda tangan otomatis wali kelas & orang tua.",
    img: "/tutorial/ortu-laporan.png",
    caption: "Rapor Mutaba'ah: Tombol unduh dokumen resmi berstandar sekolah yang bebas tumpang tindih teks.",
  },
  {
    title: "Langkah 4",
    subtitle: "Konsultasi Langsung dengan Guru",
    desc: "Ruang pesan privat untuk berkonsultasi seputar pembinaan ibadah ananda langsung kepada guru wali kelas.",
    img: "/tutorial/ortu-pesan.png",
    caption: "Ruang Pesan Orang Tua: Koordinasi hangat dengan wali kelas disertai penanda status pesan yang jelas.",
  },
  {
    title: "Langkah 5",
    subtitle: "Profil Orang Tua & Daftar Anak",
    desc: "Memperbarui identitas wali murid, foto profil keluarga, nomor WhatsApp, serta memantau data anak yang terdaftar.",
    img: "/tutorial/ortu-pengaturan.png",
    caption: "Pengaturan Profil: Edit identitas wali murid, foto avatar keluarga, dan verifikasi nama ananda terhubung.",
  },
];

export default function TutorialModal({
  isOpen,
  onClose,
  defaultRole = "parent",
  onLoginAction,
}: TutorialModalProps) {
  const [activeTab, setActiveTab] = useState<"teacher" | "parent">(defaultRole);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Demo Player State
  const [demoStepIdx, setDemoStepIdx] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSteps = activeTab === "teacher" ? teacherDemoSteps : parentDemoSteps;

  useEffect(() => {
    setActiveTab(defaultRole);
    setDemoStepIdx(0);
  }, [defaultRole]);

  // Reset demo step on tab change
  useEffect(() => {
    setDemoStepIdx(0);
  }, [activeTab]);

  // Auto-play timer for interactive demo
  useEffect(() => {
    if (!isOpen || !isDemoPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setDemoStepIdx((prev) => (prev + 1) % currentSteps.length);
    }, 4200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isDemoPlaying, currentSteps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedImage) {
          setSelectedImage(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectedImage, onClose]);

  if (!isOpen) return null;

  const currentDemo = currentSteps[demoStepIdx];

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div
        className="tutorial-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="tutorial-header">
          <div className="tutorial-header-info">
            <div className="tutorial-badge-pill">
              <BookOpen size={13} />
              <span>Panduan Pengguna Sahabat Ibadah</span>
            </div>
            <h2>Pusat Tutorial & Pengenalan Fitur</h2>
            <p>
              Panduan interaktif langkah demi langkah bagi Guru dan Orang Tua untuk mendampingi kebiasaan ibadah santri secara optimal.
            </p>
          </div>

          <button
            className="tutorial-close-btn"
            onClick={onClose}
            title="Tutup Panduan (Esc)"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Role Switcher */}
        <div className="tutorial-tab-bar">
          <button
            className={`tutorial-tab-btn ${activeTab === "teacher" ? "active" : ""}`}
            onClick={() => setActiveTab("teacher")}
          >
            <GraduationCap size={16} />
            <span>Panduan Guru & Wali Kelas</span>
          </button>
          <button
            className={`tutorial-tab-btn ${activeTab === "parent" ? "active" : ""}`}
            onClick={() => setActiveTab("parent")}
          >
            <Users size={16} />
            <span>Panduan Orang Tua / Wali</span>
          </button>
        </div>

        {/* Konten Panduan */}
        <div className="tutorial-body">
          {/* =============================================================== */}
          {/* TAB PANDUAN GURU */}
          {/* =============================================================== */}
          {activeTab === "teacher" && (
            <div className="tutorial-content-stack">
              {/* Alur Cepat 3 Langkah Guru */}
              <div className="quickstart-card">
                <div className="quickstart-header">
                  <Sparkles size={16} color="#109b83" />
                  <strong>Alur Cepat Penggunaan untuk Guru (3 Menit)</strong>
                </div>
                <div className="quickstart-steps-grid">
                  <div className="quickstart-step">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Kelola Siswa & Akun</strong>
                      <p>Input data santri, pasang foto, dan buatkan akun login untuk orang tua.</p>
                    </div>
                  </div>
                  <div className="quickstart-step">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Pantau Mutaba'ah</strong>
                      <p>Lihat grafik mingguan dan daftar siswa yang butuh bimbingan amalan.</p>
                    </div>
                  </div>
                  <div className="quickstart-step">
                    <span className="step-num">3</span>
                    <div>
                      <strong>Evaluasi & Komunikasi</strong>
                      <p>Tulis catatan rapor berkala dan berkonsultasi langsung lewat chat.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bab 1: Dashboard Guru */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 1</div>
                <h3>Dashboard & Ringkasan Kelas</h3>
                <p className="chapter-desc">
                  Halaman beranda guru menyajikan metrik kepatuhan ibadah seluruh kelas secara real-time, memudahkan pemantauan harian.
                </p>
                <ul className="chapter-points">
                  <li><strong>Tingkat Kepatuhan:</strong> Memantau rata-rata kepatuhan ibadah santri dalam satu kelas.</li>
                  <li><strong>Siswa Butuh Perhatian:</strong> Daftar santri yang tingkat ketercapaian amalannya menurun untuk segera dibimbing.</li>
                  <li><strong>Santri Paling Aktif:</strong> Mengapresiasi siswa dengan rangkaian konsistensi ibadah tertinggi (rangkaian konsisten).</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/guru-dashboard.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/guru-dashboard.png"
                    alt="Dashboard Ringkasan Guru"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Tampilan Dashboard Guru: Ringkasan statistik, grafik keaktifan, dan santri berprestasi.
                  </span>
                </div>

                <div className="tutorial-tip-box">
                  <div className="tip-title">💡 Tips Guru:</div>
                  <p>Gunakan kartu "Butuh Perhatian" saat apel pagi untuk memberikan motivasi lembut kepada santri yang belum rutin mengisi mutaba'ah.</p>
                </div>
              </div>

              {/* Bab 2: Daftar Siswa & Buat Akun Ortu */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 2</div>
                <h3>Daftar Siswa, Edit Foto & Akun Orang Tua</h3>
                <p className="chapter-desc">
                  Guru memiliki wewenang penuh untuk mendata siswa di kelasnya, mengunggah foto profil santri, serta membuatkan akun login orang tua.
                </p>
                <ul className="chapter-points">
                  <li><strong>Tambah Siswa:</strong> Masukkan nama lengkap, nama panggilan, nomor induk, dan kelas.</li>
                  <li><strong>Edit Foto Santri:</strong> Klik tombol edit siswa untuk mengunggah foto anak agar tampil di portal mutaba'ah.</li>
                  <li><strong>Buat Akun Orang Tua:</strong> Klik tombol <em>"Buat Akun Ortu"</em>, tentukan email dan password, lalu bagikan ke wali murid yang bersangkutan.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/guru-daftar-siswa.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/guru-daftar-siswa.png"
                    alt="Manajemen Siswa dan Akun Orang Tua"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Panel Daftar Siswa: Mengunggah foto profil santri dan mengaktifkan akses akun orang tua.
                  </span>
                </div>

                <div className="tutorial-tip-box">
                  <div className="tip-title">🔒 Keamanan Kredensial:</div>
                  <p>Simpan kredensial akun orang tua dengan baik dan bagikan langsung kepada wali murid melalui WhatsApp resmi.</p>
                </div>
              </div>

              {/* Bab 3: Laporan Mingguan */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 3</div>
                <h3>Laporan Mingguan & Catatan Evaluasi Guru</h3>
                <p className="chapter-desc">
                  Menganalisis perkembangan tiap jenis amalan (shalat fardhu berjamaah, dhuha, tadarus Al-Qur'an, dan sedekah) secara mingguan.
                </p>
                <ul className="chapter-points">
                  <li><strong>Breakdown Amalan:</strong> Melihat persentase ketuntasan tiap amalan per siswa maupun per kelas.</li>
                  <li><strong>Tulis Evaluasi Guru:</strong> Menambahkan catatan evaluasi mingguan. Catatan ini akan otomatis masuk ke lembar rapor resmi anak!</li>
                  <li><strong>Ekspor & Arsip:</strong> Mengunduh rekapitulasi nilai untuk kebutuhan arsip kurikulum pembinaan karakter.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/guru-laporan.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/guru-laporan.png"
                    alt="Laporan Mingguan Guru"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Laporan Mingguan: Grafik pencapaian per santri dan kolom catatan evaluasi pembina.
                  </span>
                </div>
              </div>

              {/* Bab 4: Pesan Orang Tua */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 4</div>
                <h3>Pesan & Konsultasi Wali Murid</h3>
                <p className="chapter-desc">
                  Saluran komunikasi langsung antara guru wali kelas dan orang tua tanpa perlu membagikan nomor pribadi jika diinginkan.
                </p>
                <ul className="chapter-points">
                  <li><strong>Daftar Percakapan:</strong> Memilih santri atau orang tua yang ingin dihubungi.</li>
                  <li><strong>Foto Profil Nyata:</strong> Foto guru dan foto orang tua tampil berdampingan secara jelas pada gelembung obrolan.</li>
                  <li><strong>Pesan Waktu Nyata:</strong> Memberitahukan perkembangan positif santri di sekolah kepada orang tua.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/guru-pesan.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/guru-pesan.png"
                    alt="Pesan Orang Tua"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Fitur Chat: Percakapan interaktif dengan foto profil guru dan orang tua yang jelas.
                  </span>
                </div>
              </div>

              {/* Bab 5: Pengaturan & Ganti Logo Sekolah */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 5</div>
                <h3>Profil Guru & Ganti Logo Resmi Sekolah</h3>
                <p className="chapter-desc">
                  Guru dapat memperbarui profil diri serta mengunggah logo resmi sekolah yang akan tersinkronisasi ke seluruh akun orang tua.
                </p>
                <ul className="chapter-points">
                  <li><strong>Profil Guru:</strong> Mengganti nama lengkap, nomor kontak, dan mengunggah foto profil diri.</li>
                  <li><strong>Ganti Logo Sekolah:</strong> Mengunggah logo resmi sekolah berformat PNG/JPG.</li>
                  <li><strong>Otomatisasi Kop Rapor:</strong> Logo sekolah otomatis tampil di kop rapor PDF, Word, dan halaman utama orang tua.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/guru-pengaturan.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/guru-pengaturan.png"
                    alt="Pengaturan Profil dan Logo Sekolah"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Halaman Pengaturan: Form penggantian foto profil guru dan logo sekolah.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB PANDUAN ORANG TUA */}
          {/* =============================================================== */}
          {activeTab === "parent" && (
            <div className="tutorial-content-stack">
              {/* Alur Cepat 3 Langkah Ortu */}
              <div className="quickstart-card">
                <div className="quickstart-header">
                  <Sparkles size={16} color="#109b83" />
                  <strong>Alur Cepat Penggunaan untuk Orang Tua (3 Menit)</strong>
                </div>
                <div className="quickstart-steps-grid">
                  <div className="quickstart-step">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Login & Pilih Anak</strong>
                      <p>Masuk dengan akun dari guru dan pilih nama ananda yang didampingi.</p>
                    </div>
                  </div>
                  <div className="quickstart-step">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Checklist Setiap Hari</strong>
                      <p>Centang ibadah yang telah dikerjakan ananda di rumah lalu simpan.</p>
                    </div>
                  </div>
                  <div className="quickstart-step">
                    <span className="step-num">3</span>
                    <div>
                      <strong>Cetak Rapor Mutaba'ah</strong>
                      <p>Unduh dokumen resmi PDF / Word / CSV bertanda tangan otomatis.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bab 1: Checklist Harian Ortu */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 1</div>
                <h3>Checklist Harian Mutaba'ah Ibadah di Rumah</h3>
                <p className="chapter-desc">
                  Mendampingi anak secara konsisten dengan mencentang amalan ibadah wajib dan sunnah yang berhasil dikerjakan.
                </p>
                <ul className="chapter-points">
                  <li><strong>Pilih Ananda:</strong> Jika memiliki lebih dari 1 santri, pilih nama anak dari menu pemilihan nama anak di atas.</li>
                  <li><strong>Centang Amalan:</strong> Shalat 5 Waktu (Subuh s/d Isya), Shalat Sunnah Dhuha & Rawatib, Tadarus Qur'an, Sedekah Subuh, serta Adab Harian.</li>
                  <li><strong>Tulis Catatan Harian:</strong> Tulis catatan perilaku atau kendala ananda untuk dibaca oleh guru wali kelas.</li>
                  <li><strong>Simpan Checklist:</strong> Tekan tombol "Simpan checklist ke Database" untuk menyimpan data ke sistem.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/ortu-checklist.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/ortu-checklist.png"
                    alt="Checklist Harian Orang Tua"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Tampilan Checklist Harian: Ramah diakses dari layar smartphone orang tua.
                  </span>
                </div>

                <div className="tutorial-tip-box">
                  <div className="tip-title">🌙 Waktu Terbaik Pengisian:</div>
                  <p>Luangkan waktu 5 menit bersama ananda setelah shalat Isya atau menjelang tidur untuk mengisi checklist sebagai momen apresiasi harian.</p>
                </div>
              </div>

              {/* Bab 2: Progres Anak & Lencana */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 2</div>
                <h3>Grafik Progres 14 Hari & Lencana Keberkahan</h3>
                <p className="chapter-desc">
                  Memantau perkembangan konsistensi ananda secara visual serta memotivasi mereka lewat lencana digital islami.
                </p>
                <ul className="chapter-points">
                  <li><strong>Grafik Konsistensi 14 Hari:</strong> Melihat diagram batang kepatuhan ibadah harian (dapat digeser menyamping di layar ponsel).</li>
                  <li><strong>Intisari Capaian:</strong> Ringkasan predikat kepatuhan (Mumtaz, Jayyid Jiddan, Jayyid).</li>
                  <li><strong>Persentase Amalan:</strong> Persentase ketercapaian tiap ibadah spesifik (misal: 100% Shalat Subuh).</li>
                  <li><strong>4 Lencana Keberkahan:</strong> Ananda dapat membuka lencana Pejuang Istiqomah, Penjaga Qur'an, Bintang Subuh, dan Hati Dermawan.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/ortu-progres.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/ortu-progres.png"
                    alt="Progres Anak dan Lencana Keberkahan"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Halaman Progres Anak: Grafik tren 14 hari dan grid 2x2 Lencana Keberkahan yang simetris.
                  </span>
                </div>
              </div>

              {/* Bab 3: Cetak Rapor PDF & Word */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 3</div>
                <h3>Laporan Rapor Mutaba'ah, Unduh PDF & Word</h3>
                <p className="chapter-desc">
                  Menghasilkan lembar laporan mutaba'ah resmi berstandar sekolah lengkap dengan tanda tangan otomatis wali kelas dan orang tua.
                </p>
                <ul className="chapter-points">
                  <li><strong>Pilihan Periode:</strong> Pilih rentang 7 hari terakhir atau 30 hari terakhir.</li>
                  <li><strong>Dua Mode Tampilan:</strong>
                    <br />• <em>Ringkasan Kartu:</em> Tampilan ringkas yang ramah layar smartphone.
                    <br />• <em>Kertas Dokumen:</em> Pratinjau lembar rapor resmi berformat A4.
                  </li>
                  <li><strong>Unduh PDF Resmi:</strong> Menghasilkan file PDF A4 tajam bebas tumpang tindih teks dan siap cetak.</li>
                  <li><strong>Unduh Word (.docx):</strong> Dokumen Microsoft Word dengan format selaras PDF dan dapat diedit.</li>
                  <li><strong>Tanda Tangan Otomatis:</strong> Nama orang tua (contoh: <em>Bunda Rina</em>) dan wali kelas (contoh: <em>Pak Andi</em>) otomatis tercetak di atas garis tanda tangan!</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/ortu-laporan.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/ortu-laporan.png"
                    alt="Laporan Rapor Mutaba'ah"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Halaman Rapor Mutaba'ah: Tombol unduh PDF, Word, CSV, dan pratinjau dokumen bertanda tangan.
                  </span>
                </div>

                <div className="tutorial-tip-box">
                  <div className="tip-title">📄 Rapor untuk Sekolah:</div>
                  <p>Saat pembagian rapor semester, unduh versi PDF atau Word ini dan cetak untuk diserahkan ke wali kelas sebagai bukti mutaba'ah ananda di rumah.</p>
                </div>
              </div>

              {/* Bab 4: Pesan dengan Guru */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 4</div>
                <h3>Konsultasi Langsung dengan Wali Kelas</h3>
                <p className="chapter-desc">
                  Ruang pesan privat untuk berkonsultasi seputar ibadah ananda langsung ke guru pembimbing.
                </p>
                <ul className="chapter-points">
                  <li><strong>Konsultasi Mudah:</strong> Bertanya tips mendampingi anak atau memberitahu bila ananda sedang sakit atau bepergian.</li>
                  <li><strong>Melihat Profil Guru:</strong> Foto profil wali kelas tampak di ruang pesan.</li>
                  <li><strong>Riwayat Tersimpan Aman:</strong> Seluruh catatan komunikasi tersimpan rapi dan terarsip.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/ortu-pesan.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/ortu-pesan.png"
                    alt="Pesan dengan Guru"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Ruang Pesan: Obrolan dua arah antara orang tua dan guru wali kelas.
                  </span>
                </div>
              </div>

              {/* Bab 5: Pengaturan Akun Orang Tua */}
              <div className="tutorial-chapter-card">
                <div className="chapter-badge">Langkah 5</div>
                <h3>Pengaturan Profil & Identitas Diri Wali Murid</h3>
                <p className="chapter-desc">
                  Memperbarui identitas diri orang tua, foto profil, nomor kontak WhatsApp, serta memantau daftar anak yang terhubung.
                </p>
                <ul className="chapter-points">
                  <li><strong>Identitas Diri:</strong> Pastikan nama lengkap dan nomor kontak WhatsApp sesuai karena nama orang tua akan otomatis tercantum pada lembar tanda tangan rapor.</li>
                  <li><strong>Foto Profil Asli:</strong> Unggah foto profil asli orang tua agar tampil jelas saat berdiskusi di menu pesan dengan guru.</li>
                  <li><strong>Daftar Anak Terhubung:</strong> Memeriksa nama ananda dan kelas yang didampingi di portal mutaba'ah keluarga.</li>
                </ul>

                <div
                  className="tutorial-image-card"
                  onClick={() => setSelectedImage("/tutorial/ortu-pengaturan.png")}
                  title="Klik untuk memperbesar gambar"
                >
                  <img
                    src="/tutorial/ortu-pengaturan.png"
                    alt="Pengaturan Akun Orang Tua"
                    loading="lazy"
                  />
                  <div className="image-overlay-hint">
                    <ZoomIn size={16} /> Klik untuk memperbesar
                  </div>
                  <span className="image-caption">
                    Pengaturan Profil: Edit identitas wali murid, foto avatar keluarga, dan daftar ananda yang didampingi.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION DEMO ANIMASI INTERAKTIF LANGSUNG (RESPONSIF & MULUS) */}
          {/* =============================================================== */}
          <div className="tutorial-video-card">
            <div className="demo-player-header">
              <div className="demo-player-title-wrap">
                <div className="demo-player-badge">
                  <Sparkles size={14} color="#109b83" />
                  <span>Demo Animasi Penggunaan Langsung ({activeTab === "teacher" ? "Panel Guru" : "Panel Orang Tua"})</span>
                </div>
                <h4>{currentDemo.title}: {currentDemo.subtitle}</h4>
                <p>{currentDemo.desc}</p>
              </div>

              {/* Controls */}
              <div className="demo-player-controls">
                <button
                  type="button"
                  className="demo-ctrl-btn"
                  onClick={() => setIsDemoPlaying(!isDemoPlaying)}
                  title={isDemoPlaying ? "Jeda Animasi Otomatis" : "Putar Animasi Otomatis"}
                >
                  {isDemoPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isDemoPlaying ? "Jeda" : "Putar"}</span>
                </button>

                <div className="demo-nav-arrows">
                  <button
                    type="button"
                    className="demo-arrow-btn"
                    onClick={() => {
                      setIsDemoPlaying(false);
                      setDemoStepIdx((prev) => (prev - 1 + currentSteps.length) % currentSteps.length);
                    }}
                    title="Langkah Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className="demo-arrow-btn"
                    onClick={() => {
                      setIsDemoPlaying(false);
                      setDemoStepIdx((prev) => (prev + 1) % currentSteps.length);
                    }}
                    title="Langkah Selanjutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Step Navigation Pills */}
            <div className="demo-step-pills">
              {currentSteps.map((step, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`demo-step-pill ${demoStepIdx === idx ? "active" : ""}`}
                  onClick={() => {
                    setIsDemoPlaying(false);
                    setDemoStepIdx(idx);
                  }}
                >
                  <span className="pill-dot">{idx + 1}</span>
                  <span className="pill-label">{step.subtitle}</span>
                </button>
              ))}
            </div>

            {/* Visual Frame */}
            <div
              className="demo-screen-container"
              onClick={() => setSelectedImage(currentDemo.img)}
              title="Klik untuk memperbesar tampilan demo"
            >
              <img
                src={currentDemo.img}
                alt={currentDemo.subtitle}
                className="demo-screen-img"
              />
              <div className="image-overlay-hint">
                <ZoomIn size={15} /> Klik untuk memperbesar layar
              </div>
              <div className="demo-screen-caption">
                <strong>{currentDemo.title}:</strong> {currentDemo.caption}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="tutorial-footer">
          <div className="tutorial-footer-tip">
            <span>✦</span> Butuh bantuan lebih lanjut? Hubungi admin sekolah atau gunakan tombol bantuan di aplikasi.
          </div>

          <div className="tutorial-footer-actions">
            <button className="tutorial-btn-secondary" onClick={onClose}>
              Tutup Panduan
            </button>
            {onLoginAction && (
              <button
                className="tutorial-btn-primary"
                onClick={() => {
                  onClose();
                  onLoginAction();
                }}
              >
                Mulai Masuk Sekarang <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Lightbox Zoom Gambar */}
        {selectedImage && (
          <div
            className="tutorial-lightbox"
            onClick={() => setSelectedImage(null)}
          >
            <div className="lightbox-dialog" onClick={(e) => e.stopPropagation()}>
              <button
                className="lightbox-close"
                onClick={() => setSelectedImage(null)}
                aria-label="Tutup zoom"
              >
                <X size={22} />
              </button>
              <img src={selectedImage} alt="Pratinjau Diperbesar" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
