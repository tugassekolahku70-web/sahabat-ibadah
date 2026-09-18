import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock,
  Compass,
  Copy,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileDown,
  FileSpreadsheet,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  Home as HomeIcon,
  Image as ImageIcon,
  Info,
  KeyRound,
  Leaf,
  LineChart,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Moon,
  PencilLine,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Save,
  School,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import api, {
  getStoredToken,
  getStoredUser,
  clearStoredSession,
  UserSession,
  WeeklyReportData,
  TeacherChatThread,
} from "@/lib/api";
import {
  exportReportToPDF,
  exportReportToWord,
  exportReportToCSV,
} from "@/lib/reportExport";
import TutorialModal from "@/components/TutorialModal";

const heroImage = "/assets/hero-family.png";
const homeImage = "/assets/home-family.png";

type Role = "parent" | "teacher";
type Tab = "overview" | "checklist" | "progress" | "habits" | "reports" | "messages" | "settings";

type Habit = {
  id: string;
  label: string;
  category: string;
  icon: any;
  color: string;
  checked: boolean;
  status: "completed" | "not_completed" | "not_reported";
  note?: string;
  version?: number;
};

const iconMap: Record<string, any> = {
  Sun,
  BookOpen,
  Moon,
  Heart,
  Star,
  Sparkles,
  ClipboardCheck,
  CheckSquare,
  Award,
  ShieldCheck,
  Clock,
  Smile,
  Compass,
  Leaf,
  CheckCircle2,
};

const categoryColorMap: Record<string, string> = {
  fajr: "amber",
  quran: "emerald",
  dhuhr: "orange",
  asr: "sky",
  maghrib: "violet",
  isha: "indigo",
  kindness: "rose",
  dua: "teal",
  ibadah_wajib: "amber",
  ibadah_harian: "emerald",
  kebiasaan_baik: "sky",
};

function formatDateIndo(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${dayNames[d.getDay()]}, ${day} ${monthNames[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dt = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dt}`;
}

const menuParent: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: HomeIcon },
  { id: "checklist", label: "Checklist Ibadah", icon: ClipboardCheck },
  { id: "progress", label: "Progres Anak", icon: LineChart },
  { id: "reports", label: "Laporan", icon: CalendarDays },
  { id: "messages", label: "Pesan", icon: MessageCircle },
  { id: "settings", label: "Pengaturan", icon: Settings },
];

const menuTeacher: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard Kelas", icon: HomeIcon },
  { id: "progress", label: "Daftar Siswa", icon: Users },
  { id: "habits", label: "Butir Ibadah", icon: Sparkles },
  { id: "reports", label: "Laporan Mingguan", icon: CalendarDays },
  { id: "messages", label: "Pesan Orang Tua", icon: MessageCircle },
  { id: "settings", label: "Pengaturan & Profil", icon: Settings },
];

function Logo() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><span>✦</span></div>
      <div>
        <div className="brand-name">Sahabat <b>Ibadah</b></div>
        <div className="brand-tagline">Tumbuh dalam kebaikan</div>
      </div>
    </div>
  );
}

function Avatar({
  initials = "FA",
  tone = "green",
  src = null,
  size = "normal",
}: {
  initials?: string;
  tone?: string;
  src?: string | null;
  size?: "small" | "normal" | "large";
}) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    const dim = size === "large" ? 56 : size === "small" ? 28 : 36;
    return (
      <img
        src={src}
        alt={initials}
        onError={() => setHasError(true)}
        className={`avatar avatar-${tone} avatar-img ${size === "large" ? "avatar-lg" : size === "small" ? "avatar-sm" : ""}`}
        style={{
          width: dim,
          height: dim,
          objectFit: "cover",
          borderRadius: "50%",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }
  return <div className={`avatar avatar-${tone} ${size === "large" ? "avatar-lg" : size === "small" ? "avatar-sm" : ""}`}>{initials}</div>;
}

function Ring({ value, label, tone = "teal", size = "large" }: { value: number; label: string; tone?: string; size?: "large" | "small" }) {
  const radius = size === "large" ? 47 : 31;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className={`ring-wrap ring-${size}`}>
      <svg viewBox="0 0 120 120" className="ring-svg" aria-label={`${label} ${value}%`}>
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle className={`ring-value ring-${tone}`} cx="60" cy="60" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="ring-copy"><strong>{value}%</strong><span>{label}</span></div>
    </div>
  );
}

function MiniBarChart({ bars = [42, 66, 58, 78, 63, 88, 74, 96, 82, 90, 71, 84] }: { bars?: number[] }) {
  return (
    <div className="mini-chart" aria-label="Grafik aktivitas dua belas hari">
      <div className="chart-y"><span>100%</span><span>50%</span><span>0%</span></div>
      <div className="bar-grid">
        {bars.map((height, i) => (
          <div className="bar-col" key={i}>
            <div className={`bar-fill ${i >= bars.length - 3 ? "bar-current" : ""}`} style={{ height: `${Math.max(6, height)}%` }} />
            <span>{["H-11", "H-10", "H-9", "H-8", "H-7", "H-6", "H-5", "H-4", "H-3", "H-2", "Kemarin", "Hari Ini"][i] || ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitRow({ habit, compact = false, onToggle }: { habit: Habit; compact?: boolean; onToggle?: (id: string) => void }) {
  const Icon = habit.icon || Sun;
  return (
    <div
      className={`habit-row ${habit.checked ? "is-checked" : ""} ${compact ? "compact" : ""}`}
      onClick={() => onToggle?.(habit.id)}
      style={{ cursor: "pointer" }}
    >
      <div className={`habit-icon icon-${habit.color}`}>
        <Icon size={compact ? 17 : 19} />
      </div>
      <div className="habit-copy">
        <strong>{habit.label}</strong>
        <span>{habit.note || habit.category}</span>
      </div>
      <div className={`check-box ${habit.checked ? "checked" : ""}`}>
        {habit.checked && <Check size={14} strokeWidth={3} />}
      </div>
    </div>
  );
}

// =============================================================================
// KOMPONEN HALAMAN ORANG TUA
// =============================================================================

function ParentOverview({
  user,
  child,
  childrenList,
  habits,
  completedCount,
  streak,
  points,
  chartBars,
  teacherNote,
  schoolInfo,
  onNavigate,
  onSelectChild,
  onGoToChecklistDate,
}: {
  user: UserSession | null;
  child: any;
  childrenList?: any[];
  habits: Habit[];
  completedCount: number;
  streak: number;
  points: number;
  chartBars: number[];
  teacherNote?: string;
  schoolInfo?: { name: string; logoUrl: string | null } | null;
  onNavigate: (tab: Tab) => void;
  onSelectChild?: (c: any) => void;
  onGoToChecklistDate?: (date: string) => void;
}) {
  const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
  return (
    <>
      {/* Banner Identitas Sekolah & Anak di Panel Orang Tua */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          background: "#ffffff",
          padding: "12px 18px",
          borderRadius: 14,
          border: "1px solid #dbeef5",
          boxShadow: "0 4px 14px rgba(35,110,95,0.04)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {schoolInfo?.logoUrl ? (
            <>
              <img
                src={schoolInfo.logoUrl}
                alt="Logo Sekolah"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const sib = e.currentTarget.nextElementSibling as HTMLElement;
                  if (sib) sib.style.display = "grid";
                }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  objectFit: "contain",
                  border: "1.5px solid #d4ece5",
                  background: "#f8fcfb",
                  padding: 2,
                }}
              />
              <div
                style={{
                  display: "none",
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #109f80, #0a7d65)",
                  color: "#fff",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                ✦
              </div>
            </>
          ) : (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "linear-gradient(135deg, #109f80, #0a7d65)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              ✦
            </div>
          )}
          <div>
            <span style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#8daea7", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              LEMBAGA PENDIDIKAN
            </span>
            <strong style={{ display: "block", fontSize: 13, color: "#164e43" }}>{schoolInfo?.name || "SD Islam Sahabat Ibadah"}</strong>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f4fbf8", padding: "6px 14px", borderRadius: 10, border: "1px solid #e1f2ec" }}>
          <Avatar initials={child?.preferred_name?.slice(0, 2).toUpperCase() || "AN"} src={child?.avatar_url} tone="pink" size="normal" />
          <div>
            <span style={{ display: "block", fontSize: 9, color: "#7a9b94" }}>
              {childrenList && childrenList.length > 1 ? "Pilih Siswa / Anak" : "Siswa Terhubung"}
            </span>
            {childrenList && childrenList.length > 1 ? (
              <select
                value={child?.id}
                onChange={(e) => {
                  const sel = childrenList.find((c) => c.id === e.target.value);
                  if (sel && onSelectChild) onSelectChild(sel);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#185347",
                  outline: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.class_name || c.grade_level || "Siswa"})
                  </option>
                ))}
              </select>
            ) : (
              <strong style={{ display: "block", fontSize: 12, color: "#245248" }}>{child?.full_name || "Ahmad"}</strong>
            )}
          </div>
        </div>
      </div>

      <section className="welcome-card">
        <div className="welcome-copy">
          <div className="eyebrow">
            Hari ini <span className="live-dot" /> Hari ke-{streak} berturut-turut
          </div>
          <h1>
            Assalamu'alaikum,<br />
            <em>{user?.fullName || "Bunda Rina"}</em>
          </h1>
          <p>Semangat mendampingi {child?.preferred_name || "Ahmad"} menumbuhkan kebiasaan baiknya hari ini. Setiap langkah kecil berarti.</p>
          <div className="welcome-actions">
            <button className="primary-button" onClick={() => onNavigate("checklist")}>
              <ClipboardCheck size={17} /> Isi checklist hari ini
            </button>
            <button
              className="ghost-button"
              onClick={() => {
                if (onGoToChecklistDate) {
                  onGoToChecklistDate(getYesterdayStr());
                } else {
                  onNavigate("checklist");
                }
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              title="Lengkapi mutaba'ah hari kemarin yang belum sempat dicentang"
            >
              <CalendarDays size={16} /> Isi Tanggal Kemarin
            </button>
            <button className="ghost-button" onClick={() => onNavigate("progress")}>
              Lihat progres <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
        <div className="welcome-illustration">
          <img src={heroImage} alt="Keluarga mendampingi anak membaca Al-Qur'an" />
          <div className="floating-badge">
            <div className="mini-badge-icon"><Check size={14} /></div>
            <div><b>Rutinitas baik</b><span>{streak} hari beruntun</span></div>
          </div>
        </div>
      </section>

      <div className="stats-row">
        <div className="stat-card stat-green">
          <div className="stat-icon"><CheckCircle2 size={19} /></div>
          <div>
            <span>Checklist hari ini</span>
            <strong>{completedCount}<small>/{habits.length}</small></strong>
            <p>{percentage >= 75 ? "Bagus sekali, Bunda!" : "Sedikit lagi selesai"}</p>
          </div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-icon"><Flame size={19} /></div>
          <div>
            <span>Hari konsisten</span>
            <strong>{streak} <small>hari</small></strong>
            <p>Terus jaga semangatnya</p>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><Star size={19} /></div>
          <div>
            <span>Poin kebaikan</span>
            <strong>{points} <small>pts</small></strong>
            <p><ArrowUpRight size={13} /> Terus bertambah</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <section className="panel checklist-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">Kebiasaan hari ini</div>
              <h2>Checklist ibadah {child?.preferred_name || "Ahmad"}</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate("checklist")}>
              Lihat semua <ChevronRight size={16} />
            </button>
          </div>
          <div className="habit-list">
            {habits.slice(0, 5).map((habit) => (
              <HabitRow key={habit.id} habit={habit} compact />
            ))}
          </div>
          {teacherNote && (
            <div className="panel-footer-note">
              <Sparkles size={16} />
              <span><b>Catatan dari guru:</b> “{teacherNote}”</span>
            </div>
          )}
        </section>

        <section className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">Ringkasan progres</div>
              <h2>Hari ini</h2>
            </div>
            <button className="more-button"><MoreHorizontal size={18} /></button>
          </div>
          <div className="progress-summary">
            <Ring value={percentage} label="Total progres" tone="teal" />
            <div className="progress-legend">
              <div><span className="legend-dot green" /><span>Ibadah wajib</span><b>{percentage >= 60 ? "80%" : "60%"}</b></div>
              <div><span className="legend-dot yellow" /><span>Kebiasaan baik</span><b>85%</b></div>
              <div><span className="legend-dot purple" /><span>Ibadah sunnah</span><b>70%</b></div>
            </div>
          </div>
          <button className="outline-button full-width" onClick={() => onNavigate("progress")}>
            Lihat detail progres <ArrowUpRight size={16} />
          </button>
        </section>
      </div>

      <section className="bottom-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">Aktivitas ibadah</div>
              <h2>Performa 12 hari terakhir (Database Real)</h2>
            </div>
            <button className="filter-pill">12 hari <ChevronDown size={14} /></button>
          </div>
          <MiniBarChart bars={chartBars} />
        </div>
        <div className="panel encouragement-panel">
          <div className="encouragement-top">
            <div className="sun-icon"><Sun size={22} /></div>
            <span>Pesan untuk {child?.preferred_name || "Ananda"}</span>
          </div>
          <p>“Kebiasaan baik adalah hadiah kecil yang kamu berikan untuk dirimu setiap hari.”</p>
          <div className="encouragement-by">
            <Avatar initials="BR" tone="pink" />
            <span>Dari {user?.fullName || "Bunda"}</span>
            <Heart size={16} fill="currentColor" />
          </div>
        </div>
      </section>
    </>
  );
}

function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const todayStr = getTodayStr();
  const [currentYear, setCurrentYear] = useState(() => {
    return Number(selectedDate.split("-")[0]) || new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    return (Number(selectedDate.split("-")[1]) || (new Date().getMonth() + 1)) - 1;
  });

  useEffect(() => {
    if (isOpen && selectedDate) {
      const parts = selectedDate.split("-").map(Number);
      if (parts.length === 3) {
        setCurrentYear(parts[0]);
        setCurrentMonth(parts[1] - 1);
      }
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const yearOptions = [2024, 2025, 2026, 2027];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
      <div className="panel" style={{ width: "100%", maxWidth: 380, padding: 22, background: "#fff", borderRadius: 18, border: "1px solid #cbe3dc", boxShadow: "0 20px 45px rgba(10,48,40,.22)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e8f7f2", color: "#0c9d80", display: "grid", placeItems: "center" }}>
              <CalendarDays size={18} />
            </div>
            <div>
              <strong style={{ fontSize: 14, color: "#174e46" }}>Pilih Tanggal Checklist</strong>
              <div style={{ fontSize: 10, color: "#597c74" }}>Lengkapi amalan yang terlewat</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#618b80" }}>
            <X size={18} />
          </button>
        </div>

        {/* Month & Year Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14, background: "#f8faf9", padding: "6px 10px", borderRadius: 10, border: "1px solid #e1ede8" }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="ghost-button"
            style={{ padding: "4px 8px", borderRadius: 6, cursor: "pointer", border: "none" }}
            title="Bulan Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbe3dc", fontSize: 12, fontWeight: 700, color: "#164e43", background: "#fff", cursor: "pointer" }}
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbe3dc", fontSize: 12, fontWeight: 700, color: "#164e43", background: "#fff", cursor: "pointer" }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="ghost-button"
            style={{ padding: "4px 8px", borderRadius: 6, cursor: "pointer", border: "none" }}
            title="Bulan Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#7a9b94", marginBottom: 6 }}>
          {dayLabels.map((lbl, i) => (
            <div key={i} style={{ color: i === 0 ? "#dc2626" : i === 5 ? "#0c9d80" : "#597c74" }}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`blank-${i}`} style={{ height: 34 }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isFuture = dateStr > todayStr;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dayNum}
                type="button"
                disabled={isFuture}
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                style={{
                  height: 34,
                  borderRadius: 8,
                  border: isToday ? "1.5px solid #0c9d80" : "1px solid transparent",
                  background: isSelected
                    ? "#0c9d80"
                    : isToday
                    ? "#e8f7f2"
                    : "transparent",
                  color: isSelected
                    ? "#ffffff"
                    : isFuture
                    ? "#c0d0cc"
                    : isToday
                    ? "#0c9d80"
                    : "#1c4940",
                  fontWeight: isSelected || isToday ? 700 : 500,
                  fontSize: 12,
                  cursor: isFuture ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  opacity: isFuture ? 0.45 : 1,
                }}
              >
                <span>{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid #edf4f1", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                onSelectDate(todayStr);
                onClose();
              }}
              style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, background: "#f0f8f5", color: "#166534" }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                onSelectDate(getYesterdayStr());
                onClose();
              }}
              style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, background: "#fffbeb", color: "#92400e" }}
            >
              Kemarin
            </button>
          </div>
          <button
            type="button"
            className="outline-button"
            onClick={onClose}
            style={{ fontSize: 11, padding: "5px 12px" }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistPage({
  child,
  habits,
  streak,
  parentNote,
  selectedDate,
  onSelectDate,
  onToggle,
  onSave,
  onNoteChange,
}: {
  child: any;
  habits: Habit[];
  streak: number;
  parentNote: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggle: (id: string) => void;
  onSave: () => void;
  onNoteChange: (note: string) => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();
  const isBackdate = selectedDate < todayStr;
  const isNextDisabled = selectedDate >= todayStr;

  const preferredOrder = ["Ibadah wajib", "Ibadah harian", "Kebiasaan baik"];
  const presentCategories = Array.from(new Set(habits.map((h) => h.category).filter(Boolean)));
  const categories = Array.from(new Set([...preferredOrder, ...presentCategories])).filter(
    (cat) => habits.some((h) => h.category === cat)
  );

  const completedCount = habits.filter((h) => h.checked).length;
  const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <section className="page-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">{isBackdate ? formatDateIndo(selectedDate) : "Hari ini"}</div>
          <h1>{isBackdate ? "Checklist Ibadah (Tanggal Lampau)" : "Checklist Ibadah Harian"}</h1>
          <p>
            {isBackdate
              ? `Lengkapi catatan ibadah ${child?.preferred_name || "anak"} yang terlewat untuk tanggal ${formatDateIndo(selectedDate)}.`
              : `Centang kebiasaan baik ${child?.preferred_name || "anak"} yang sudah dilakukan hari ini.`}
          </p>
        </div>
        <button className="primary-button" onClick={onSave}>
          <CheckCircle2 size={17} /> Simpan checklist ke Database
        </button>
      </div>

      {/* Navigasi Kalender & Backdate Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isBackdate ? "#fffbeb" : "#ffffff",
          padding: "10px 16px",
          borderRadius: 14,
          border: isBackdate ? "1px solid #fde68a" : "1px solid #dbeef5",
          boxShadow: "0 2px 8px rgba(35,110,95,0.04)",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* Left: Previous / Next Date Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => onSelectDate(addDaysToStr(selectedDate, -1))}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #cbe3dc",
              background: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#164e43",
            }}
            title="1 Hari Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isBackdate ? "#fef3c7" : "#e8f7f2",
                color: isBackdate ? "#b45309" : "#0c9d80",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CalendarDays size={17} />
            </div>
            <div>
              <strong style={{ fontSize: 13, color: isBackdate ? "#92400e" : "#164e43", display: "block" }}>
                {formatDateIndo(selectedDate)}
              </strong>
              <span style={{ fontSize: 10, color: isBackdate ? "#b45309" : "#618b80", fontWeight: 600 }}>
                {selectedDate === todayStr
                  ? "● Hari Ini (Aktif)"
                  : selectedDate === yesterdayStr
                  ? "⚠️ Kemarin (Terlewat)"
                  : "⚠️ Tanggal Lampau (Terlewat)"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isNextDisabled}
            onClick={() => onSelectDate(addDaysToStr(selectedDate, 1))}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #cbe3dc",
              background: isNextDisabled ? "#f3f4f6" : "#fff",
              display: "grid",
              placeItems: "center",
              cursor: isNextDisabled ? "not-allowed" : "pointer",
              color: isNextDisabled ? "#9ca3af" : "#164e43",
              opacity: isNextDisabled ? 0.5 : 1,
            }}
            title="1 Hari Berikutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Quick Action Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onSelectDate(todayStr)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              border: selectedDate === todayStr ? "1.5px solid #0c9d80" : "1px solid #d4ebe5",
              background: selectedDate === todayStr ? "#0c9d80" : "#fff",
              color: selectedDate === todayStr ? "#fff" : "#185347",
              cursor: "pointer",
            }}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(yesterdayStr)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              border: selectedDate === yesterdayStr ? "1.5px solid #d97706" : "1px solid #fde68a",
              background: selectedDate === yesterdayStr ? "#d97706" : "#fffbeb",
              color: selectedDate === yesterdayStr ? "#fff" : "#92400e",
              cursor: "pointer",
            }}
          >
            Kemarin
          </button>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              border: "1px solid #b2ded1",
              background: "#e8f7f2",
              color: "#166534",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Calendar size={13} /> Pilih Tanggal
          </button>
        </div>
      </div>

      {/* Banner Peringatan Backdate */}
      {isBackdate && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", color: "#b45309", display: "grid", placeItems: "center" }}>
              <CalendarDays size={18} />
            </div>
            <div>
              <strong style={{ fontSize: 13, color: "#92400e" }}>Mode Mengisi Checklist Terlewat ({formatDateIndo(selectedDate)})</strong>
              <div style={{ fontSize: 11, color: "#b45309" }}>
                Centang ibadah yang terlaksana pada hari ini. Skor, poin, dan histori akan otomatis disinkronkan.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectDate(todayStr)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: "#0c9d80",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Kembali ke Hari Ini
          </button>
        </div>
      )}

      <div className="child-switcher">
        <Avatar initials="AF" tone="blue" />
        <div>
          <strong>{child?.full_name || "Ahmad Fauzan"}</strong>
          <span>{child?.grade_level || "Kelas 4 SD"} · {formatDateIndo(selectedDate)}</span>
        </div>
        <ChevronDown size={17} />
      </div>

      <div className="checklist-layout">
        <div className="panel checklist-form">
          {categories.map((category) => (
            <div className="category-block" key={category}>
              <div className="category-title">
                <span>{category}</span>
                <small>
                  {habits.filter((h) => h.category === category && h.checked).length}/
                  {habits.filter((h) => h.category === category).length} selesai
                </small>
              </div>
              {habits
                .filter((h) => h.category === category)
                .map((habit) => (
                  <HabitRow key={habit.id} habit={habit} onToggle={onToggle} />
                ))}
            </div>
          ))}

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #edf4f1" }}>
            <div className="category-title" style={{ marginBottom: 8 }}>
              <span>Catatan Tambahan untuk Guru</span>
            </div>
            <textarea
              value={parentNote}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Tuliskan catatan aktivitas kebaikan atau kendala ibadah hari ini..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "9px",
                border: "1px solid #d9eaeb",
                fontFamily: "inherit",
                fontSize: "11px",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          <div className="checklist-tip">
            <Info size={18} />
            <span>Checklist tersimpan permanen di database lokal SQLite dan siap ditinjau guru.</span>
          </div>
        </div>

        <aside className="panel today-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">{isBackdate ? "Progres tanggal ini" : "Progres hari ini"}</div>
              <h2>{child?.full_name || "Ahmad Fauzan"}</h2>
            </div>
            <MoreHorizontal size={18} />
          </div>
          <div className="today-ring">
            <Ring value={percentage} label="selesai" />
          </div>
          <div className="today-stat">
            <span>{isBackdate ? "Capaian tanggal ini" : "Target hari ini"}</span>
            <b>{completedCount} dari {habits.length} kebiasaan</b>
          </div>
          <div className="streak-card">
            <Flame size={21} />
            <div>
              <strong>{streak} hari konsisten</strong>
              <span>Terus pertahankan ya!</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Pop up Kalender Modal */}
      <CalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />
    </section>
  );
}

// =============================================================================
// KOMPONEN HALAMAN GURU (MANAJEMEN KELAS & SISWA TERISOLASI)
// =============================================================================

function TeacherOverview({
  teacher,
  classes,
  activeClassId,
  students,
  summary,
  attentionList,
  onSelectClass,
  onOpenAddClass,
  onOpenAddStudent,
  onOpenEditStudent,
  onDeleteStudent,
  onDeleteClass,
  onNavigate,
}: {
  teacher: any;
  classes: any[];
  activeClassId: string;
  students: any[];
  summary: any;
  attentionList: any[];
  onSelectClass: (id: string) => void;
  onOpenAddClass: () => void;
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: any) => void;
  onDeleteStudent: (studentId: string, name: string) => void;
  onDeleteClass: (classId: string, name: string) => void;
  onNavigate: (tab: Tab) => void;
}) {
  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];

  return (
    <>
      <section className="teacher-hero">
        <div>
          <div className="eyebrow">
            {teacher?.school_name || "SD Islam Sahabat Ibadah"} <span className="live-dot" /> Ruang Guru Terisolasi
          </div>
          <h1>
            Assalamu'alaikum,<br />
            <em>{teacher?.full_name || "Pak Guru"}</em>
          </h1>
          <p>
            Kelola kebiasaan ibadah siswa {activeClass?.name || "Kelas"} secara aman dan terpisah dari guru lainnya.
          </p>
          <div className="teacher-actions">
            <button className="primary-button" onClick={() => onNavigate("progress")}>
              <Users size={17} /> Kelola Siswa ({students.length})
            </button>
            <button className="light-button" onClick={onOpenAddStudent}>
              <Plus size={16} /> Tambah Siswa Baru
            </button>
            <button className="light-button" onClick={onOpenAddClass}>
              <Plus size={16} /> Tambah Kelas
            </button>
          </div>
        </div>
        <div className="teacher-hero-orb">
          <GraduationCap size={62} strokeWidth={1.2} />
          <div className="orb-spark spark-one">✦</div>
          <div className="orb-spark spark-two">✦</div>
        </div>
      </section>

      {/* Baris Pemilihan Kelas Guru */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 0 10px", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7a9590" }}>PILIH KELAS AKTIF:</span>
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectClass(c.id)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                background: c.id === activeClassId ? "#0c9d80" : "#fff",
                color: c.id === activeClassId ? "#fff" : "#325c54",
                border: "1px solid #d4ebe5",
                cursor: "pointer",
                boxShadow: c.id === activeClassId ? "0 4px 10px rgba(12,157,128,0.2)" : "none",
              }}
            >
              {c.name} ({c.student_count || 0} siswa)
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="outline-button" onClick={onOpenAddClass}>
            <Plus size={14} /> Buat Kelas Baru
          </button>
          {classes.length > 1 && activeClass && (
            <button
              className="outline-button"
              style={{ color: "#d25a5c", borderColor: "#f3d5d6" }}
              onClick={() => onDeleteClass(activeClass.id, activeClass.name)}
            >
              <Trash2 size={14} /> Hapus Kelas Ini
            </button>
          )}
        </div>
      </div>

      <div className="stats-row teacher-stats">
        <div className="stat-card stat-green">
          <div className="stat-icon"><Users size={19} /></div>
          <div>
            <span>Total siswa {activeClass?.name}</span>
            <strong>{students.length} <small>siswa</small></strong>
            <p>Data tersimpan di database lokal</p>
          </div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-icon"><Target size={19} /></div>
          <div>
            <span>Rata-rata kelas</span>
            <strong>{summary?.averageClassRate || 0}<small>%</small></strong>
            <p><ArrowUpRight size={13} /> Berdasarkan checklist hari ini</p>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><ShieldCheck size={19} /></div>
          <div>
            <span>Kepatuhan laporan</span>
            <strong>{summary?.complianceRate || 0}<small>%</small></strong>
            <p>{summary?.reportedCount || 0} dari {students.length} siswa mengisi</p>
          </div>
        </div>
      </div>

      <div className="content-grid teacher-content">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">Ringkasan {activeClass?.name}</div>
              <h2>Daftar Siswa & Status Checklist</h2>
            </div>
            <button className="primary-button" onClick={onOpenAddStudent}>
              <Plus size={14} /> Tambah Siswa
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            {students.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "#8aa5a0", fontSize: "11px" }}>
                Belum ada siswa di kelas ini. Klik tombol <b>Tambah Siswa Baru</b> di atas.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {students.map((s, idx) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "#f8fcfb",
                      border: "1px solid #edf4f1",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#9cb1ad", width: 18 }}>
                        0{idx + 1}
                      </span>
                      <Avatar initials={s.preferred_name?.slice(0, 2).toUpperCase() || "SW"} tone={idx % 2 === 0 ? "blue" : "pink"} />
                      <div>
                        <strong style={{ display: "block", fontSize: 11, color: "#254e46" }}>{s.full_name}</strong>
                        <span style={{ fontSize: 9, color: "#8ea7a2" }}>{s.statusLabel}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: s.todayProgress >= 75 ? "#e4f7f1" : s.todayProgress > 0 ? "#fff4da" : "#f1f3f4",
                          color: s.todayProgress >= 75 ? "#0c9d80" : s.todayProgress > 0 ? "#d99723" : "#7c938f",
                        }}
                      >
                        {s.todayProgress}%
                      </span>
                      <button
                        onClick={() => onOpenEditStudent(s)}
                        title="Edit data siswa"
                        style={{ padding: 6, background: "none", color: "#36907c" }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteStudent(s.id, s.full_name)}
                        title="Keluarkan/hapus siswa"
                        style={{ padding: 6, background: "none", color: "#d55f61" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel top-students">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">Apresiasi siswa</div>
              <h2>Progres Terbaik {activeClass?.name}</h2>
            </div>
          </div>
          {summary?.topStudents && summary.topStudents.length > 0 ? (
            summary.topStudents.map((student: any) => (
              <div className="student-row" key={student.name}>
                <span className="rank">0{student.rank}</span>
                <Avatar initials={student.initials} tone="blue" />
                <div className="student-name">
                  <strong>{student.name}</strong>
                  <span>{activeClass?.name}</span>
                </div>
                <div className="student-progress">
                  <div><span style={{ width: `${student.rate}%` }} /></div>
                  <b>{student.rate}%</b>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#9cb1ad", fontSize: 11, margin: "20px 0" }}>Belum ada data progres untuk dirangkum.</p>
          )}
        </section>
      </div>

      <section className="panel attention-panel">
        <div className="panel-heading">
          <div>
            <div className="section-kicker">Perlu perhatian</div>
            <h2>Siswa yang belum mengisi hari ini ({attentionList?.length || 0})</h2>
          </div>
          <button className="outline-button" onClick={() => onNavigate("messages")}>
            Kirim pengingat ke Orang Tua <MessageCircle size={15} />
          </button>
        </div>
        <div className="attention-list">
          {attentionList && attentionList.length > 0 ? (
            attentionList.map((item) => (
              <div className="attention-item" key={item.id}>
                <Avatar initials={item.name.slice(0, 2).toUpperCase()} tone="orange" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                </div>
                <button className="icon-button"><MessageCircle size={17} /></button>
              </div>
            ))
          ) : (
            <p style={{ color: "#7a9d94", fontSize: 11, padding: 12 }}>Alhamdulillah, seluruh siswa telah mengisi checklist hari ini.</p>
          )}
        </div>
      </section>
    </>
  );
}

// =============================================================================
// TAB DAFTAR SISWA GURU (KELOLA SISWA, FOTO SISWA, & BUAT AKUN ORANG TUA)
// =============================================================================

function TeacherStudentList({
  classes,
  activeClassId,
  students,
  onSelectClass,
  onOpenAddStudent,
  onOpenEditStudent,
  onDeleteStudent,
  onOpenParentAccount,
  onOpenResetParentPassword,
  onOpenChatWithStudent,
  onOpenBulkStudent,
}: {
  classes: any[];
  activeClassId: string;
  students: any[];
  onSelectClass: (id: string) => void;
  onOpenAddStudent: () => void;
  onOpenEditStudent: (student: any) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onOpenParentAccount: (student: any) => void;
  onOpenResetParentPassword: (student: any) => void;
  onOpenChatWithStudent: (student: any) => void;
  onOpenBulkStudent: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "no_parent" | "active_parent" | "completed">("all");

  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.preferred_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.parent_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.parent_email?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "no_parent") return !s.hasParentAccount;
      if (statusFilter === "active_parent") return s.hasParentAccount;
      if (statusFilter === "completed") return s.todayProgress >= 80;

      return true;
    });
  }, [students, search, statusFilter]);

  const studentsWithParent = students.filter((s) => s.hasParentAccount).length;

  return (
    <div className="page-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">Manajemen Siswa & Akses Login</div>
          <h1>Daftar Siswa & Panel Orang Tua</h1>
          <p>Kelola data siswa {activeClass?.name}, ganti foto profil siswa, dan buat akun login ke panel orang tua.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onOpenBulkStudent}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: "#e8f7f2",
              color: "#166534",
              border: "1px solid #b2ded1",
              cursor: "pointer",
            }}
          >
            <Upload size={15} /> Pendaftaran Masal (Import)
          </button>
          <button className="primary-button" onClick={onOpenAddStudent}>
            <UserPlus size={16} /> Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Baris Pemilihan Kelas */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "4px 0" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#7a9590" }}>PILIH KELAS:</span>
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectClass(c.id)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              background: c.id === activeClassId ? "#0c9d80" : "#fff",
              color: c.id === activeClassId ? "#fff" : "#325c54",
              border: "1px solid #d4ebe5",
              cursor: "pointer",
              boxShadow: c.id === activeClassId ? "0 4px 10px rgba(12,157,128,0.2)" : "none",
            }}
          >
            {c.name} ({c.student_count || 0} siswa)
          </button>
        ))}
      </div>

      {/* Ringkasan Akun */}
      <div className="stats-row" style={{ margin: "10px 0" }}>
        <div className="stat-card stat-green">
          <div className="stat-icon"><Users size={19} /></div>
          <div>
            <span>Total Siswa</span>
            <strong>{students.length} <small>anak</small></strong>
            <p>Terdaftar di {activeClass?.name}</p>
          </div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-icon"><UserCheck size={19} /></div>
          <div>
            <span>Akun Ortu Terhubung</span>
            <strong>{studentsWithParent} <small>/{students.length}</small></strong>
            <p>{students.length - studentsWithParent} siswa belum punya akun</p>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><KeyRound size={19} /></div>
          <div>
            <span>Login Orang Tua</span>
            <strong style={{ fontSize: 16 }}>Portal Siap Pakai</strong>
            <p>Dapat login langsung ke panel orang tua</p>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="panel" style={{ padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 280px", maxWidth: 420, background: "#f6faf9", padding: "8px 12px", borderRadius: 8, border: "1px solid #e1efe9" }}>
          <Search size={15} style={{ color: "#7a9b94" }} />
          <input
            type="text"
            placeholder="Cari nama siswa atau orang tua..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 11, color: "#224d45" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8aa5a0" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#8daea7" }}>FILTER:</span>
          {(
            [
              { id: "all", label: "Semua" },
              { id: "no_parent", label: "Belum Ada Akun Ortu" },
              { id: "active_parent", label: "Akun Ortu Aktif" },
              { id: "completed", label: "Checklist Lengkap" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 10,
                fontWeight: 700,
                background: statusFilter === f.id ? "#139c81" : "#f5faf8",
                color: statusFilter === f.id ? "#fff" : "#446b63",
                border: "1px solid",
                borderColor: statusFilter === f.id ? "#139c81" : "#e1eee9",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Siswa */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {filteredStudents.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#8aa5a0", fontSize: 11 }}>
            {search || statusFilter !== "all"
              ? "Tidak ada siswa yang sesuai dengan filter pencarian."
              : "Belum ada siswa di kelas ini. Klik Tambah Siswa Baru untuk menambahkan."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f8fbfb", borderBottom: "1.5px solid #e5f0ec", color: "#547a73", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", width: 50 }}>No</th>
                  <th style={{ padding: "12px 16px" }}>Profil Siswa & Foto</th>
                  <th style={{ padding: "12px 16px" }}>Kelas</th>
                  <th style={{ padding: "12px 16px" }}>Akun Login Orang Tua</th>
                  <th style={{ padding: "12px 16px" }}>Checklist Hari Ini</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #edf4f1", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 16px", color: "#9cb1ad", fontWeight: 700 }}>
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ position: "relative" }}>
                          <Avatar
                            initials={s.preferred_name?.slice(0, 2).toUpperCase() || s.full_name?.slice(0, 2).toUpperCase() || "SW"}
                            src={s.avatar_url}
                            tone={idx % 2 === 0 ? "blue" : "pink"}
                            size="normal"
                          />
                          <button
                            onClick={() => onOpenEditStudent(s)}
                            title="Ganti Foto Siswa"
                            style={{
                              position: "absolute",
                              right: -4,
                              bottom: -4,
                              background: "#0c9d80",
                              color: "#fff",
                              border: "2px solid #fff",
                              borderRadius: "50%",
                              width: 18,
                              height: 18,
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Camera size={10} />
                          </button>
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: 12, color: "#194d45" }}>{s.full_name}</strong>
                          <span style={{ fontSize: 9, color: "#8daaa4" }}>Panggilan: {s.preferred_name || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#456a62", fontWeight: 600 }}>
                      {s.grade_level || activeClass?.name || "Kelas 4 SD"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {s.hasParentAccount ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 7px",
                                borderRadius: 5,
                                fontSize: 9,
                                fontWeight: 700,
                                background: "#e1f7ef",
                                color: "#0c9779",
                                marginBottom: 3,
                              }}
                            >
                              <CheckCheck size={11} /> Akun Ortu Aktif
                            </span>
                            <div style={{ fontSize: 10, color: "#224e46", fontWeight: 600 }}>{s.parent_name}</div>
                            <div style={{ fontSize: 9, color: "#7a9b94" }}>{s.parent_email}</div>
                          </div>
                          <button
                            onClick={() => onOpenResetParentPassword(s)}
                            title="Reset Password Akun Orang Tua"
                            style={{
                              padding: "5px 8px",
                              borderRadius: 6,
                              background: "#f0f7f5",
                              border: "1px solid #d4ebe3",
                              color: "#188b75",
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <KeyRound size={11} /> Reset
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 7px",
                              borderRadius: 5,
                              fontSize: 9,
                              fontWeight: 700,
                              background: "#fff5db",
                              color: "#bf8516",
                            }}
                          >
                            Belum Ada Akun
                          </span>
                          <button
                            onClick={() => onOpenParentAccount(s)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 6,
                              background: "linear-gradient(135deg, #109f80, #0a7d65)",
                              color: "#fff",
                              border: "none",
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              boxShadow: "0 3px 8px rgba(16,159,128,0.18)",
                            }}
                          >
                            <UserPlus size={11} /> Buat Akun Ortu
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 64, height: 6, borderRadius: 99, background: "#edf4f1", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${s.todayProgress}%`,
                              borderRadius: 99,
                              background: s.todayProgress >= 80 ? "#11a382" : s.todayProgress > 0 ? "#e5a73b" : "#ccc",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            padding: "3px 7px",
                            borderRadius: 5,
                            fontSize: 9,
                            fontWeight: 700,
                            background: s.todayProgress >= 80 ? "#e4f7f1" : s.todayProgress > 0 ? "#fff4da" : "#f1f3f4",
                            color: s.todayProgress >= 80 ? "#0c9d80" : s.todayProgress > 0 ? "#d99723" : "#7c938f",
                          }}
                        >
                          {s.todayProgress}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => onOpenEditStudent(s)}
                          title="Edit nama, panggilan & foto siswa"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            background: "#f2f8f6",
                            border: "1px solid #d9eae4",
                            color: "#188b75",
                            cursor: "pointer",
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onOpenChatWithStudent(s)}
                          title="Kirim pesan ke orang tua"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            background: "#f0f8ff",
                            border: "1px solid #d3e5fa",
                            color: "#287bcc",
                            cursor: "pointer",
                          }}
                        >
                          <MessageCircle size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteStudent(s.id, s.full_name)}
                          title="Keluarkan siswa dari kelas"
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            background: "#fff2f2",
                            border: "1px solid #fadcdc",
                            color: "#d85a5c",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MODAL PENDAFTARAN SISWA & ORANG TUA SECARA MASAL (BULK IMPORT GURU)
// =============================================================================

function BulkStudentModal({
  isOpen,
  onClose,
  classes,
  activeClassId,
  onSuccess,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  activeClassId: string;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}) {
  const [selectedClassId, setSelectedClassId] = useState(activeClassId || classes[0]?.id || "");
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{ count: number; students: any[] } | null>(null);

  useEffect(() => {
    if (activeClassId) setSelectedClassId(activeClassId);
  }, [activeClassId]);

  // Parse baris teks masal
  const parsedRows = useMemo(() => {
    if (!rawText.trim()) return [];
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: Array<{
      full_name: string;
      preferred_name: string;
      parent_name: string;
      parent_email: string;
      parent_password?: string;
      parent_phone?: string;
      isValid: boolean;
      error?: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Lewati header jika baris pertama memuat kata header umum
      if (i === 0 && (line.toLowerCase().includes("nama") || line.toLowerCase().includes("student") || line.toLowerCase().includes("wali"))) {
        continue;
      }

      // Deteksi separator: tab (\t), comma (,), semicolon (;), atau pipe (|)
      let cols: string[] = [];
      if (line.includes("\t")) {
        cols = line.split("\t");
      } else if (line.includes("|")) {
        cols = line.split("|");
      } else if (line.includes(";")) {
        cols = line.split(";");
      } else if (line.includes(",")) {
        cols = line.split(",");
      } else {
        cols = [line];
      }

      const cleanCols = cols.map((c) => c.replace(/^["']|["']$/g, "").trim());
      const fullName = cleanCols[0] || "";
      const preferred = cleanCols[1] || (fullName ? fullName.split(" ")[0] : "");
      const parentName = cleanCols[2] || (preferred ? `Orang Tua ${preferred}` : "");
      const parentEmail = cleanCols[3] || "";
      const parentPassword = cleanCols[4] || "Bismillah#123";
      const parentPhone = cleanCols[5] || "";

      let isValid = true;
      let error = "";

      if (!fullName) {
        isValid = false;
        error = "Nama siswa wajib diisi";
      } else if (parentEmail && (!parentEmail.includes("@") || !parentEmail.includes("."))) {
        isValid = false;
        error = "Format email orang tua tidak valid";
      } else if (parentPassword && parentPassword.length < 6) {
        isValid = false;
        error = "Sandi minimal 6 karakter";
      }

      results.push({
        full_name: fullName,
        preferred_name: preferred,
        parent_name: parentName,
        parent_email: parentEmail,
        parent_password: parentPassword,
        parent_phone: parentPhone,
        isValid,
        error,
      });
    }

    return results;
  }, [rawText]);

  const validCount = parsedRows.filter((r) => r.isValid).length;

  if (!isOpen) return null;

  const targetClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleDownloadTemplate = () => {
    const csvContent =
      "Nama Lengkap Siswa,Nama Panggilan,Nama Wali Murid,Email Login Ortu,Kata Sandi Awal,Nomor WhatsApp\n" +
      "Ahmad Faris Pratama,Faris,Bapak Herman Pratama,herman.wali@gmail.com,Bismillah#123,081234567890\n" +
      "Fatimah Azzahra,Zahra,Ibu Siti Nurhaliza,siti.wali@gmail.com,Bismillah#123,081298765432\n" +
      "Muhammad Rayhan,Rayhan,Bapak Bambang,bambang.wali@gmail.com,Bismillah#123,081345678901\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_pendaftaran_masal_sahabat_ibadah.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    const sample =
      "Ahmad Faris Pratama\tFaris\tBapak Herman Pratama\therman.wali@gmail.com\tBismillah#123\t081234567890\n" +
      "Fatimah Azzahra\tZahra\tIbu Siti Nurhaliza\tsiti.wali@gmail.com\tBismillah#123\t081298765432\n" +
      "Muhammad Rayhan\tRayhan\tBapak Bambang\tbambang.wali@gmail.com\tBismillah#123\t081345678901\n" +
      "Aisyah Humaira\tAisyah\tIbu Ratna Dewi\tratna.wali@gmail.com\tBismillah#123\t081212345678";
    setRawText(sample);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      setInputMode("paste");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    const validStudents = parsedRows.filter((r) => r.isValid);
    if (validStudents.length === 0) {
      alert("Tidak ada baris siswa yang valid untuk didaftarkan.");
      return;
    }
    if (!selectedClassId) {
      alert("Silakan pilih kelas tujuan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = validStudents.map((s) => ({
        full_name: s.full_name,
        preferred_name: s.preferred_name,
        parent_name: s.parent_name,
        parent_email: s.parent_email || undefined,
        parent_password: s.parent_password,
        parent_phone: s.parent_phone || undefined,
      }));

      const res = await api.teacher.bulkCreateStudents(selectedClassId, payload);
      showToast(res.message || `Berhasil mendaftarkan ${res.count} siswa secara masal!`);
      setResultData({
        count: res.count,
        students: payload,
      });
      onSuccess();
    } catch (err: any) {
      alert("Gagal melakukan pendaftaran masal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
      <div className="panel" style={{ width: "100%", maxWidth: 840, maxHeight: "92vh", overflowY: "auto", padding: 24, background: "#fff", borderRadius: 18, border: "1px solid #cbe3dc", boxShadow: "0 20px 45px rgba(10,48,40,.22)" }}>
        {resultData ? (
          <div>
            <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#e8f7f2", color: "#166534", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <CheckCircle2 size={30} />
              </div>
              <h2 style={{ fontSize: 18, color: "#14532d", margin: "0 0 6px" }}>Pendaftaran Masal Berhasil!</h2>
              <p style={{ fontSize: 12, color: "#597c74", margin: 0 }}>
                Sebanyak <b>{resultData.count} siswa</b> beserta akun orang tua telah berhasil didaftarkan ke <b>{targetClass?.name}</b>.
              </p>
            </div>

            <div style={{ background: "#f8fbf9", border: "1px solid #e1ede8", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#164e43", marginBottom: 10 }}>Daftar Kredensial Login Orang Tua:</div>
              <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 8, border: "1px solid #e1eee9", background: "#fff" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#f0f8f5", textAlign: "left", color: "#185347" }}>
                      <th style={{ padding: "8px 12px" }}>Siswa</th>
                      <th style={{ padding: "8px 12px" }}>Wali Murid</th>
                      <th style={{ padding: "8px 12px" }}>Email Login</th>
                      <th style={{ padding: "8px 12px" }}>Kata Sandi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.students.map((st, idx) => (
                      <tr key={idx} style={{ borderTop: "1px solid #edf4f1" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: "#174e46" }}>{st.full_name}</td>
                        <td style={{ padding: "8px 12px", color: "#597c74" }}>{st.parent_name}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#0c9d80" }}>{st.parent_email || "—"}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#0c9d80" }}>{st.parent_password || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    const lines = resultData.students.map((st) =>
                      `Siswa: ${st.full_name} | Wali: ${st.parent_name} | Email: ${st.parent_email || "-"} | Sandi: ${st.parent_password || "-"}`
                    );
                    navigator.clipboard.writeText(lines.join("\n"));
                    showToast("Seluruh kredensial berhasil disalin ke clipboard!");
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11 }}
                >
                  <Copy size={14} /> Salin Kredensial Semua Siswa
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    const lines = [
                      "DAFTAR AKUN LOGIN ORANG TUA SISWA - SAHABAT IBADAH",
                      `Kelas: ${targetClass?.name || ""}`,
                      `Tanggal: ${formatDateIndo(getTodayStr())}`,
                      "=====================================================",
                      ...resultData.students.map((st, idx) =>
                        `${idx + 1}. Siswa: ${st.full_name}\n   Nama Wali: ${st.parent_name}\n   Email: ${st.parent_email || "-"}\n   Kata Sandi: ${st.parent_password || "-"}\n`
                      ),
                    ];
                    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `kredensial_ortu_${targetClass?.name?.toLowerCase().replace(/\s+/g, "_") || "kelas"}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11 }}
                >
                  <Download size={14} /> Unduh File (.txt)
                </button>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setResultData(null);
                  setRawText("");
                  onClose();
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#e8f7f2", color: "#166534", display: "grid", placeItems: "center" }}>
                  <Users size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: 16, color: "#174e46", display: "block" }}>Pendaftaran Siswa & Orang Tua Masal</strong>
                  <span style={{ fontSize: 11, color: "#618b80" }}>Impor data puluhan siswa sekaligus dari Excel / CSV</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#618b80" }}><X size={20} /></button>
            </div>

            {/* Pilihan Kelas Tujuan */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "#f8faf9", padding: "10px 14px", borderRadius: 10, border: "1px solid #e1ede8" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#164e43", whiteSpace: "nowrap" }}>
                Kelas Tujuan Impor:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 12, fontWeight: 700, color: "#164e43", background: "#fff", flex: 1 }}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.student_count || 0} siswa saat ini)</option>
                ))}
              </select>
            </div>

            {/* Navigasi Tab Mode: Tempel vs Upload */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    border: inputMode === "paste" ? "1.5px solid #0c9d80" : "1px solid #d4ebe5",
                    background: inputMode === "paste" ? "#0c9d80" : "#fff",
                    color: inputMode === "paste" ? "#fff" : "#185347",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FileSpreadsheet size={14} /> Salin-Tempel dari Excel / Sheets
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    border: inputMode === "upload" ? "1.5px solid #0c9d80" : "1px solid #d4ebe5",
                    background: inputMode === "upload" ? "#0c9d80" : "#fff",
                    color: inputMode === "upload" ? "#fff" : "#185347",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Upload size={14} /> Unggah File CSV
                </button>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="ghost-button"
                  style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, background: "#f0f8f5", color: "#166534" }}
                >
                  📋 Muat Contoh Format
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="ghost-button"
                  style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, background: "#fffbeb", color: "#92400e" }}
                >
                  📥 Unduh Template CSV
                </button>
              </div>
            </div>

            {/* Input Mode: Paste */}
            {inputMode === "paste" ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#618b80", marginBottom: 6 }}>
                  Urutan Kolom: <b>Nama Siswa [Tab] Nama Panggilan [Tab] Nama Wali [Tab] Email Login [Tab] Sandi [Tab] No WhatsApp</b>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Contoh baris yang ditempel:\nAhmad Faris Pratama\tFaris\tBapak Herman\therman.wali@gmail.com\tBismillah#123\t081234567890\nFatimah Azzahra\tZahra\tIbu Siti\tsiti.wali@gmail.com\tBismillah#123\t081298765432`}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 11, fontFamily: "monospace", resize: "vertical" }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: "24px 16px", background: "#f8faf9", borderRadius: 12, border: "2px dashed #b2ded1", textAlign: "center" }}>
                <Upload size={28} style={{ color: "#0c9d80", marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#164e43", marginBottom: 4 }}>Pilih Berkas CSV dari Komputer</div>
                <div style={{ fontSize: 11, color: "#7a9c94", marginBottom: 12 }}>Berkas .csv sesuai template Sahabat Ibadah</div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#0c9d80", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <span>Pilih Berkas CSV</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
            )}

            {/* Preview Tabel Parsed */}
            {parsedRows.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong style={{ fontSize: 12, color: "#164e43" }}>Pratinjau Data ({parsedRows.length} baris terdeteksi):</strong>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0c9d80", background: "#e8f7f2", padding: "3px 8px", borderRadius: 6 }}>
                    ✓ {validCount} baris valid siap diimpor
                  </span>
                </div>

                <div style={{ maxHeight: 220, overflowY: "auto", borderRadius: 8, border: "1px solid #e1eee9", background: "#fff" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#f0f8f5", textAlign: "left", color: "#185347" }}>
                        <th style={{ padding: "6px 10px" }}>No</th>
                        <th style={{ padding: "6px 10px" }}>Nama Siswa</th>
                        <th style={{ padding: "6px 10px" }}>Panggilan</th>
                        <th style={{ padding: "6px 10px" }}>Wali Murid</th>
                        <th style={{ padding: "6px 10px" }}>Email Ortu</th>
                        <th style={{ padding: "6px 10px" }}>Kata Sandi</th>
                        <th style={{ padding: "6px 10px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid #edf4f1", background: r.isValid ? "#fff" : "#fff5f5" }}>
                          <td style={{ padding: "6px 10px", color: "#7a9b94" }}>{idx + 1}</td>
                          <td style={{ padding: "6px 10px", fontWeight: 700, color: "#174e46" }}>{r.full_name}</td>
                          <td style={{ padding: "6px 10px", color: "#597c74" }}>{r.preferred_name}</td>
                          <td style={{ padding: "6px 10px", color: "#597c74" }}>{r.parent_name}</td>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", color: r.parent_email ? "#0c9d80" : "#9ca3af" }}>
                            {r.parent_email || "(belum ada)"}
                          </td>
                          <td style={{ padding: "6px 10px", fontFamily: "monospace", color: "#0c9d80" }}>{r.parent_password}</td>
                          <td style={{ padding: "6px 10px" }}>
                            {r.isValid ? (
                              <span style={{ color: "#0c9d80", fontWeight: 700 }}>✓ Siap</span>
                            ) : (
                              <span style={{ color: "#dc2626", fontSize: 10 }}>⚠️ {r.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #edf4f1" }}>
              <button type="button" className="ghost-button" onClick={onClose}>
                Batal
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={submitting || validCount === 0}
                onClick={handleSubmit}
              >
                {submitting ? "Memproses Impor..." : `Daftarkan ${validCount} Siswa ke ${targetClass?.name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB MANAJEMEN BUTIR IBADAH & KEBIASAAN GURU
// =============================================================================

function TeacherHabitsView({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalForm, setModalForm] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    data?: any;
  } | null>(null);
  const [modalDelete, setModalDelete] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setLoading(true);
    try {
      const res = await api.teacher.getHabits();
      if (res.habits) {
        setHabits(res.habits);
      }
    } catch (err: any) {
      console.error("Gagal memuat butir kebiasaan:", err);
      showToast("Gagal memuat butir ibadah: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const habitIconOptions = [
    { key: "Sun", label: "Matahari / Pagi", icon: Sun },
    { key: "Moon", label: "Bulan / Malam", icon: Moon },
    { key: "BookOpen", label: "Buku / Tilawah", icon: BookOpen },
    { key: "Heart", label: "Hati / Kebaikan", icon: Heart },
    { key: "Star", label: "Bintang / Prestasi", icon: Star },
    { key: "Sparkles", label: "Kilau / Berkah", icon: Sparkles },
    { key: "Award", label: "Piala / Target", icon: Award },
    { key: "ShieldCheck", label: "Disiplin / Ibadah", icon: ShieldCheck },
    { key: "Clock", label: "Jam / Tepat Waktu", icon: Clock },
    { key: "Smile", label: "Senyum / Ramah", icon: Smile },
    { key: "Compass", label: "Kompas / Arah", icon: Compass },
    { key: "Leaf", label: "Daun / Peduli", icon: Leaf },
    { key: "ClipboardCheck", label: "Centang", icon: ClipboardCheck },
  ];

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm) return;

    setSaving(true);
    try {
      if (modalForm.mode === "add") {
        await api.teacher.createHabit({
          name: modalForm.data.name,
          category: modalForm.data.category,
          description: modalForm.data.description,
          icon_key: modalForm.data.icon_key,
          sort_order: Number(modalForm.data.sort_order) || 10,
        });
        showToast(`Butir ibadah "${modalForm.data.name}" berhasil ditambahkan!`);
      } else {
        await api.teacher.updateHabit(modalForm.data.id, {
          name: modalForm.data.name,
          category: modalForm.data.category,
          description: modalForm.data.description,
          icon_key: modalForm.data.icon_key,
          sort_order: Number(modalForm.data.sort_order) || 10,
        });
        showToast(`Butir ibadah "${modalForm.data.name}" berhasil diperbarui!`);
      }
      setModalForm(null);
      loadHabits();
    } catch (err: any) {
      showToast("Gagal menyimpan butir ibadah: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!modalDelete) return;
    setSaving(true);
    try {
      await api.teacher.deleteHabit(modalDelete.id);
      showToast(`Butir ibadah "${modalDelete.name}" berhasil diarsipkan.`);
      setModalDelete(null);
      loadHabits();
    } catch (err: any) {
      showToast("Gagal mengarsipkan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Kategori kelompok
  const categoryGroups = [
    {
      key: "ibadah_wajib",
      title: "Ibadah Wajib (Shalat 5 Waktu & Fardhu)",
      badge: "Wajib",
      badgeColor: "#d97706",
      bgBadge: "#fef3c7",
    },
    {
      key: "ibadah_harian",
      title: "Ibadah Harian & Sunnah (Dhuha, Tilawah, Dzikir)",
      badge: "Sunnah",
      badgeColor: "#059669",
      bgBadge: "#d1fae5",
    },
    {
      key: "kebiasaan_baik",
      title: "Kebiasaan Baik & Karakter Akhlakul Karimah",
      badge: "Karakter",
      badgeColor: "#2563eb",
      bgBadge: "#dbeafe",
    },
  ];

  return (
    <div className="page-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">Kurikulum & Indikator Mutaba'ah</div>
          <h1>Manajemen Butir Checklist Ibadah</h1>
          <p>
            Kelola daftar amalan yang dipantau setiap hari. Perubahan butir otomatis tersinkronisasi ke checklist siswa, grafik progres, dan rapor mingguan.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            setModalForm({
              isOpen: true,
              mode: "add",
              data: {
                name: "",
                category: "ibadah_wajib",
                description: "",
                icon_key: "Sun",
                sort_order: (habits.length + 1) * 10,
              },
            })
          }
        >
          <Plus size={16} /> Tambah Butir Ibadah Baru
        </button>
      </div>

      {/* Info Banner Sinkronisasi */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dcfce7", color: "#15803d", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Sparkles size={18} />
        </div>
        <div style={{ fontSize: 12, color: "#166534" }}>
          <b>Sinkronisasi Dinamis Aktif:</b> Setiap butir yang Anda buat atau ubah di sini akan langsung tampil pada panel orang tua seluruh murid dan otomatis dihitung dalam rumus kepatuhan mutaba'ah (0–100%) serta rapor PDF & Word.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#7a9c94" }}>
          <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px" }} />
          <div>Memuat butir ibadah...</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {categoryGroups.map((grp) => {
            const groupHabits = habits.filter(
              (h) => h.category === grp.key || (grp.key === "ibadah_wajib" && h.category === "fajr")
            );

            return (
              <section key={grp.key} className="panel" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        background: grp.bgBadge,
                        color: grp.badgeColor,
                      }}
                    >
                      {grp.badge}
                    </span>
                    <h2 style={{ fontSize: 14, color: "#164e43", margin: 0 }}>{grp.title}</h2>
                  </div>
                  <span style={{ fontSize: 11, color: "#7a9b94" }}>{groupHabits.length} butir aktif</span>
                </div>

                {groupHabits.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 11, background: "#f9fafb", borderRadius: 8 }}>
                    Belum ada butir ibadah pada kategori ini.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {groupHabits.map((item) => {
                      const IconComp = iconMap[item.icon_key] || Sparkles;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "#fdfefe",
                            borderRadius: 10,
                            border: "1px solid #e1eee9",
                            flexWrap: "wrap",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: "#f0f8f5",
                                color: "#0c9d80",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              <IconComp size={18} />
                            </div>
                            <div>
                              <strong style={{ fontSize: 13, color: "#164e43", display: "block" }}>{item.name}</strong>
                              {item.description && (
                                <span style={{ fontSize: 10, color: "#7a9c94", display: "block" }}>{item.description}</span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 10, color: "#618b80", background: "#edf6f3", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>
                              Urutan: #{item.sort_order}
                            </span>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                setModalForm({
                                  isOpen: true,
                                  mode: "edit",
                                  data: {
                                    id: item.id,
                                    name: item.name,
                                    category: item.category,
                                    description: item.description || "",
                                    icon_key: item.icon_key || "Sun",
                                    sort_order: item.sort_order,
                                  },
                                })
                              }
                              style={{ padding: "5px 8px", borderRadius: 6, color: "#0c9d80" }}
                              title="Ubah Butir Ibadah"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => setModalDelete(item)}
                              style={{ padding: "5px 8px", borderRadius: 6, color: "#dc2626" }}
                              title="Arsipkan Butir Ibadah"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT BUTIR IBADAH */}
      {modalForm && modalForm.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: 24, background: "#fff", borderRadius: 18, border: "1px solid #cbe3dc", boxShadow: "0 20px 45px rgba(10,48,40,.22)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e8f7f2", color: "#166534", display: "grid", placeItems: "center" }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: 15, color: "#174e46" }}>
                    {modalForm.mode === "add" ? "Tambah Butir Ibadah Baru" : "Edit Butir Ibadah"}
                  </strong>
                  <div style={{ fontSize: 10, color: "#618b80" }}>Atur indikator mutaba'ah untuk seluruh siswa</div>
                </div>
              </div>
              <button onClick={() => setModalForm(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#618b80" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveHabit} style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nama Butir Ibadah / Kebiasaan
                <input
                  type="text"
                  value={modalForm.data.name}
                  onChange={(e) => setModalForm({ ...modalForm, data: { ...modalForm.data, name: e.target.value } })}
                  placeholder="Contoh: Shalat Dhuha (Minimal 2 Rakaat)"
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>

              <div className="form-grid-2col">
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                  Kategori
                  <select
                    value={modalForm.data.category}
                    onChange={(e) => setModalForm({ ...modalForm, data: { ...modalForm.data, category: e.target.value } })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12, background: "#fff" }}
                  >
                    <option value="ibadah_wajib">Ibadah Wajib (Shalat 5 Waktu)</option>
                    <option value="ibadah_harian">Ibadah Harian / Sunnah</option>
                    <option value="kebiasaan_baik">Kebiasaan Baik & Karakter</option>
                  </select>
                </label>

                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                  Urutan Tampil (Sort Order)
                  <input
                    type="number"
                    value={modalForm.data.sort_order}
                    onChange={(e) => setModalForm({ ...modalForm, data: { ...modalForm.data, sort_order: Number(e.target.value) } })}
                    placeholder="Contoh: 10, 20, 30"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                  />
                </label>
              </div>

              {/* Pilihan Ikon */}
              <div>
                <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55", marginBottom: 6 }}>
                  Pilih Ikon Tampilan:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {habitIconOptions.map((opt) => {
                    const OptIcon = opt.icon;
                    const isSel = modalForm.data.icon_key === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setModalForm({ ...modalForm, data: { ...modalForm.data, icon_key: opt.key } })}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 4,
                          padding: "8px 4px",
                          borderRadius: 8,
                          border: isSel ? "1.5px solid #0c9d80" : "1px solid #e1eee9",
                          background: isSel ? "#e8f7f2" : "#fdfefe",
                          color: isSel ? "#0c9d80" : "#597c74",
                          cursor: "pointer",
                          fontSize: 9,
                          fontWeight: isSel ? 700 : 500,
                        }}
                      >
                        <OptIcon size={16} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 64 }}>
                          {opt.label.split("/")[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Deskripsi / Petunjuk Singkat (Opsional)
                <textarea
                  rows={2}
                  value={modalForm.data.description}
                  onChange={(e) => setModalForm({ ...modalForm, data: { ...modalForm.data, description: e.target.value } })}
                  placeholder="Contoh: Dikerjakan sebelum waktu Maghrib bersama orang tua."
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12, resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" className="ghost-button" onClick={() => setModalForm(null)}>
                  Batal
                </button>
                <button type="submit" disabled={saving} className="primary-button">
                  {saving ? "Menyimpan..." : "Simpan Butir Ibadah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS / ARSIP BUTIR IBADAH */}
      {modalDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 440, padding: 24, background: "#fff", borderRadius: 18, border: "1px solid #cbe3dc" }}>
            <div style={{ textAlign: "center", padding: "10px 0 16px" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                <Trash2 size={24} />
              </div>
              <h2 style={{ fontSize: 16, color: "#991b1b", margin: "0 0 8px" }}>Arsipkan Butir Ibadah?</h2>
              <p style={{ fontSize: 12, color: "#597c74", margin: 0, lineHeight: 1.5 }}>
                Yakin ingin menonaktifkan <b>"{modalDelete.name}"</b>?<br />
                Butir ini tidak akan tampil lagi di checklist harian siswa berikutnya, namun seluruh riwayat pengisian lampau tetap tersimpan aman di database.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="ghost-button" onClick={() => setModalDelete(null)}>
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteHabit}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {saving ? "Mengarsipkan..." : "Ya, Arsipkan Butir Ini"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TAB LAPORAN MINGGUAN GURU (MATRIKS 7 HARI, REKAP KEBIASAAN, & CETAK)
// =============================================================================

function TeacherWeeklyReport({
  activeClassId,
  classes,
  onSelectClass,
}: {
  activeClassId: string;
  classes: any[];
  onSelectClass: (id: string) => void;
}) {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];

  const loadWeeklyReport = async (classId: string, offset: number) => {
    if (!classId) return;
    setLoading(true);
    try {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const targetMonday = new Date(now.setDate(diffToMonday + offset * 7));
      const startDateStr = targetMonday.toISOString().split("T")[0];

      const res = await api.teacher.getWeeklyReport(classId, startDateStr);
      setReport(res.report);
    } catch (err) {
      console.error("Gagal memuat laporan mingguan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeClassId) {
      loadWeeklyReport(activeClassId, weekOffset);
    }
  }, [activeClassId, weekOffset]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!report || !report.studentMatrix) return;
    const header = ["No", "Nama Siswa", ...report.dates, "Rata-rata Pekanan (%)", "Hari Aktif"];
    const rows = report.studentMatrix.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      ...s.days.map((d) => `${d.percentage}%`),
      `${s.weeklyAverage}%`,
      s.activeDays,
    ]);
    const csvContent = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Mingguan_${activeClass?.name?.replace(/\s+/g, "_") || "Kelas"}_${report.startDate}_${report.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-stack">
      <div className="page-intro" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-kicker">Evaluasi Kepatuhan & Kebiasaan Ibadah</div>
          <h1>Laporan Mingguan {activeClass?.name}</h1>
          <p>
            Rekap konsistensi checklist ibadah 7 hari (Senin s/d Ahad) per siswa dan per kategori aktivitas.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", padding: 4, borderRadius: 8, border: "1px solid #d7ece5" }}>
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              style={{ padding: "6px 10px", background: "#f2f8f6", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#164d44" }}
            >
              <ChevronLeft size={13} style={{ verticalAlign: -2 }} /> Pekan Lalu
            </button>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "0 8px", color: "#138870" }}>
              {weekOffset === 0 ? "Pekan Ini" : weekOffset === -1 ? "1 Pekan Lalu" : `${Math.abs(weekOffset)} Pekan Lalu`}
            </span>
            <button
              disabled={weekOffset >= 0}
              onClick={() => setWeekOffset((prev) => prev + 1)}
              style={{
                padding: "6px 10px",
                background: weekOffset >= 0 ? "#fafafa" : "#f2f8f6",
                border: "none",
                borderRadius: 6,
                cursor: weekOffset >= 0 ? "not-allowed" : "pointer",
                fontSize: 10,
                fontWeight: 700,
                color: weekOffset >= 0 ? "#ccc" : "#164d44",
              }}
            >
              Pekan Depan <ChevronRight size={13} style={{ verticalAlign: -2 }} />
            </button>
          </div>

          <button className="outline-button" onClick={handleDownloadCSV} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Upload size={14} style={{ transform: "rotate(180deg)" }} /> Unduh CSV
          </button>
          <button className="primary-button" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={15} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* Baris Pemilihan Kelas */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#7a9590" }}>PILIH KELAS:</span>
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectClass(c.id)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              background: c.id === activeClassId ? "#0c9d80" : "#fff",
              color: c.id === activeClassId ? "#fff" : "#325c54",
              border: "1px solid #d4ebe5",
              cursor: "pointer",
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#7a9b94", fontSize: 11 }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "#109f80" }} />
          Memuat data laporan mingguan...
        </div>
      ) : report ? (
        <>
          {/* KPI Cards */}
          <div className="stats-row">
            <div className="stat-card stat-green">
              <div className="stat-icon"><Target size={19} /></div>
              <div>
                <span>Rata-rata Kelas Pekan Ini</span>
                <strong>{report.classWeeklyAverage}%</strong>
                <p>Periode: {report.startDate} s/d {report.endDate}</p>
              </div>
            </div>
            <div className="stat-card stat-yellow">
              <div className="stat-icon"><ShieldCheck size={19} /></div>
              <div>
                <span>Tingkat Kepatuhan Siswa</span>
                <strong>{report.weeklyComplianceRate}%</strong>
                <p>Siswa aktif mengisi ≥ 4 hari</p>
              </div>
            </div>
            <div className="stat-card stat-purple">
              <div className="stat-icon"><Flame size={19} /></div>
              <div>
                <span>Total Aktivitas Ibadah</span>
                <strong>{report.totalCompletedActivities}</strong>
                <p>Capaian seluruh siswa sepekan</p>
              </div>
            </div>
          </div>

          {/* Breakdown Kebiasaan Ibadah */}
          <div className="panel" style={{ padding: 22 }}>
            <div className="panel-heading" style={{ marginBottom: 16 }}>
              <div>
                <div className="section-kicker">Distribusi Aktivitas Ibadah</div>
                <h2>Performa Tiap Kebiasaan Ibadah ({report.startDate} - {report.endDate})</h2>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {report.habitBreakdown.map((h) => (
                <div key={h.id} style={{ background: "#f8fcfb", padding: "12px 14px", borderRadius: 10, border: "1px solid #e7f2ee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <strong style={{ fontSize: 11, color: "#224d45" }}>{h.name}</strong>
                    <b style={{ fontSize: 11, color: "#109f80" }}>{h.percentage}%</b>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "#e5edea", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${h.percentage}%`, background: "linear-gradient(90deg, #18b390, #0a8e74)", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 8, color: "#8aa5a0", marginTop: 4, display: "block" }}>{h.completedCount} checklist tercatat</span>
                </div>
              ))}
            </div>
          </div>

          {/* Matriks 7 Hari Siswa */}
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #edf4f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="section-kicker">Rekapitulasi Individual</div>
                <h2 style={{ margin: "2px 0 0" }}>Matriks Kehadiran Checklist 7 Hari</h2>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#7a9b94", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="matrix-cell-badge matrix-complete" style={{ width: 16, height: 16, fontSize: 8 }}>✓</span> Lengkap (≥80%)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="matrix-cell-badge matrix-partial" style={{ width: 16, height: 16, fontSize: 8 }}>%</span> Sebagian
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="matrix-cell-badge matrix-empty" style={{ width: 16, height: 16, fontSize: 8 }}>-</span> Belum Mengisi
                </span>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 190 }}>Nama Siswa</th>
                    {report.dates.map((d) => {
                      const dObj = new Date(d);
                      const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
                      return (
                        <th key={d} style={{ minWidth: 62 }}>
                          <div>{dayLabels[dObj.getDay()]}</div>
                          <small style={{ fontWeight: 500, color: "#95ada8", fontSize: 9 }}>{d.slice(8)}</small>
                        </th>
                      );
                    })}
                    <th style={{ minWidth: 80 }}>Rata-rata</th>
                    <th style={{ minWidth: 80 }}>Hari Aktif</th>
                  </tr>
                </thead>
                <tbody>
                  {report.studentMatrix.map((s, idx) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "#9bb2ad", fontWeight: 700, fontSize: 10, width: 18 }}>{idx + 1}</span>
                          <Avatar initials={s.preferredName.slice(0, 2).toUpperCase()} src={s.avatarUrl} tone={idx % 2 === 0 ? "blue" : "pink"} size="small" />
                          <div>
                            <strong style={{ display: "block", color: "#194c44", fontSize: 11 }}>{s.name}</strong>
                            <span style={{ fontSize: 9, color: "#8aa5a0" }}>{s.preferredName}</span>
                          </div>
                        </div>
                      </td>
                      {s.days.map((day) => (
                        <td key={day.date}>
                          <span
                            title={`${day.dayLabel} (${day.date}): ${day.percentage}% (${day.completedCount}/${day.totalHabits} aktivitas)`}
                            className={`matrix-cell-badge ${
                              day.status === "complete"
                                ? "matrix-complete"
                                : day.status === "partial"
                                ? "matrix-partial"
                                : "matrix-empty"
                            }`}
                          >
                            {day.status === "complete" ? "✓" : day.status === "partial" ? `${day.percentage}%` : "—"}
                          </span>
                        </td>
                      ))}
                      <td>
                        <b style={{ color: s.weeklyAverage >= 80 ? "#0e9f7e" : s.weeklyAverage >= 50 ? "#cf8b1a" : "#72928c", fontSize: 11 }}>
                          {s.weeklyAverage}%
                        </b>
                      </td>
                      <td>
                        <span style={{ color: "#4d736b", fontWeight: 600 }}>{s.activeDays}/7 hari</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "#8aa5a0" }}>Belum ada data laporan untuk ditampilkan.</div>
      )}
    </div>
  );
}

// =============================================================================
// TAB PESAN ORANG TUA (GURU KE WALI MURID)
// =============================================================================

function TeacherMessagesView({
  classes,
  activeClassId,
  onSelectClass,
  initialChildId,
  teacherAvatar,
}: {
  classes: any[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  initialChildId?: string;
  teacherAvatar?: string | null;
}) {
  const [threads, setThreads] = useState<TeacherChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<TeacherChatThread | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const loadThreads = async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.messages.getTeacherThreads(classId);
      setThreads(res.threads || []);

      if (res.threads?.length > 0) {
        const match = initialChildId ? res.threads.find((t) => t.childId === initialChildId) : null;
        const target = match || res.threads[0];
        setActiveThreadId(target.threadId);
        setActiveThread(target);
        loadThreadMessages(target.threadId);
      } else {
        setActiveThreadId(null);
        setActiveThread(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Gagal memuat threads pesan:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const res = await api.messages.getThreadMessages(threadId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Gagal memuat pesan thread:", err);
    }
  };

  useEffect(() => {
    if (activeClassId) {
      loadThreads(activeClassId);
    }
  }, [activeClassId, initialChildId]);

  const handleSelectThread = (thread: TeacherChatThread) => {
    setActiveThreadId(thread.threadId);
    setActiveThread(thread);
    setShowMobileChat(true);
    loadThreadMessages(thread.threadId);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await api.messages.sendMessage(activeThreadId, text);
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
        setThreads((prev) =>
          prev.map((t) => (t.threadId === activeThreadId ? { ...t, lastMessage: text, lastSentAt: new Date().toISOString() } : t))
        );
      }
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      alert("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const insertTemplate = (template: string) => {
    setInputText(template);
  };

  const filteredThreads = useMemo(() => {
    return threads.filter(
      (t) =>
        t.childName.toLowerCase().includes(search.toLowerCase()) ||
        t.parentName.toLowerCase().includes(search.toLowerCase())
    );
  }, [threads, search]);

  return (
    <div className="page-stack">
      <div className="page-intro">
        <div>
          <div className="section-kicker">Komunikasi Sekolah & Rumah</div>
          <h1>Pesan Orang Tua</h1>
          <p>Kirim pesan, konsultasi berkala, dan pengingat kebiasaan ibadah langsung ke wali murid.</p>
        </div>
      </div>

      <div className="chat-container-grid">
        {/* Kolom Kiri: Daftar Thread */}
        <div className={`chat-sidebar-col ${showMobileChat ? "mobile-hidden" : ""}`} style={{ borderRight: "1px solid #edf4f1", display: "flex", flexDirection: "column", background: "#fafdfc" }}>
          <div style={{ padding: 14, borderBottom: "1px solid #edf4f1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", padding: "6px 10px", borderRadius: 8, border: "1px solid #dcece7" }}>
              <Search size={14} style={{ color: "#7a9b94" }} />
              <input
                type="text"
                placeholder="Cari siswa atau wali..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 11 }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#8aa5a0", fontSize: 11 }}>Memuat daftar percakapan...</div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#8aa5a0", fontSize: 11 }}>Tidak ada wali murid yang ditemukan.</div>
            ) : (
              filteredThreads.map((t) => {
                const isActive = t.threadId === activeThreadId;
                return (
                  <div
                    key={t.threadId}
                    onClick={() => handleSelectThread(t)}
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      background: isActive ? "#eff8f5" : "transparent",
                      borderLeft: isActive ? "3px solid #0a9c7e" : "3px solid transparent",
                      borderBottom: "1px solid #edf4f1",
                      transition: "background 0.15s",
                    }}
                  >
                    <Avatar initials={t.childPreferredName.slice(0, 2).toUpperCase()} src={t.childAvatarUrl} tone="blue" size="normal" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <strong style={{ fontSize: 11, color: "#194c44", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.childName}
                        </strong>
                        <span style={{ fontSize: 9, color: "#8ca8a2" }}>
                          {t.lastSentAt ? new Date(t.lastSentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <span style={{ display: "block", fontSize: 10, color: "#7a9b94", marginTop: 1 }}>Wali: {t.parentName}</span>
                      <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "#547a72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Percakapan Aktif */}
        <div className={`chat-main-col ${!showMobileChat ? "mobile-hidden" : ""}`} style={{ display: "flex", flexDirection: "column", height: 560 }}>
          {activeThread ? (
            <>
              {/* Header Chat */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #edf4f1", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="outline-button chat-back-mobile"
                    style={{ padding: "5px 9px", fontSize: 10, alignItems: "center", gap: 3 }}
                  >
                    <ChevronLeft size={13} /> Siswa
                  </button>
                  <Avatar initials={activeThread.childPreferredName.slice(0, 2).toUpperCase()} src={activeThread.childAvatarUrl} tone="blue" size="normal" />
                  <div>
                    <strong style={{ display: "block", fontSize: 13, color: "#194c44" }}>{activeThread.childName}</strong>
                    <span style={{ fontSize: 10, color: "#7a9c94" }}>
                      Wali: <b>{activeThread.parentName}</b> {activeThread.parentEmail ? `(${activeThread.parentEmail})` : ""}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => loadThreadMessages(activeThread.threadId)}
                    title="Segarkan pesan"
                    style={{ background: "#f2f8f6", border: "1px solid #dbeef5", borderRadius: 8, padding: "6px 10px", color: "#148670", cursor: "pointer", fontSize: 10, fontWeight: 700 }}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {/* Message History Area */}
              <div style={{ flex: 1, padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#fdfefe" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#92ada8", fontSize: 11, margin: "auto" }}>
                    Belum ada riwayat pesan. Kirim sapaan atau gunakan template di bawah untuk memulai percakapan.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = Boolean(m.is_self);
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isSelf ? "flex-end" : "flex-start",
                          display: "flex",
                          alignItems: "flex-end",
                          gap: 8,
                          maxWidth: "76%",
                          flexDirection: isSelf ? "row-reverse" : "row",
                        }}
                      >
                        <Avatar
                          src={isSelf ? (m.sender_avatar || teacherAvatar) : (m.sender_avatar || activeThread.childAvatarUrl)}
                          initials={m.sender_name ? m.sender_name.slice(0, 2).toUpperCase() : isSelf ? "GU" : "OR"}
                          size="small"
                          tone={isSelf ? "teal" : "blue"}
                        />
                        <div
                          style={{
                            background: isSelf ? "linear-gradient(135deg, #109f80, #0a846c)" : "#f1f6f4",
                            color: isSelf ? "#ffffff" : "#244d44",
                            padding: "10px 14px",
                            borderRadius: isSelf ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                            boxShadow: "0 2px 8px rgba(35,110,95,0.06)",
                          }}
                        >
                          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 3, opacity: 0.85 }}>{m.sender_name}</div>
                          <div style={{ fontSize: 11, lineHeight: 1.55 }}>{m.body}</div>
                          <div style={{ fontSize: 8, opacity: 0.7, textAlign: "right", marginTop: 4 }}>
                            {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Template Cepat */}
              <div style={{ padding: "8px 18px", background: "#f8fbfb", borderTop: "1px solid #edf4f1", display: "flex", gap: 8, overflowX: "auto" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#8daea7", alignSelf: "center", flexShrink: 0 }}>TEMPLATE:</span>
                <button
                  onClick={() => insertTemplate(`Assalamu'alaikum Bunda, mengingatkan untuk mendampingi ${activeThread.childPreferredName} mengisi checklist ibadah hari ini ya.`)}
                  style={{ background: "#fff", border: "1px solid #d5ece5", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#148670", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  🔔 Pengingat Checklist
                </button>
                <button
                  onClick={() => insertTemplate(`Alhamdulillah, pekan ini kebiasaan ibadah ${activeThread.childPreferredName} sangat rajin dan konsisten. Terus dipertahankan ya Bunda!`)}
                  style={{ background: "#fff", border: "1px solid #d5ece5", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#148670", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  🌟 Apresiasi Konsistensi
                </button>
                <button
                  onClick={() => insertTemplate(`Assalamu'alaikum Bunda, bagaimana perkembangan tadarus Al-Qur'an ananda di rumah? Semoga senantiasa dimudahkan.`)}
                  style={{ background: "#fff", border: "1px solid #d5ece5", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#148670", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  📖 Evaluasi Tilawah
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} style={{ padding: "12px 18px", borderTop: "1px solid #edf4f1", display: "flex", gap: 10, background: "#fff" }}>
                <input
                  type="text"
                  placeholder="Ketik pesan untuk orang tua..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cce5dd", fontSize: 11, outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="primary-button"
                  style={{ padding: "10px 18px", opacity: !inputText.trim() || sending ? 0.6 : 1 }}
                >
                  <Send size={14} /> Kirim
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: "auto", textAlign: "center", color: "#8aa5a0", fontSize: 11 }}>
              Pilih salah satu siswa di sebelah kiri untuk membuka percakapan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB PESAN PANEL ORANG TUA (WALI MURID KE GURU - TAMPILKAN FOTO PROFIL GURU)
// =============================================================================

function ParentMessagesView({
  child,
  parentAvatar,
}: {
  child: any;
  parentAvatar?: string | null;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<{
    id: string;
    name: string;
    avatarUrl: string | null;
    className: string;
    schoolName: string;
  } | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    if (!child?.id) return;
    setLoading(true);
    try {
      const res = await api.messages.getThreads(child.id);
      setThreadId(res.threadId || null);
      if (res.teacher) {
        setTeacherInfo(res.teacher);
      }
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [child?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !threadId || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await api.messages.sendMessage(threadId, text);
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
      alert("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-stack" style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="page-intro">
        <div>
          <div className="section-kicker">Pesan Guru Pembimbing</div>
          <h1>Percakapan dengan Guru Kelas</h1>
          <p>Sampaikan catatan ibadah atau konsultasi perkembangan ananda {child?.preferred_name || child?.full_name || "Siswa"} di rumah.</p>
        </div>
        <button className="outline-button" onClick={loadMessages}>
          <RefreshCw size={13} /> Segarkan
        </button>
      </div>

      <div className="panel" style={{ display: "flex", flexDirection: "column", height: 560, overflow: "hidden" }}>
        {/* Header Chat: Profil Guru Terlihat Jelas */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #edf4f1", background: "#fbfefe", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              src={teacherInfo?.avatarUrl}
              initials={teacherInfo?.name ? teacherInfo.name.slice(0, 2).toUpperCase() : "GU"}
              size="normal"
              tone="teal"
            />
            <div>
              <strong style={{ fontSize: 13, color: "#194c44", display: "block" }}>
                {teacherInfo?.name || "Guru Pembimbing"}
              </strong>
              <span style={{ fontSize: 10, color: "#7a9c94" }}>
                Wali Kelas: <b>{teacherInfo?.className || child?.class_name || "Kelas Siswa"}</b> • {teacherInfo?.schoolName || child?.school_name || "SD Islam Sahabat Ibadah"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#0a9c7e", background: "#e8f7f2", padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0a9c7e", display: "inline-block" }} /> Terhubung
          </div>
        </div>

        {/* Message History Area */}
        <div style={{ flex: 1, padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#fefefe" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#8aa5a0", fontSize: 11, margin: "auto" }}>Memuat riwayat pesan...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8aa5a0", fontSize: 11, margin: "auto" }}>
              Belum ada percakapan. Kirim pesan pertama untuk menyapa guru wali kelas.
            </div>
          ) : (
            messages.map((m) => {
              const isSelf = Boolean(m.is_self);
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isSelf ? "flex-end" : "flex-start",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    maxWidth: "88%",
                    flexDirection: isSelf ? "row-reverse" : "row",
                  }}
                >
                  <Avatar
                    src={isSelf ? (m.sender_avatar || parentAvatar) : (m.sender_avatar || teacherInfo?.avatarUrl)}
                    initials={m.sender_name ? m.sender_name.slice(0, 2).toUpperCase() : isSelf ? "OR" : "GU"}
                    size="small"
                    tone={isSelf ? "pink" : "teal"}
                  />
                  <div
                    style={{
                      background: isSelf ? "linear-gradient(135deg, #109f80, #0a846c)" : "#f1f6f4",
                      color: isSelf ? "#ffffff" : "#244d44",
                      padding: "10px 14px",
                      borderRadius: isSelf ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      boxShadow: "0 2px 8px rgba(35,110,95,0.06)",
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 3, opacity: 0.85 }}>{m.sender_name}</div>
                    <div style={{ fontSize: 11, lineHeight: 1.55 }}>{m.body}</div>
                    <div style={{ fontSize: 8, opacity: 0.7, textAlign: "right", marginTop: 4 }}>
                      {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} style={{ padding: "12px 18px", borderTop: "1px solid #edf4f1", display: "flex", gap: 10, background: "#fff" }}>
          <input
            type="text"
            placeholder="Tulis pesan untuk guru wali kelas..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cce5dd", fontSize: 11, outline: "none" }}
          />
          <button type="submit" disabled={!inputText.trim() || sending} className="primary-button" style={{ padding: "10px 18px" }}>
            <Send size={14} /> Kirim
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// TAB PROGRES ANAK (PANEL ORANG TUA - ANALITIK & GAMIFIKASI ISLAMI)
// =============================================================================

function ParentProgressView({
  child,
  childrenList,
  streak,
  points,
  onSelectChild,
}: {
  child: any;
  childrenList: any[];
  streak: number;
  points: number;
  onSelectChild: (c: any) => void;
}) {
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (child?.id) {
      loadProgressData(child.id);
    }
  }, [child?.id]);

  const loadProgressData = async (childId: string) => {
    setLoading(true);
    try {
      const res = await api.parent.getChildReports(childId, 14);
      setReportsData(res.report);
    } catch (err) {
      console.error("Gagal memuat analitik progres anak:", err);
    } finally {
      setLoading(false);
    }
  };

  const days = reportsData?.days || [];
  const compliance = reportsData?.averageCompliance || 0;
  const breakdown = reportsData?.habitBreakdown || [];

  return (
    <div className="page-stack">
      {/* Header Info Anak & Child Switcher */}
      <div className="page-intro" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-kicker">Perkembangan & Kebiasaan Ibadah</div>
          <h1>Progres Ananda {child?.preferred_name || child?.full_name || "Siswa"}</h1>
          <p>Pantau grafik konsistensi, tingkat kepatuhan shalat, tilawah, dan lencana keberkahan.</p>
        </div>

        {/* Multi-Child Switcher Tabs */}
        {childrenList && childrenList.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffffff", padding: "4px 8px", borderRadius: 10, border: "1px solid #d4ece5", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#7a9b94", marginRight: 4 }}>PILIH ANAK:</span>
            {childrenList.map((c) => {
              const isSelected = c.id === child?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectChild(c)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: isSelected ? "linear-gradient(135deg, #109f80, #0a846c)" : "transparent",
                    color: isSelected ? "#ffffff" : "#245248",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 2px 8px rgba(16,159,128,0.25)" : "none",
                  }}
                >
                  <Avatar src={c.avatar_url} initials={c.preferred_name?.slice(0, 2).toUpperCase() || "AN"} size="small" tone="pink" />
                  <span>{c.preferred_name || c.full_name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Kartu Metrik Utama - Eye-Friendly Responsive */}
      <div className="stat-grid-eyefriendly">
        <div className="stat-card-eyefriendly card-streak">
          <div className="stat-header-row">
            <span className="stat-eyebrow-label">Rangkaian Hari</span>
            <div className="stat-icon-bubble" style={{ background: "#fff3e6", color: "#b45309" }}>
              <Flame size={18} />
            </div>
          </div>
          <div className="stat-number-value" style={{ color: "#b45309" }}>
            {streak} <span style={{ fontSize: 13, fontWeight: 600, color: "#b45309" }}>Hari</span>
          </div>
          <span className="stat-caption-note">Istiqomah mengisi amalan</span>
        </div>

        <div className="stat-card-eyefriendly card-points">
          <div className="stat-header-row">
            <span className="stat-eyebrow-label">Poin Kebaikan</span>
            <div className="stat-icon-bubble" style={{ background: "#e8f8f2", color: "#0a9c7e" }}>
              <Star size={18} />
            </div>
          </div>
          <div className="stat-number-value" style={{ color: "#0a9c7e" }}>
            {points} <span style={{ fontSize: 13, fontWeight: 600, color: "#0a9c7e" }}>Poin</span>
          </div>
          <span className="stat-caption-note">Terkumpul dari checklist ibadah</span>
        </div>

        <div className="stat-card-eyefriendly card-compliance">
          <div className="stat-header-row">
            <span className="stat-eyebrow-label">Rata-rata 14 Hari</span>
            <div className="stat-icon-bubble" style={{ background: "#e8f2fc", color: "#1d72b8" }}>
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-number-value" style={{ color: "#1d72b8" }}>
            {compliance}%
          </div>
          <span className="stat-caption-note">Tingkat ketuntasan amalan harian</span>
        </div>

        <div className="stat-card-eyefriendly card-predikat">
          <div className="stat-header-row">
            <span className="stat-eyebrow-label">Predikat Mutaba'ah</span>
            <div className="stat-icon-bubble" style={{ background: "#fcebf5", color: "#be185d" }}>
              <Award size={18} />
            </div>
          </div>
          <div className="stat-number-value" style={{ fontSize: 16, color: "#be185d", whiteSpace: "nowrap" }}>
            {compliance >= 85 ? "Mumtaz 🌟" : compliance >= 70 ? "Jayyid Jiddan ✨" : "Jayyid 👍"}
          </div>
          <span className="stat-caption-note">Berdasarkan keaktifan mengisi</span>
        </div>
      </div>

      {/* Grafik Performa 14 Hari Terakhir */}
      <section className="panel" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="section-kicker">Historis 14 Hari</div>
            <h2 style={{ fontSize: 16, margin: 0, color: "#174e46" }}>Grafik Konsistensi Ibadah Harian</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="chart-hint-pill">👉 Geser horizontal jika layar sempit</span>
            <span style={{ fontSize: 11, color: "#7a9b94", fontWeight: 600 }}>
              {days.length > 0 ? `${days[0]?.date} s/d ${days[days.length - 1]?.date}` : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8aa5a0", fontSize: 12 }}>Memuat grafik performa...</div>
        ) : (
          <div className="chart-scroll-container">
            <div className="chart-scroll-inner">
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 165, padding: "16px 8px 0", borderBottom: "1px solid #e1eee9", minWidth: 480 }}>
                {days.map((d: any, idx: number) => {
                  const heightPct = Math.max(8, d.percentage);
                  const isToday = idx === days.length - 1;
                  const barColor =
                    d.percentage >= 80 ? "#10b981" : d.percentage >= 50 ? "#3b82f6" : d.percentage > 0 ? "#f59e0b" : "#e5e7eb";

                  return (
                    <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: barColor, marginBottom: 4 }}>
                        {d.percentage > 0 ? `${d.percentage}%` : "-"}
                      </span>
                      <div
                        title={`${d.dayLabel}, ${d.date}: ${d.completedCount} / ${d.totalHabits} amalan (${d.percentage}%)`}
                        style={{
                          width: "100%",
                          maxWidth: 28,
                          height: `${heightPct}%`,
                          background: isToday ? "linear-gradient(180deg, #109f80, #0a846c)" : barColor,
                          borderRadius: "6px 6px 2px 2px",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          boxShadow: isToday ? "0 4px 10px rgba(16,159,128,0.3)" : "none",
                        }}
                      />
                      <span style={{ fontSize: 9, color: isToday ? "#109f80" : "#7a9c94", fontWeight: isToday ? 800 : 500, marginTop: 6 }}>
                        {d.dayLabel?.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Intisari Capaian Ananda Ringkas (Eye-Friendly Insight Card) */}
        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "#f6fbf8", border: "1px solid #dbeef5", display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, boxSizing: "border-box" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#e1f5ee", color: "#0e856c", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
            <Sparkles size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#164e43", display: "block", marginBottom: 3 }}>
              Intisari Capaian: {compliance >= 80 ? "Subhanallah, ananda sangat bersemangat dan konsisten!" : compliance >= 60 ? "Alhamdulillah, kebiasaan ananda terus berkembang positif." : "Mari terus dampingi ananda dengan penuh kasih sayang dan motivasi."}
            </span>
            <span style={{ fontSize: 10, color: "#618b80", display: "block", lineHeight: 1.5 }}>
              Rata-rata ketuntasan ibadah 14 hari terakhir adalah {compliance}%. Dukungan orang tua adalah kunci keberkahan.
            </span>
          </div>
        </div>
      </section>

      {/* Breakdown Ketercapaian Kebiasaan & Lencana Digital */}
      <div className="two-col-responsive">
        {/* Kolom 1: Capaian per Amalan */}
        <section className="panel" style={{ padding: 22, minWidth: 0 }}>
          <div className="section-kicker">Detail Target</div>
          <h2 style={{ fontSize: 15, margin: "0 0 16px 0", color: "#174e46" }}>Persentase Ketercapaian Ibadah</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {breakdown.length === 0 ? (
              <p style={{ color: "#8aa5a0", fontSize: 11 }}>Belum ada data kebiasaan yang tercatat.</p>
            ) : (
              breakdown.map((h: any) => (
                <div key={h.id} style={{ minWidth: 0 }}>
                  <div className="habit-progress-header">
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                    <span className="habit-progress-stat" style={{ color: h.percentage >= 80 ? "#109f80" : "#d97706" }}>
                      {h.completedCount}/{reportsData?.daysCount} hari ({h.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 7, background: "#edf5f2", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${h.percentage}%`,
                        height: "100%",
                        background: h.percentage >= 80 ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #f59e0b, #d97706)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Kolom 2: Lencana Gamifikasi Islami */}
        <section className="panel" style={{ padding: 22, minWidth: 0 }}>
          <div className="section-kicker">Apresiasi & Motivasi</div>
          <h2 style={{ fontSize: 15, margin: "0 0 16px 0", color: "#174e46" }}>Lencana Keberkahan Ananda</h2>

          <div className="badge-grid-responsive">
            <div className="badge-card shimmer-badge" style={{ padding: "12px 10px", borderRadius: 10, background: streak >= 7 ? "#f0fdf4" : "#f9fafb", border: streak >= 7 ? "1px solid #bbf7d0" : "1px solid #e5e7eb", textAlign: "center", minWidth: 0, boxSizing: "border-box" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🌟</div>
              <strong style={{ fontSize: 11, display: "block", color: streak >= 7 ? "#15803d" : "#6b7280" }}>Pejuang Istiqomah</strong>
              <span style={{ fontSize: 9, color: "#6b7280", display: "block", lineHeight: 1.35, marginTop: 2 }}>Rutin checklist 7 hari berturut</span>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: streak >= 7 ? "#dcfce7" : "#e5e7eb", color: streak >= 7 ? "#166534" : "#6b7280" }}>
                {streak >= 7 ? "TERCAPAI ✓" : `${streak}/7 HARI`}
              </span>
            </div>

            <div className="badge-card shimmer-badge" style={{ padding: "12px 10px", borderRadius: 10, background: points >= 100 ? "#eff6ff" : "#f9fafb", border: points >= 100 ? "1px solid #bfdbfe" : "1px solid #e5e7eb", textAlign: "center", minWidth: 0, boxSizing: "border-box" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📖</div>
              <strong style={{ fontSize: 11, display: "block", color: points >= 100 ? "#1d4ed8" : "#6b7280" }}>Penjaga Qur'an</strong>
              <span style={{ fontSize: 9, color: "#6b7280", display: "block", lineHeight: 1.35, marginTop: 2 }}>Tadarus & tilawah harian</span>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: points >= 100 ? "#dbeafe" : "#e5e7eb", color: points >= 100 ? "#1e40af" : "#6b7280" }}>
                {points >= 100 ? "TERCAPAI ✓" : "PROSES"}
              </span>
            </div>

            <div className="badge-card shimmer-badge" style={{ padding: "12px 10px", borderRadius: 10, background: streak >= 14 ? "#fef3c7" : "#f9fafb", border: streak >= 14 ? "1px solid #fde68a" : "1px solid #e5e7eb", textAlign: "center", minWidth: 0, boxSizing: "border-box" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🕌</div>
              <strong style={{ fontSize: 11, display: "block", color: streak >= 14 ? "#b45309" : "#6b7280" }}>Bintang Subuh</strong>
              <span style={{ fontSize: 9, color: "#6b7280", display: "block", lineHeight: 1.35, marginTop: 2 }}>Subuh tepat waktu tanpa putus</span>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: streak >= 14 ? "#fef3c7" : "#e5e7eb", color: streak >= 14 ? "#92400e" : "#6b7280" }}>
                {streak >= 14 ? "TERCAPAI ✓" : `${streak}/14 HARI`}
              </span>
            </div>

            <div className="badge-card shimmer-badge" style={{ padding: "12px 10px", borderRadius: 10, background: points >= 200 ? "#fdf2f8" : "#f9fafb", border: points >= 200 ? "1px solid #fbcfe8" : "1px solid #e5e7eb", textAlign: "center", minWidth: 0, boxSizing: "border-box" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>💖</div>
              <strong style={{ fontSize: 11, display: "block", color: points >= 200 ? "#be185d" : "#6b7280" }}>Hati Dermawan</strong>
              <span style={{ fontSize: 9, color: "#6b7280", display: "block", lineHeight: 1.35, marginTop: 2 }}>Sedekah & bantu sesama</span>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: points >= 200 ? "#fce7f3" : "#e5e7eb", color: points >= 200 ? "#9d174d" : "#6b7280" }}>
                {points >= 200 ? "TERCAPAI ✓" : "PROSES"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// =============================================================================
// TAB LAPORAN PANEL ORANG TUA (RAPOR MUTABA'AH, CETAK, UNDUH PDF & WORD & CSV)
// =============================================================================

function ParentReportsView({
  child,
  childrenList,
  schoolInfo,
  user,
  onSelectChild,
}: {
  child: any;
  childrenList: any[];
  schoolInfo?: { name: string; logoUrl: string | null } | null;
  user?: any;
  onSelectChild: (c: any) => void;
}) {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "paper">("card");

  useEffect(() => {
    if (child?.id) {
      loadReports(child.id, periodDays);
    }
  }, [child?.id, periodDays]);

  const loadReports = async (childId: string, days: number) => {
    setLoading(true);
    try {
      const res = await api.parent.getChildReports(childId, days);
      setReportsData(res.report);
    } catch (err) {
      console.error("Gagal memuat laporan orang tua:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const parentName =
    user?.fullName ||
    reportsData?.parent?.fullName ||
    child?.parent_name ||
    "Bunda Rina";
  const teacherName =
    child?.teacher_name ||
    reportsData?.child?.teacherName ||
    "Pak Andi";

  const handleDownloadPDF = async () => {
    if (!reportsData) return;
    setExportingPDF(true);
    try {
      await exportReportToPDF(reportsData, child, schoolInfo, periodDays, {
        parentName,
        teacherName,
      });
    } catch (err) {
      console.error("Gagal ekspor PDF:", err);
      alert("Terjadi kendala saat membuat dokumen PDF.");
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!reportsData) return;
    setExportingWord(true);
    try {
      await exportReportToWord(reportsData, child, schoolInfo, periodDays, {
        parentName,
        teacherName,
      });
    } catch (err) {
      console.error("Gagal ekspor Word (.docx):", err);
      alert("Terjadi kendala saat membuat dokumen Word (.docx).");
    } finally {
      setExportingWord(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!reportsData) return;
    exportReportToCSV(reportsData, child, periodDays, {
      parentName,
      teacherName,
    });
  };

  const breakdown = reportsData?.habitBreakdown || [];
  const compliance = reportsData?.averageCompliance || 0;

  return (
    <div className="page-stack">
      {/* Header Info & Action Controls */}
      <div className="page-intro" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-kicker">Laporan Rapor Karakter</div>
          <h1>Rapor Mutaba'ah Ibadah {child?.preferred_name || child?.full_name || "Siswa"}</h1>
          <p>Rekapitulasi berkala amalan harian, unduh rapor resmi (PDF & Word), dan arsip mutaba'ah.</p>
        </div>

        <div className="action-bar-responsive" style={{ flexWrap: "wrap", gap: 8 }}>
          {childrenList && childrenList.length > 1 && (
            <select
              value={child?.id}
              onChange={(e) => {
                const sel = childrenList.find((c) => c.id === e.target.value);
                if (sel) onSelectChild(sel);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbe3dc",
                background: "#fff",
                fontSize: 11,
                fontWeight: 700,
                color: "#164d44",
                cursor: "pointer",
              }}
            >
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.class_name || "Kelas Siswa"})
                </option>
              ))}
            </select>
          )}

          {/* Periode 7 vs 30 Hari */}
          <div style={{ display: "flex", background: "#fff", padding: 3, borderRadius: 8, border: "1px solid #d7ece5" }}>
            <button
              onClick={() => setPeriodDays(7)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                background: periodDays === 7 ? "linear-gradient(135deg, #109f80, #0a846c)" : "transparent",
                color: periodDays === 7 ? "#fff" : "#1b5a4f",
              }}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriodDays(30)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
                background: periodDays === 30 ? "linear-gradient(135deg, #109f80, #0a846c)" : "transparent",
                color: periodDays === 30 ? "#fff" : "#1b5a4f",
              }}
            >
              30 Hari
            </button>
          </div>

          {/* Mode Switcher: Ringkasan Kartu vs Kertas Dokumen */}
          <div className="mobile-view-toggle">
            <button
              className={viewMode === "card" ? "active" : ""}
              onClick={() => setViewMode("card")}
            >
              📱 Ringkasan Kartu
            </button>
            <button
              className={viewMode === "paper" ? "active" : ""}
              onClick={() => setViewMode("paper")}
            >
              📋 Kertas Dokumen
            </button>
          </div>

          {/* Export Action Grid (PDF, Word, CSV, Cetak) */}
          <div className="export-action-grid">
            <button
              className="btn-export-pdf"
              onClick={handleDownloadPDF}
              disabled={exportingPDF || !reportsData}
              title="Unduh Rapor PDF Resmi A4"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <FileDown size={14} />
              {exportingPDF ? "Menyiapkan PDF..." : "Unduh PDF"}
            </button>

            <button
              className="btn-export-word"
              onClick={handleDownloadWord}
              disabled={exportingWord || !reportsData}
              title="Unduh Dokumen Word (.docx)"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <FileText size={14} />
              {exportingWord ? "Menyiapkan Word..." : "Unduh Word"}
            </button>

            <button
              className="btn-export-csv"
              onClick={handleDownloadCSV}
              disabled={!reportsData}
              title="Unduh File Rekapitulasi CSV"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Upload size={13} style={{ transform: "rotate(180deg)" }} /> Unduh CSV
            </button>

            <button
              className="btn-export-print"
              onClick={handlePrint}
              title="Cetak Rapor Mutaba'ah Fisik"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Printer size={13} /> Cetak
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik Periode (Eye-Friendly Metadata Strip) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 12, border: "1px solid #e1eee9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#edf8f4", color: "#0c8b71", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <CalendarDays size={18} />
          </div>
          <div>
            <span style={{ fontSize: 9.5, color: "#7a9b94", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Periode</span>
            <strong style={{ fontSize: 13, color: "#164d44" }}>{periodDays} Hari Terakhir</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 12, border: "1px solid #e1eee9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f0fbf6", color: "#109f80", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span style={{ fontSize: 9.5, color: "#7a9b94", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Hari Terisi</span>
            <strong style={{ fontSize: 13, color: "#109f80" }}>{reportsData?.activeDays || 0} / {periodDays} Hari</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 12, border: "1px solid #e1eee9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#eef6fd", color: "#1d72b8", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Activity size={18} />
          </div>
          <div>
            <span style={{ fontSize: 9.5, color: "#7a9b94", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Kepatuhan</span>
            <strong style={{ fontSize: 13, color: "#1d72b8" }}>{compliance}%</strong>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: 12, border: "1px solid #e1eee9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fdf3f8", color: "#be185d", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Award size={18} />
          </div>
          <div>
            <span style={{ fontSize: 9.5, color: "#7a9b94", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Predikat</span>
            <strong style={{ fontSize: 12, color: compliance >= 80 ? "#109f80" : "#d97706" }}>
              {compliance >= 85 ? "MUMTAZ 🌟" : compliance >= 70 ? "JAYYID JIDDAN" : "JAYYID"}
            </strong>
          </div>
        </div>
      </div>

      {/* MODE 1: RINGKASAN KARTU RAMAH MOBILE (EYE-FRIENDLY NO HORIZONTAL SCROLL) */}
      {viewMode === "card" && (
        <div className="report-card-view-wrapper">
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1b5247" }}>
              Capaian Ibadah Ananda ({breakdown.length} Amalan)
            </span>
            <span style={{ fontSize: 10.5, color: "#73978f" }}>Tampilan Kartu Ringkas</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8aa5a0", fontSize: 12 }}>
              Memuat data laporan mutaba'ah...
            </div>
          ) : breakdown.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", background: "#fff", borderRadius: 14, border: "1px solid #e1eee9", color: "#8aa5a0", fontSize: 12 }}>
              Belum ada riwayat mutaba'ah tercatat pada periode ini.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {breakdown.map((h: any, idx: number) => {
                const predikat =
                  h.percentage >= 85 ? "Mumtaz 🌟" : h.percentage >= 70 ? "Jayyid Jiddan ✨" : h.percentage >= 50 ? "Jayyid 👍" : "Perlu Bimbingan 📖";
                const badgeBg =
                  h.percentage >= 85 ? "#ecfdf5" : h.percentage >= 70 ? "#f0f9ff" : h.percentage >= 50 ? "#fffbeb" : "#fef2f2";
                const badgeColor =
                  h.percentage >= 85 ? "#047857" : h.percentage >= 70 ? "#0284c7" : h.percentage >= 50 ? "#b45309" : "#dc2626";

                return (
                  <div key={h.id || idx} className="report-mobile-card-item">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f0f8f5", color: "#109f80", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13, color: "#164d43", display: "block" }}>{h.name}</strong>
                          <span style={{ fontSize: 9.5, color: "#7a9b94", textTransform: "capitalize" }}>
                            Kategori: {h.category}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 800,
                          background: badgeBg,
                          color: badgeColor,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {predikat}
                      </span>
                    </div>

                    {/* Progress Bar & Counter */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 5 }}>
                      <span style={{ color: "#60897e" }}>Ketuntasan:</span>
                      <strong style={{ color: "#164d44" }}>
                        {h.completedCount} dari {periodDays} Hari ({h.percentage}%)
                      </strong>
                    </div>

                    <div style={{ width: "100%", height: 7, background: "#edf5f2", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${h.percentage}%`,
                          height: "100%",
                          background:
                            h.percentage >= 80
                              ? "linear-gradient(90deg, #10b981, #059669)"
                              : h.percentage >= 50
                              ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                              : "linear-gradient(90deg, #f59e0b, #d97706)",
                          borderRadius: 4,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Catatan Evaluasi Guru */}
          {reportsData?.notesHistory && reportsData.notesHistory.length > 0 && (
            <div style={{ marginTop: 14, padding: "14px 16px", background: "#ffffff", borderRadius: 14, border: "1px solid #d9ede6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "#109f80" }}>
                <Sparkles size={15} />
                <strong style={{ fontSize: 12, color: "#185347" }}>Catatan Guru & Evaluasi Berkala:</strong>
              </div>
              {reportsData.notesHistory.slice(0, 3).map((n: any, idx: number) => (
                <div key={idx} style={{ fontSize: 11, color: "#325c53", marginBottom: 6, fontStyle: "italic", lineHeight: 1.5 }}>
                  "{n.note}" —{" "}
                  <span style={{ fontSize: 9.5, fontStyle: "normal", color: "#7a9b94", fontWeight: 600 }}>
                    {n.entry_date} ({n.author_role === "teacher" ? "Guru Wali Kelas" : "Orang Tua"})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tips Info Beralih ke Kertas Dokumen */}
          <div style={{ marginTop: 14, padding: "12px 15px", borderRadius: 12, background: "#f8fbf9", border: "1px dashed #cde5dc", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontSize: 10.5, color: "#547e74", lineHeight: 1.45 }}>
              Untuk melihat pratinjau lembar rapor resmi lengkap dengan kop sekolah dan kolom tanda tangan fisik, klik tab <strong>"📋 Kertas Dokumen"</strong> atau tekan tombol <strong>"Unduh PDF / Word"</strong> di atas.
            </span>
          </div>
        </div>
      )}

      {/* MODE 2: DOKUMEN RAPOR MUTABA'AH FORMAL (BISA DI-PRINT & DI-PREVIEW) */}
      <div
        className="panel printable-report"
        style={{
          padding: 28,
          background: "#fff",
          display: viewMode === "paper" ? "block" : "none",
        }}
      >
        {/* Kop Rapor Sekolah */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18, borderBottom: "2px solid #109f80", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {schoolInfo?.logoUrl ? (
              <img
                src={schoolInfo.logoUrl}
                alt="Logo"
                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 8, background: "#109f80", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 20 }}>
                ✦
              </div>
            )}
            <div>
              <h2 style={{ fontSize: 16, margin: "0 0 2px 0", color: "#164e43" }}>{schoolInfo?.name || "SD Islam Sahabat Ibadah"}</h2>
              <span style={{ fontSize: 11, color: "#658f85" }}>Laporan Hasil Mutaba'ah Amalan & Karakter Siswa di Rumah</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong style={{ display: "block", fontSize: 12, color: "#164e43" }}>Periode {periodDays} Hari Terakhir</strong>
            <span style={{ fontSize: 10, color: "#7a9b94" }}>Dicetak: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
          </div>
        </div>

        {/* Informasi Siswa */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, background: "#f8fbf9", padding: "12px 18px", borderRadius: 10, border: "1px solid #e1eee9", marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 10, color: "#7a9b94", display: "block" }}>Nama Lengkap Siswa</span>
            <strong style={{ fontSize: 13, color: "#174e46" }}>{child?.full_name || "Ahmad Fauzan"}</strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "#7a9b94", display: "block" }}>Kelas / Tingkat</span>
            <strong style={{ fontSize: 13, color: "#174e46" }}>{child?.class_name || child?.grade_level || "Kelas 4A"}</strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "#7a9b94", display: "block" }}>Hari Aktif Mutaba'ah</span>
            <strong style={{ fontSize: 13, color: "#109f80" }}>{reportsData?.activeDays || 0} dari {periodDays} Hari</strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "#7a9b94", display: "block" }}>Predikat Kepatuhan</span>
            <strong style={{ fontSize: 13, color: compliance >= 80 ? "#109f80" : "#d97706" }}>
              {compliance >= 85 ? "MUMTAZ (Istimewa)" : compliance >= 70 ? "JAYYID JIDDAN" : compliance >= 50 ? "JAYYID (Baik)" : "Perlu Bimbingan"}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "#7a9b94", display: "block" }}>Wali Kelas</span>
            <strong style={{ fontSize: 13, color: "#174e46" }}>{teacherName}</strong>
          </div>
          <div>
            <span style={{ fontSize: 10, color: "#7a9b94", display: "block" }}>Orang Tua / Wali</span>
            <strong style={{ fontSize: 13, color: "#174e46" }}>{parentName}</strong>
          </div>
        </div>

        {/* Tabel Rekapitulasi Ibadah */}
        <div style={{ overflowX: "auto", marginBottom: 24, borderRadius: 8, border: "1px solid #edf4f1" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 500 }}>
            <thead>
              <tr style={{ background: "#f2f8f5", textAlign: "left", color: "#174e46", borderBottom: "2px solid #d4ece5" }}>
                <th style={{ padding: "10px 14px" }}>No</th>
                <th style={{ padding: "10px 14px" }}>Nama Ibadah & Amalan</th>
                <th style={{ padding: "10px 14px" }}>Kategori</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>Frekuensi Terlaksana</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>Persentase</th>
                <th style={{ padding: "10px 14px" }}>Predikat</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#8aa5a0" }}>Belum ada data untuk periode ini.</td>
                </tr>
              ) : (
                breakdown.map((h: any, idx: number) => {
                  const predikat =
                    h.percentage >= 85 ? "Mumtaz 🌟" : h.percentage >= 70 ? "Jayyid Jiddan" : h.percentage >= 50 ? "Jayyid" : "Perlu Bimbingan";
                  const predikatColor =
                    h.percentage >= 85 ? "#047857" : h.percentage >= 70 ? "#0284c7" : h.percentage >= 50 ? "#d97706" : "#dc2626";

                  return (
                    <tr key={h.id} style={{ borderBottom: "1px solid #edf4f1" }}>
                      <td style={{ padding: "10px 14px", color: "#618b80" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e5248" }}>{h.name}</td>
                      <td style={{ padding: "10px 14px", color: "#658f85", textTransform: "capitalize" }}>{h.category}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#164e43" }}>
                        {h.completedCount} / {periodDays} Hari
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontWeight: 800, fontSize: 10, background: h.percentage >= 80 ? "#e6f9f3" : "#fef3c7", color: h.percentage >= 80 ? "#0a846c" : "#b45309" }}>
                          {h.percentage}%
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: predikatColor }}>{predikat}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Catatan Riwayat dari Guru & Orang Tua */}
        {reportsData?.notesHistory && reportsData.notesHistory.length > 0 && (
          <div style={{ marginBottom: 26, padding: "14px 18px", background: "#fbfdfc", borderRadius: 10, border: "1px solid #e5f0ec" }}>
            <strong style={{ display: "block", fontSize: 12, color: "#185347", marginBottom: 8 }}>Catatan Evaluasi Guru Terakhir:</strong>
            {reportsData.notesHistory.slice(0, 2).map((n: any, idx: number) => (
              <div key={idx} style={{ fontSize: 11, color: "#325c53", marginBottom: 6, fontStyle: "italic" }}>
                "{n.note}" — <span style={{ fontSize: 9, fontStyle: "normal", color: "#7a9b94" }}>{n.entry_date} ({n.author_role === "teacher" ? "Guru Wali Kelas" : "Orang Tua"})</span>
              </div>
            ))}
          </div>
        )}

        {/* Kolom Tanda Tangan Cetak Rapor */}
        <div className="report-signature-row" style={{ display: "flex", justifyContent: "space-between", marginTop: 36, paddingTop: 18, borderTop: "1px dashed #cbe3dc" }}>
          <div className="report-signature-block" style={{ textAlign: "center", width: 220 }}>
            <span style={{ fontSize: 10, color: "#618b80" }}>Mengetahui,</span>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#174e46", marginTop: 2 }}>Orang Tua / Wali Murid</div>
            <div style={{ height: 48 }} />
            <strong style={{ display: "block", fontSize: 12, color: "#164e43", marginBottom: 4 }}>
              ( {parentName} )
            </strong>
            <div style={{ borderBottom: "1px solid #174e46", width: 160, margin: "0 auto" }} />
            <span style={{ fontSize: 9.5, color: "#7a9b94", marginTop: 4, display: "block" }}>Tanda Tangan & Nama Terang</span>
          </div>

          <div className="report-signature-block" style={{ textAlign: "center", width: 220 }}>
            <span style={{ fontSize: 10, color: "#618b80" }}>{schoolInfo?.name || "Sekolah"}, {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#174e46", marginTop: 2 }}>Guru Pembimbing / Wali Kelas</div>
            <div style={{ height: 48 }} />
            <strong style={{ display: "block", fontSize: 12, color: "#164e43", marginBottom: 4 }}>
              ( {teacherName} )
            </strong>
            <div style={{ borderBottom: "1px solid #174e46", width: 160, margin: "0 auto" }} />
            <span style={{ fontSize: 9.5, color: "#7a9b94", marginTop: 4, display: "block" }}>Tanda Tangan & Nama Terang</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TAB PENGATURAN PANEL ORANG TUA (PROFIL WALI, DATA ANAK, GANTI PASSWORD)
// =============================================================================

function ParentSettingsView({
  user,
  childrenList,
  onSaveProfile,
  onChangePassword,
}: {
  user: UserSession | null;
  childrenList: any[];
  onSaveProfile: (data: { full_name: string; phone?: string; avatar_url?: string | null }) => Promise<void>;
  onChangePassword: (data: { current_password: string; new_password: string }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  // Notification toggles
  const [reminderMaghrib, setReminderMaghrib] = useState(true);
  const [reminderIsya, setReminderIsya] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.parent.getProfile();
      if (res.profile) {
        setFullName(res.profile.full_name || "");
        setPhone(res.profile.phone || "");
        setAvatarUrl(res.profile.avatar_url || null);
      }
    } catch (err) {
      console.error("Gagal memuat profil orang tua:", err);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onSaveProfile({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    if (newPassword !== confirmPassword) {
      setPassMsg("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }
    setChangingPass(true);
    try {
      await onChangePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassMsg("Kata sandi berhasil diperbarui!");
    } catch (err: any) {
      setPassMsg(err.message || "Gagal mengubah kata sandi.");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="page-stack" style={{ maxWidth: 760 }}>
      <div className="page-intro">
        <div>
          <div className="section-kicker">Akun & Preferensi</div>
          <h1>Pengaturan Profil Orang Tua</h1>
          <p>Kelola data diri wali murid, foto profil, keamanan login, dan daftar anak yang terhubung.</p>
        </div>
      </div>

      {/* 1. Form Profil Orang Tua */}
      <section className="panel" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, color: "#164e43", marginBottom: 16 }}>Identitas Diri Orang Tua / Wali</h2>
        <form onSubmit={handleSubmitProfile} style={{ display: "grid", gap: 16 }}>
          {/* Foto Profil Orang Tua */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "#f8fbf9", borderRadius: 12, border: "1px dashed #b2ded1" }}>
            <Avatar src={avatarUrl} initials={fullName ? fullName.slice(0, 2).toUpperCase() : "OR"} size="large" tone="pink" />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 12, display: "block", color: "#174e46" }}>Foto Profil Orang Tua</strong>
              <span style={{ fontSize: 10, color: "#7a9c94", display: "block", marginBottom: 8 }}>
                Tampil pada percakapan pesan dengan guru pembimbing.
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, background: "#e8f7f2", color: "#1b6d5c", padding: "6px 12px", borderRadius: 6, border: "1px solid #b2ded1" }}>
                  <Camera size={13} />
                  <span>{avatarUrl ? "Ganti Foto" : "Unggah Foto"}</span>
                  <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: "none" }} />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    style={{ background: "none", border: "none", color: "#dc2626", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-grid-2col">
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
              Nama Lengkap Wali Murid
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
              />
            </label>

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
              Nomor WhatsApp / HP
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
              />
            </label>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Email Login (Terdaftar)
            <input
              type="text"
              value={user?.email || ""}
              disabled
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e1e7e5", marginTop: 4, fontSize: 12, background: "#f8f9fa", color: "#6c757d" }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={savingProfile} className="primary-button form-submit-full" style={{ minWidth: 200 }}>
              <Save size={14} /> {savingProfile ? "Menyimpan..." : "Simpan Profil Orang Tua"}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Daftar Siswa Terdaftar pada Akun Ini */}
      <section className="panel" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, color: "#164e43", marginBottom: 14 }}>Anak Terdaftar ({childrenList.length})</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {childrenList.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fcfb", borderRadius: 10, border: "1px solid #e1eee9", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar src={c.avatar_url} initials={c.preferred_name?.slice(0, 2).toUpperCase() || "AN"} size="normal" tone="pink" />
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#185347" }}>{c.full_name}</strong>
                  <span style={{ fontSize: 10, color: "#7a9c94" }}>{c.class_name || c.grade_level || "Kelas Siswa"} • {c.school_name || "SD Islam Sahabat Ibadah"}</span>
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#0a846c", background: "#e8f7f2", padding: "4px 10px", borderRadius: 8 }}>
                Aktif Terhubung ✓
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Form Ganti Password */}
      <section className="panel" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, color: "#164e43", marginBottom: 14 }}>Ganti Kata Sandi</h2>

        {passMsg && (
          <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 11, marginBottom: 14, background: passMsg.includes("berhasil") ? "#e8f7f2" : "#fef2f2", color: passMsg.includes("berhasil") ? "#0a846c" : "#dc2626" }}>
            {passMsg}
          </div>
        )}

        <form onSubmit={handleSubmitPassword} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Kata Sandi Lama / Saat Ini
            <div style={{ position: "relative", marginTop: 4 }}>
              <input
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                required
                style={{ width: "100%", padding: "10px 40px 10px 10px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#618b80" }}
                title={showCurrentPass ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="form-grid-2col">
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
              Kata Sandi Baru
              <div style={{ position: "relative", marginTop: 4 }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  style={{ width: "100%", padding: "10px 40px 10px 10px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#618b80" }}
                  title={showNewPass ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: 10, color: "#618b80", marginTop: 4, display: "block" }}>
                Minimal 6 karakter, dianjurkan kombinasi huruf dan angka.
              </span>
            </label>

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
              Konfirmasi Kata Sandi Baru
              <div style={{ position: "relative", marginTop: 4 }}>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  required
                  style={{ width: "100%", padding: "10px 40px 10px 10px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#618b80" }}
                  title={showConfirmPass ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <span style={{ fontSize: 10, color: newPassword === confirmPassword ? "#0c9d80" : "#dc2626", marginTop: 4, display: "block", fontWeight: 600 }}>
                  {newPassword === confirmPassword ? "✓ Kata sandi baru cocok" : "✗ Konfirmasi belum cocok"}
                </span>
              )}
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={changingPass} className="primary-button form-submit-full" style={{ minWidth: 200 }}>
              <KeyRound size={14} /> {changingPass ? "Memproses..." : "Perbarui Kata Sandi"}
            </button>
          </div>
        </form>
      </section>

      {/* 4. Preferensi Notifikasi */}
      <section className="panel" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, color: "#164e43", marginBottom: 14 }}>Preferensi Pengingat Ibadah</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fbf9", borderRadius: 8, border: "1px solid #e1eee9", cursor: "pointer" }}>
            <div>
              <strong style={{ fontSize: 12, display: "block", color: "#174e46" }}>Pengingat Menjelang Maghrib (Pukul 17.30)</strong>
              <span style={{ fontSize: 10, color: "#7a9c94" }}>Dampingi ananda mempersiapkan shalat Maghrib dan tilawah petang.</span>
            </div>
            <input type="checkbox" checked={reminderMaghrib} onChange={(e) => setReminderMaghrib(e.target.checked)} />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fbf9", borderRadius: 8, border: "1px solid #e1eee9", cursor: "pointer" }}>
            <div>
              <strong style={{ fontSize: 12, display: "block", color: "#174e46" }}>Pengingat Penutupan Checklist Harian (Pukul 20.00)</strong>
              <span style={{ fontSize: 10, color: "#7a9c94" }}>Pemberitahuan jika masih ada amalan wajib yang belum dicentang hari ini.</span>
            </div>
            <input type="checkbox" checked={reminderIsya} onChange={(e) => setReminderIsya(e.target.checked)} />
          </label>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// TAB PENGATURAN GURU & PROFIL SEKOLAH (FOTO GURU, GANTI PASSWORD, & LOGO SEKOLAH)
// =============================================================================

function TeacherSettings({
  teacher,
  onSaveProfile,
  onChangePassword,
}: {
  teacher: any;
  onSaveProfile: (data: {
    full_name: string;
    email?: string;
    phone: string;
    school_name: string;
    school_logo_url?: string | null;
    avatar_url?: string | null;
  }) => Promise<void>;
  onChangePassword: (data: { current_password: string; new_password: string }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(teacher?.full_name || "");
  const [email, setEmail] = useState(teacher?.email || "");
  const [phone, setPhone] = useState(teacher?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(teacher?.avatar_url || null);

  const [schoolName, setSchoolName] = useState(teacher?.school_name || "");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(teacher?.school_logo_url || null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState("");

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.full_name || "");
      setEmail(teacher.email || "");
      setPhone(teacher.phone || "");
      setAvatarUrl(teacher.avatar_url || null);
      setSchoolName(teacher.school_name || "");
      setSchoolLogoUrl(teacher.school_logo_url || null);
    }
  }, [teacher]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran logo maksimal 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSchoolLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onSaveProfile({
        full_name: fullName,
        email,
        phone,
        school_name: schoolName,
        school_logo_url: schoolLogoUrl,
        avatar_url: avatarUrl,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchool(true);
    try {
      await onSaveProfile({
        full_name: fullName,
        phone,
        school_name: schoolName,
        school_logo_url: schoolLogoUrl,
        avatar_url: avatarUrl,
      });
    } finally {
      setSavingSchool(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    if (newPassword !== confirmPassword) {
      setPassMsg("Konfirmasi password baru tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg("Password baru minimal 6 karakter.");
      return;
    }
    setChangingPass(true);
    try {
      await onChangePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassMsg("Password berhasil diperbarui!");
    } catch (err: any) {
      setPassMsg(err.message || "Gagal mengubah password.");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="page-stack" style={{ maxWidth: 760 }}>
      <div className="page-intro">
        <div>
          <div className="section-kicker">Manajemen Akun & Lembaga</div>
          <h1>Pengaturan Profil Guru & Sekolah</h1>
          <p>Ubah identitas guru, foto profil, keamanan akun, serta logo sekolah tempat Anda mengajar.</p>
        </div>
      </div>

      {/* KARTU 1: PROFIL DIRI GURU */}
      <div className="panel" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e3f7f0", color: "#139f7f", display: "grid", placeItems: "center" }}>
            <GraduationCap size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, margin: 0, color: "#164d44" }}>Profil Pribadi Guru</h2>
            <span style={{ fontSize: 10, color: "#7a9c94" }}>Informasi diri dan foto avatar guru</span>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} style={{ display: "grid", gap: 16 }}>
          {/* Foto Guru */}
          <div>
            <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55", marginBottom: 8 }}>Foto Profil Guru</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar initials={fullName.slice(0, 2).toUpperCase() || "PG"} src={avatarUrl} tone="blue" size="large" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    background: "#f0f7f5",
                    border: "1px solid #cde7df",
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#16866e",
                    cursor: "pointer",
                    width: "fit-content",
                  }}
                >
                  <Upload size={13} /> Unggah Foto Guru
                  <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: "none" }} />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    style={{ background: "none", border: "none", color: "#d55f61", fontSize: 10, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                  >
                    Hapus foto (gunakan inisial)
                  </button>
                )}
                <span style={{ fontSize: 9, color: "#8aa5a0" }}>Format JPG atau PNG, maks 2MB</span>
              </div>
            </div>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Nama Lengkap Guru
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
            />
          </label>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Alamat Email Guru (Untuk Masuk Aplikasi)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh: andi@sekolah.sch.id"
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
            />
          </label>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Nomor Telepon / WhatsApp
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
            />
          </label>

          <div style={{ marginTop: 6 }}>
            <button type="submit" disabled={savingProfile} className="primary-button">
              <Save size={16} /> {savingProfile ? "Menyimpan..." : "Simpan Profil Guru"}
            </button>
          </div>
        </form>
      </div>

      {/* KARTU 2: GANTI PASSWORD GURU */}
      <div className="panel" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fff5db", color: "#ba8519", display: "grid", placeItems: "center" }}>
            <Lock size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, margin: 0, color: "#164d44" }}>Keamanan Akun (Ganti Password)</h2>
            <span style={{ fontSize: 10, color: "#7a9c94" }}>Perbarui kata sandi akun guru Anda</span>
          </div>
        </div>

        {passMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 14,
              background: passMsg.includes("berhasil") ? "#e3f7f0" : "#fff1f1",
              color: passMsg.includes("berhasil") ? "#0f8c6e" : "#d35759",
              border: `1px solid ${passMsg.includes("berhasil") ? "#c3ecde" : "#fcd8d8"}`,
            }}
          >
            {passMsg}
          </div>
        )}

        <form onSubmit={handleSubmitPassword} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Password Saat Ini
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Masukkan password lama"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
              Password Baru
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimal 6 karakter"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
              />
            </label>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
              Konfirmasi Password Baru
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi password baru"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
              />
            </label>
          </div>

          <div style={{ marginTop: 6 }}>
            <button type="submit" disabled={changingPass} className="outline-button" style={{ color: "#12886f", borderColor: "#c2e5dc" }}>
              <KeyRound size={15} /> {changingPass ? "Memperbarui..." : "Perbarui Password"}
            </button>
          </div>
        </form>
      </div>

      {/* KARTU 3: PROFIL SEKOLAH & LOGO */}
      <div className="panel" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e8f2fe", color: "#2578bf", display: "grid", placeItems: "center" }}>
            <School size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, margin: 0, color: "#164d44" }}>Profil Lembaga & Logo Sekolah</h2>
            <span style={{ fontSize: 10, color: "#7a9c94" }}>Logo ini akan otomatis tampil di Panel Orang Tua</span>
          </div>
        </div>

        <form onSubmit={handleSubmitSchool} style={{ display: "grid", gap: 16 }}>
          {/* Upload Logo Sekolah */}
          <div>
            <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55", marginBottom: 8 }}>Logo Resmi Sekolah</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 12,
                  background: "#f7faf9",
                  border: "1.5px solid #d4ece5",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {schoolLogoUrl ? (
                  <img src={schoolLogoUrl} alt="Logo Sekolah" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                ) : (
                  <School size={30} style={{ color: "#8daea7" }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    background: "#f0f7f5",
                    border: "1px solid #cde7df",
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#16866e",
                    cursor: "pointer",
                    width: "fit-content",
                  }}
                >
                  <Upload size={13} /> {schoolLogoUrl ? "Ganti Logo Sekolah" : "Unggah Logo Sekolah"}
                  <input type="file" accept="image/*" onChange={handleLogoFile} style={{ display: "none" }} />
                </label>
                {schoolLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setSchoolLogoUrl(null)}
                    style={{ background: "none", border: "none", color: "#d55f61", fontSize: 10, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                  >
                    Hapus logo sekolah
                  </button>
                )}
                <span style={{ fontSize: 9, color: "#8aa5a0" }}>Format PNG / JPG transparan disarankan, maks 2MB</span>
              </div>
            </div>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
            Nama Sekolah / Lembaga Pendidikan
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12, outline: "none" }}
            />
          </label>

          <div style={{ background: "#f0fbf7", padding: "10px 14px", borderRadius: 8, border: "1px solid #d8ede6", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} style={{ color: "#129e80", flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#256254", lineHeight: 1.5 }}>
              Logo dan nama sekolah di atas akan langsung disematkan pada header dan dashboard wali murid di <b>Panel Orang Tua</b>.
            </span>
          </div>

          <div style={{ marginTop: 6 }}>
            <button type="submit" disabled={savingSchool} className="primary-button">
              <Save size={16} /> {savingSchool ? "Menyimpan..." : "Simpan Profil Sekolah & Logo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// HALAMAN LOGIN & PENDAFTARAN GURU DENGAN OTP
// =============================================================================

function LoginPage({
  onLoginSuccess,
  onBack,
}: {
  onLoginSuccess: (user: UserSession) => void;
  onBack: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states - Bersih kosong secara default untuk pengunjung baru
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on mount HANYA jika pengguna sebelumnya mencentang "Ingat saya"
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sahabat_ibadah_remember_login");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.role) {
          setSelectedRole(parsed.role);
          setEmail(parsed.email);
          if (parsed.password) {
            setPassword(parsed.password);
          }
          setRememberMe(true);
        }
      }
    } catch (e) {}
  }, []);

  // OTP states
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.auth.login(email, password, selectedRole);
      if (rememberMe) {
        localStorage.setItem(
          "sahabat_ibadah_remember_login",
          JSON.stringify({ email, password, role: selectedRole })
        );
      } else {
        localStorage.removeItem("sahabat_ibadah_remember_login");
      }
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.auth.registerTeacher({
        full_name: fullName,
        email,
        password,
        school_name: schoolName,
      });
      if (res.devOtpCode) {
        setDevOtpHint(res.devOtpCode);
      }
      setOtpStep(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mendaftar guru.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp(email, otpCode);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Kode OTP salah atau kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="back-home" onClick={onBack}>
        <ChevronLeft size={17} /> Kembali ke beranda
      </button>

      <div className="login-card">
        <div className="login-brand"><Logo /></div>

        <div className="login-heading">
          <div className="login-symbol">✦</div>
          <h1>Selamat Datang</h1>
          <p>
            {isRegisterMode
              ? "Pendaftaran Akun Guru Baru (Dengan Verifikasi OTP)"
              : "Pilih peran Anda untuk melanjutkan ke aplikasi"}
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#ffeded",
              color: "#c0392b",
              fontSize: "11px",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Pemilihan Kartu Peran */}
        {!isRegisterMode && (
          <div className={`role-cards ${selectedRole ? "has-selection" : ""}`}>
            <button
              className={`role-card role-parent ${selectedRole === "parent" ? "selected" : ""}`}
              onClick={() => {
                setSelectedRole("parent");
                setErrorMsg("");
                try {
                  const saved = localStorage.getItem("sahabat_ibadah_remember_login");
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.role === "parent" && parsed.email) {
                      setEmail(parsed.email);
                      setPassword(parsed.password || "");
                      setRememberMe(true);
                      return;
                    }
                  }
                } catch (e) {}
                setEmail("");
                setPassword("");
                setRememberMe(false);
              }}
            >
              <div className="role-art role-art-parent">
                <img src={homeImage} alt="Orang tua mendampingi anak" />
              </div>
              <strong>Orang Tua</strong>
              <span>Pantau dan kelola kebiasaan ibadah anak di rumah.</span>
              <div className="role-action">
                <UserRound size={18} /> Masuk sebagai Orang Tua
              </div>
            </button>

            <button
              className={`role-card role-teacher ${selectedRole === "teacher" ? "selected" : ""}`}
              onClick={() => {
                setSelectedRole("teacher");
                setErrorMsg("");
                try {
                  const saved = localStorage.getItem("sahabat_ibadah_remember_login");
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.role === "teacher" && parsed.email) {
                      setEmail(parsed.email);
                      setPassword(parsed.password || "");
                      setRememberMe(true);
                      return;
                    }
                  }
                } catch (e) {}
                setEmail("");
                setPassword("");
                setRememberMe(false);
              }}
            >
              <div className="role-art role-art-teacher">
                <img src={heroImage} alt="Guru memantau perkembangan siswa" />
              </div>
              <strong>Guru</strong>
              <span>Pantau dan kelola kelas serta siswa secara mandiri.</span>
              <div className="role-action">
                <GraduationCap size={18} /> Masuk sebagai Guru
              </div>
            </button>
          </div>
        )}

        {/* Form Login */}
        {selectedRole && !isRegisterMode && (
          <div className="login-form">
            <div className="form-heading">
              <div>
                <span>Masuk sebagai</span>
                <strong>{selectedRole === "parent" ? "Orang Tua" : "Guru"}</strong>
              </div>
              <button onClick={() => setSelectedRole(null)}><X size={16} /></button>
            </div>

            <form onSubmit={handleLogin}>
              <label>
                Email atau nomor telepon
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === "parent" ? "rina@keluarga.id" : "andi@sekolah.sch.id"}
                  required
                />
              </label>

              <label>
                Kata sandi
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                />
              </label>

              <div className="form-options">
                <label className="remember" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ingat saya</span>
                </label>
                <button type="button">Lupa kata sandi?</button>
              </div>

              <button type="submit" className="primary-button login-submit" disabled={loading}>
                {loading ? "Memproses..." : "Masuk ke akun"} <ArrowUpRight size={16} />
              </button>
            </form>

            {selectedRole === "teacher" && (
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <span style={{ fontSize: 11, color: "#779691" }}>Belum punya akun guru? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setEmail("");
                    setPassword("");
                    setErrorMsg("");
                  }}
                  style={{
                    color: "#0a9c7e",
                    fontWeight: 800,
                    background: "none",
                    fontSize: 11,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Daftar sebagai Guru Baru (Kode OTP)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form Pendaftaran Guru Baru */}
        {isRegisterMode && !otpStep && (
          <div className="login-form" style={{ maxWidth: 540 }}>
            <div className="form-heading">
              <div>
                <span>Langkah 1 dari 2</span>
                <strong>Registrasi Guru Baru</strong>
              </div>
              <button onClick={() => setIsRegisterMode(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleRegisterTeacher}>
              <label>
                Nama Lengkap & Gelar Guru
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Ustadzah Siti Aminah, S.Pd."
                  required
                />
              </label>

              <label>
                Email Aktif (Untuk Pengiriman OTP)
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama.guru@sekolah.sch.id"
                  required
                />
              </label>

              <label>
                Kata Sandi
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </label>

              <label>
                Nama Sekolah / Lembaga Pendidikan
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Contoh: SDIT Nurul Iman"
                />
              </label>

              <div style={{ marginTop: 18 }}>
                <button type="submit" className="primary-button login-submit" disabled={loading}>
                  {loading ? "Mengirim OTP..." : "Kirim Kode OTP ke Email"} <ArrowUpRight size={16} />
                </button>
              </div>
            </form>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                style={{ color: "#779691", background: "none", fontSize: 11 }}
              >
                Sudah punya akun? Kembali ke halaman masuk
              </button>
            </div>
          </div>
        )}

        {/* Dialog Verifikasi OTP */}
        {isRegisterMode && otpStep && (
          <div className="login-form" style={{ maxWidth: 500, textAlign: "center" }}>
            <div className="form-heading" style={{ justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dff6ef", color: "#0c9d80", display: "grid", placeItems: "center", margin: "0 auto 8px" }}>
                  <KeyRound size={22} />
                </div>
                <strong>Masukkan Kode OTP</strong>
                <span style={{ fontSize: 11, color: "#6e8e89", marginTop: 4 }}>
                  Kode 6-digit telah dikirimkan ke <b>{email}</b>
                </span>
              </div>
            </div>

            {devOtpHint && (
              <div style={{ margin: "14px 0", padding: "10px 14px", background: "#f0fbf7", border: "1px dashed #2bb491", borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: "#177e68", display: "block" }}>[KODE OTP PENGUJIAN LOKAL]</span>
                <strong style={{ fontSize: 20, letterSpacing: 6, color: "#0c9d80" }}>{devOtpHint}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ marginTop: 16 }}>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-Digit OTP"
                maxLength={6}
                required
                style={{
                  fontSize: 24,
                  textAlign: "center",
                  letterSpacing: 8,
                  fontWeight: 800,
                  color: "#184c45",
                  padding: "12px",
                  borderRadius: 10,
                  border: "2px solid #2bb491",
                  width: "100%",
                }}
              />

              <div style={{ marginTop: 18 }}>
                <button type="submit" className="primary-button login-submit" disabled={loading || otpCode.length < 6}>
                  {loading ? "Memverifikasi..." : "Verifikasi & Masuk ke Dashboard"} <ArrowUpRight size={16} />
                </button>
              </div>
            </form>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                style={{ color: "#779691", background: "none", fontSize: 11 }}
              >
                Ubah email pendaftaran
              </button>
            </div>
          </div>
        )}

        <p className="school-contact">
          Sahabat Ibadah · Sistem Pemantauan Ibadah & Kebiasaan Baik Siswa
        </p>
      </div>

      <div className="login-footer-art">
        <div className="mosque-line">☾　⌂　⌂　⌂　⌂　⌂　☽</div>
      </div>
    </div>
  );
}

function PublicHome({
  onLogin,
  onOpenTutorial,
}: {
  onLogin: () => void;
  onOpenTutorial: () => void;
}) {
  const features = [
    { icon: Users, title: "Pantau Ibadah", copy: "Anak setiap hari" },
    { icon: Heart, title: "Kolaborasi", copy: "Orang Tua & Guru" },
    { icon: Activity, title: "Mudah Digunakan", copy: "Kapan saja" },
    { icon: ShieldCheck, title: "Aman & Terpercaya", copy: "Data terlindungi" },
  ];
  return (
    <div className="public-home">
      <header className="public-header">
        <Logo />
        <button className="public-login" onClick={onLogin}>
          Masuk <ArrowUpRight size={16} />
        </button>
      </header>
      <main>
        <section className="public-hero" id="beranda">
          <div className="public-copy">
            <div className="public-kicker">
              <Sparkles size={14} /> Pendampingan tumbuh bersama
            </div>
            <h1>Bersama Membentuk Generasi <em>Berakhlak Mulia</em></h1>
            <p>Pantau dan dampingi kebiasaan ibadah anak setelah di rumah, dengan mudah, aman, dan menyenangkan.</p>
            <div className="public-actions">
              <button className="primary-button public-cta" onClick={onLogin}>
                Mulai Sekarang <ArrowUpRight size={17} />
              </button>
              <button
                type="button"
                className="public-secondary"
                onClick={onOpenTutorial}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer",
                }}
              >
                <BookOpen size={16} /> Tutorial
              </button>
            </div>
            <div className="public-proof">
              <span><CheckCircle2 size={15} /> Terarah</span>
              <span><ShieldCheck size={15} /> Terlindungi</span>
              <span><Heart size={15} /> Penuh perhatian</span>
            </div>
          </div>
          <div className="public-art">
            <img src={homeImage} alt="Ibu mendampingi anak-anak membangun kebiasaan baik" />
            <div className="art-note">
              <span>✦</span><b>Kebiasaan baik hari ini,<br />masa depan hebat nanti</b>
            </div>
          </div>
        </section>

        <section className="feature-strip" id="fitur">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="feature-item" key={feature.title}>
                <div className="feature-icon"><Icon size={21} /></div>
                <div>
                  <strong>{feature.title}</strong>
                  <span>{feature.copy}</span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="public-bottom" id="tentang">
          <div>
            <div className="section-kicker">Sahabat dalam kebiasaan</div>
            <h2>Menjaga rutinitas baik<br /><em>lebih dekat bersama.</em></h2>
          </div>
          <p>
            Orang tua mencatat kebiasaan anak di rumah, guru melihat perkembangannya di sekolah.
            Data guru terisolasi 100% dan tidak bercampur antar satu guru dengan guru lainnya.
          </p>
        </section>
      </main>
      <footer className="public-footer" id="kontak">
        <Logo />
        <span>© 2026 SDN 3 Sumur Putri. All Rights Reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={onOpenTutorial}
            style={{
              background: "none",
              border: "none",
              color: "#3f776d",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <BookOpen size={13} /> Tutorial
          </button>
          <button onClick={onLogin}>Masuk ke akun <ArrowUpRight size={14} /></button>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// KOMPONEN UTAMA (HOME)
// =============================================================================

export default function Home() {
  const [view, setView] = useState<"home" | "login" | "dashboard">("home");
  const [role, setRole] = useState<Role>("parent");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // State Orang Tua
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streak, setStreak] = useState(12);
  const [points, setPoints] = useState(248);
  const [chartBars, setChartBars] = useState<number[]>([42, 66, 58, 78, 63, 88, 74, 96, 82, 90, 71, 84]);
  const [parentNote, setParentNote] = useState("");
  const [teacherNote, setTeacherNote] = useState("");
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; logoUrl: string | null } | null>(null);
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<string>(getTodayStr());

  // State Guru
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [activeClassId, setActiveClassId] = useState<string>("");
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classSummary, setClassSummary] = useState<any>(null);
  const [attentionList, setAttentionList] = useState<any[]>([]);
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string | undefined>(undefined);

  // Modal Dialogs
  const [modalAddClass, setModalAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [modalAddStudent, setModalAddStudent] = useState(false);
  const [modalBulkStudent, setModalBulkStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPreferred, setNewStudentPreferred] = useState("");
  const [modalEditStudent, setModalEditStudent] = useState<any | null>(null);

  // Modal Akun Orang Tua & Kredensial
  const [modalParentAccount, setModalParentAccount] = useState<{
    student: any;
    parent_name: string;
    parent_email: string;
    password: string;
    phone: string;
  } | null>(null);
  const [modalResetParentPassword, setModalResetParentPassword] = useState<{
    student: any;
    password: string;
  } | null>(null);
  const [createdParentCreds, setCreatedParentCreds] = useState<{
    studentName: string;
    parentName: string;
    email: string;
    password: string;
    phone?: string;
    loginUrl: string;
  } | null>(null);

  const completedCount = useMemo(() => habits.filter((h) => h.checked).length, [habits]);
  const menu = role === "parent" ? menuParent : menuTeacher;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

  // Cek token yang tersimpan pada mount
  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    if (storedUser && token) {
      setUser(storedUser);
      setRole(storedUser.role === "teacher" ? "teacher" : "parent");
      setView("dashboard");
    }
  }, []);

  // Muat data saat peran / dashboard aktif
  useEffect(() => {
    if (view !== "dashboard") return;

    if (role === "parent") {
      loadParentData();
    } else if (role === "teacher") {
      loadTeacherData();
    }
  }, [view, role]);

  // Muat data kelas ketika activeClassId berubah
  useEffect(() => {
    if (role === "teacher" && activeClassId) {
      loadClassStudents(activeClassId);
    }
  }, [activeClassId, role]);

  const loadParentData = async () => {
    try {
      // Muat profil orang tua agar info avatar terbaru tersinkron
      try {
        const profRes = await api.parent.getProfile();
        if (profRes.profile) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  fullName: profRes.profile.full_name || prev.fullName,
                  avatarUrl: profRes.profile.avatar_url || prev.avatarUrl,
                }
              : prev
          );
        }
      } catch (e) {
        console.warn("Profil parent belum ada:", e);
      }

      const res = await api.parent.getChildren();
      if (res.children && res.children.length > 0) {
        setChildren(res.children);
        const child = res.children[0];
        setActiveChild(child);

        // Ambil summary & checklist
        const sum = await api.parent.getChildSummary(child.id, selectedChecklistDate);
        if (sum.school) {
          setSchoolInfo(sum.school);
        }
        if (sum.child) {
          setActiveChild((prev: any) => ({
            ...prev,
            ...sum.child,
            avatar_url: sum.child?.avatarUrl !== undefined ? sum.child.avatarUrl : prev?.avatar_url,
          }));
        }
        if (sum.summary) {
          setStreak(sum.streak?.currentStreak || 0);
          setPoints(sum.points || 0);
          if (sum.chartBars?.length) setChartBars(sum.chartBars);
          if (sum.parentNote) setParentNote(sum.parentNote);
          if (sum.teacherNote) setTeacherNote(sum.teacherNote);

          const formattedHabits: Habit[] = sum.items.map((it) => ({
            id: it.id,
            label: it.label,
            category: it.category,
            icon: iconMap[it.iconKey] || Sun,
            color: categoryColorMap[it.id] || "teal",
            checked: it.checked,
            status: it.status,
            version: it.version,
          }));
          setHabits(formattedHabits);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data orang tua:", err);
    }
  };

  const handleSelectChild = async (selected: any) => {
    setActiveChild(selected);
    try {
      const sum = await api.parent.getChildSummary(selected.id, selectedChecklistDate);
      if (sum.school) setSchoolInfo(sum.school);
      if (sum.child) {
        setActiveChild((prev: any) => ({
          ...prev,
          ...sum.child,
          avatar_url: sum.child?.avatarUrl !== undefined ? sum.child.avatarUrl : prev?.avatar_url,
        }));
      }
      if (sum.summary) {
        setStreak(sum.streak?.currentStreak || 0);
        setPoints(sum.points || 0);
        if (sum.chartBars?.length) setChartBars(sum.chartBars);
        if (sum.parentNote) setParentNote(sum.parentNote);
        if (sum.teacherNote) setTeacherNote(sum.teacherNote);

        const formattedHabits: Habit[] = sum.items.map((it) => ({
          id: it.id,
          label: it.label,
          category: it.category,
          icon: iconMap[it.iconKey] || Sun,
          color: categoryColorMap[it.id] || "teal",
          checked: it.checked,
          status: it.status,
          version: it.version,
        }));
        setHabits(formattedHabits);
      }
    } catch (err) {
      console.error("Gagal mengganti anak:", err);
    }
  };

  const loadChildChecklistForDate = async (childId: string, date: string) => {
    try {
      const sum = await api.parent.getChildSummary(childId, date);
      if (sum.summary) {
        setStreak(sum.streak?.currentStreak || 0);
        setPoints(sum.points || 0);
        if (sum.chartBars?.length) setChartBars(sum.chartBars);
        setParentNote(sum.parentNote || "");
        setTeacherNote(sum.teacherNote || "");

        const formattedHabits: Habit[] = sum.items.map((it) => ({
          id: it.id,
          label: it.label,
          category: it.category,
          icon: iconMap[it.iconKey] || Sun,
          color: categoryColorMap[it.id] || "teal",
          checked: it.checked,
          status: it.status,
          version: it.version,
        }));
        setHabits(formattedHabits);
      }
    } catch (err) {
      console.error("Gagal memuat checklist untuk tanggal:", date, err);
    }
  };

  const handleSaveParentProfile = async (data: {
    full_name: string;
    phone?: string;
    avatar_url?: string | null;
  }) => {
    try {
      const res = await api.parent.updateProfile(data);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              fullName: data.full_name,
              avatarUrl: data.avatar_url,
            }
          : prev
      );
      showToast(res.message || "Profil orang tua berhasil diperbarui!");
    } catch (err: any) {
      showToast("Gagal memperbarui profil: " + err.message);
      throw err;
    }
  };

  const handleChangeParentPassword = async (data: {
    current_password: string;
    new_password: string;
  }) => {
    try {
      const res = await api.parent.changePassword(data);
      showToast(res.message || "Kata sandi berhasil diperbarui!");
    } catch (err: any) {
      showToast("Gagal mengubah kata sandi: " + err.message);
      throw err;
    }
  };

  const loadTeacherData = async () => {
    try {
      const prof = await api.teacher.getProfile();
      setTeacherProfile(prof.profile);

      const cls = await api.teacher.getClasses();
      setTeacherClasses(cls.classes);
      if (cls.classes?.length > 0) {
        setActiveClassId((prev) => (cls.classes.some((c: any) => c.id === prev) ? prev : cls.classes[0].id));
      }
    } catch (err) {
      console.error("Gagal memuat data guru:", err);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      const [studRes, sumRes, attRes] = await Promise.all([
        api.teacher.getStudents(classId),
        api.teacher.getClassSummary(classId),
        api.teacher.getAttentionList(classId),
      ]);
      setClassStudents(studRes.students || []);
      setClassSummary(sumRes.summary || null);
      setAttentionList(attRes.attentionList || []);
    } catch (err) {
      console.error("Gagal memuat siswa kelas:", err);
    }
  };

  // Toggle habit di checklist
  const toggleHabit = async (habitId: string) => {
    const current = habits.find((h) => h.id === habitId);
    if (!current || !activeChild) return;

    const nextChecked = !current.checked;
    const nextStatus = nextChecked ? "completed" : "not_completed";

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, checked: nextChecked, status: nextStatus } : h))
    );

    try {
      const res = await api.parent.saveChecklistItem(activeChild.id, habitId, {
        status: nextStatus,
        clientVersion: current.version,
        entryDate: selectedChecklistDate,
      });
      // Update version
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, version: res.version } : h))
      );
    } catch (err: any) {
      showToast("Gagal menyimpan ke server: " + err.message);
      // Revert jika gagal
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, checked: current.checked, status: current.status } : h))
      );
    }
  };

  const saveChecklistAll = async () => {
    if (!activeChild) return;
    try {
      if (parentNote) {
        await api.parent.saveParentNote(activeChild.id, parentNote, selectedChecklistDate);
      }
      showToast("Alhamdulillah! Seluruh checklist dan catatan tersimpan di database lokal.");
    } catch (err: any) {
      showToast("Gagal menyimpan: " + err.message);
    }
  };

  // Guru Actions
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await api.teacher.addClass({ name: newClassName.trim() });
      showToast(`Kelas "${newClassName}" berhasil dibuat!`);
      setNewClassName("");
      setModalAddClass(false);
      loadTeacherData();
    } catch (err: any) {
      showToast("Gagal menambah kelas: " + err.message);
    }
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus/mengarsipkan "${name}"?`)) return;
    try {
      await api.teacher.deleteClass(classId);
      showToast(`Kelas "${name}" berhasil dihapus.`);
      loadTeacherData();
    } catch (err: any) {
      showToast("Gagal menghapus kelas: " + err.message);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeClassId) return;
    try {
      await api.teacher.addStudent(activeClassId, {
        full_name: newStudentName.trim(),
        preferred_name: newStudentPreferred.trim() || undefined,
      });
      showToast(`Siswa "${newStudentName}" berhasil ditambahkan.`);
      setNewStudentName("");
      setNewStudentPreferred("");
      setModalAddStudent(false);
      loadClassStudents(activeClassId);
      loadTeacherData();
    } catch (err: any) {
      showToast("Gagal menambah siswa: " + err.message);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditStudent) return;
    try {
      await api.teacher.updateStudent(modalEditStudent.id, {
        full_name: modalEditStudent.full_name,
        preferred_name: modalEditStudent.preferred_name,
        avatar_url: modalEditStudent.avatar_url,
      });
      showToast(`Data siswa "${modalEditStudent.full_name}" berhasil diperbarui.`);
      setModalEditStudent(null);
      loadClassStudents(activeClassId);
    } catch (err: any) {
      showToast("Gagal mengubah data siswa: " + err.message);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!window.confirm(`Yakin ingin mengeluarkan siswa "${name}" dari kelas?`)) return;
    try {
      await api.teacher.deleteStudent(studentId);
      showToast(`Siswa "${name}" berhasil dikeluarkan dari kelas.`);
      loadClassStudents(activeClassId);
      loadTeacherData();
    } catch (err: any) {
      showToast("Gagal menghapus siswa: " + err.message);
    }
  };

  const handleSaveProfile = async (data: {
    full_name: string;
    email?: string;
    phone: string;
    school_name: string;
    school_logo_url?: string | null;
    avatar_url?: string | null;
  }) => {
    try {
      await api.teacher.updateProfile(data);
      showToast("Profil guru dan sekolah berhasil diperbarui!");
      await loadTeacherData();
    } catch (err: any) {
      showToast("Gagal memperbarui profil: " + err.message);
      throw err;
    }
  };

  const handleChangePassword = async (data: { current_password: string; new_password: string }) => {
    try {
      await api.teacher.changePassword(data);
      showToast("Kata sandi berhasil diperbarui!");
    } catch (err: any) {
      showToast("Gagal mengubah kata sandi: " + err.message);
      throw err;
    }
  };

  // Buat Akun Login Orang Tua oleh Guru
  const handleCreateParentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalParentAccount) return;
    try {
      const res = await api.teacher.createParentAccount(modalParentAccount.student.id, {
        parent_name: modalParentAccount.parent_name,
        parent_email: modalParentAccount.parent_email,
        password: modalParentAccount.password,
        phone: modalParentAccount.phone || undefined,
      });

      const currentOrigin = window.location.origin;
      setCreatedParentCreds({
        studentName: modalParentAccount.student.full_name,
        parentName: modalParentAccount.parent_name,
        email: modalParentAccount.parent_email,
        password: modalParentAccount.password,
        phone: modalParentAccount.phone,
        loginUrl: currentOrigin,
      });

      setModalParentAccount(null);
      showToast(res.message);
      loadClassStudents(activeClassId);
    } catch (err: any) {
      showToast("Gagal membuat akun: " + err.message);
    }
  };

  // Reset Password Orang Tua oleh Guru
  const handleResetParentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalResetParentPassword) return;
    try {
      const res = await api.teacher.resetParentPassword(
        modalResetParentPassword.student.id,
        modalResetParentPassword.password
      );

      const currentOrigin = window.location.origin;
      setCreatedParentCreds({
        studentName: modalResetParentPassword.student.full_name,
        parentName: modalResetParentPassword.student.parent_name || "Orang Tua Siswa",
        email: modalResetParentPassword.student.parent_email || "",
        password: modalResetParentPassword.password,
        phone: modalResetParentPassword.student.parent_phone,
        loginUrl: currentOrigin,
      });

      setModalResetParentPassword(null);
      showToast(res.message);
      loadClassStudents(activeClassId);
    } catch (err: any) {
      showToast("Gagal mereset password: " + err.message);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setView("home");
    showToast("Anda telah keluar dari akun.");
  };

  const handleLoginSuccess = (nextUser: UserSession) => {
    setUser(nextUser);
    setRole(nextUser.role === "teacher" ? "teacher" : "parent");
    setActiveTab("overview");
    setView("dashboard");
    showToast(`Selamat datang, ${nextUser.fullName}!`);
  };

  // Handle upload foto siswa
  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran file foto maksimal 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setModalEditStudent((prev: any) => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (view === "home") {
    return (
      <>
        <PublicHome
          onLogin={() => setView("login")}
          onOpenTutorial={() => setTutorialOpen(true)}
        />
        <TutorialModal
          isOpen={tutorialOpen}
          onClose={() => setTutorialOpen(false)}
          defaultRole="parent"
          onLoginAction={() => {
            setTutorialOpen(false);
            setView("login");
          }}
        />
      </>
    );
  }
  if (view === "login") return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setView("home")} />;

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="close-mobile" onClick={() => setMobileNav(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-role-label">
          <div className={`role-label-icon ${role === "parent" ? "parent" : "teacher"}`}>
            {role === "parent" ? <UserRound size={15} /> : <GraduationCap size={15} />}
          </div>
          <div>
            <span>Masuk sebagai</span>
            <strong>{role === "parent" ? "Orang Tua" : "Guru"}</strong>
          </div>
        </div>

        <div className="sidebar-label">Menu utama</div>
        <nav>
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNav(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.id === "messages" && <span className="nav-count">✓</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-tip">
          <div className="tip-icon"><Leaf size={17} /></div>
          <strong>Pusat Panduan</strong>
          <p>Pelajari cara penggunaan fitur guru & orang tua secara lengkap.</p>
          <button onClick={() => setTutorialOpen(true)}>
            Buka Tutorial <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="sidebar-profile">
          <Avatar
            src={role === "teacher" ? teacherProfile?.avatar_url : (user?.avatarUrl || activeChild?.avatar_url)}
            initials={user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : role === "parent" ? "BR" : "PA"}
            tone={role === "parent" ? "pink" : "blue"}
          />
          <div>
            <strong>{user?.fullName || (role === "parent" ? "Bunda Rina" : "Pak Andi")}</strong>
            <span>{role === "parent" ? "Orang Tua Siswa" : "Guru Wali Kelas"}</span>
          </div>
          <MoreHorizontal size={17} />
        </div>

        <button className="logout-link" onClick={handleLogout}>
          <LogOut size={14} /> Keluar akun
        </button>
      </aside>

      {/* BACKDROP MOBILE SIDEBAR (JELAS DAN TIDAK TRANSPARAN) */}
      {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)} />}

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}>
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span>{role === "parent" ? "Orang Tua" : "Guru"}</span>
            <ChevronRight size={14} />
            <b>{menu.find((item) => item.id === activeTab)?.label}</b>
          </div>

          <div className="topbar-actions">
            <button
              className="help-button"
              onClick={() => setTutorialOpen(true)}
              title="Buka Pusat Tutorial & Panduan Penggunaan"
            >
              <CircleHelp size={18} />
              <span>Tutorial</span>
            </button>
            <button className="notification-button" onClick={() => showToast("Notifikasi: Sistem berjalan lancar dan sinkron")}>
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <div className="topbar-user">
              <Avatar
                src={role === "teacher" ? teacherProfile?.avatar_url : (user?.avatarUrl || activeChild?.avatar_url)}
                initials={user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : role === "parent" ? "BR" : "PA"}
                tone={role === "parent" ? "pink" : "blue"}
              />
              <div>
                <strong>{user?.fullName || (role === "parent" ? "Bunda Rina" : "Pak Andi")}</strong>
                <span>{user?.email}</span>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div className="page-content">
          {/* VIEW ORANG TUA */}
          {role === "parent" && activeTab === "overview" && (
            <ParentOverview
              user={user}
              child={activeChild}
              childrenList={children}
              onSelectChild={handleSelectChild}
              habits={habits}
              completedCount={completedCount}
              streak={streak}
              points={points}
              chartBars={chartBars}
              teacherNote={teacherNote}
              schoolInfo={schoolInfo}
              onNavigate={setActiveTab}
              onGoToChecklistDate={(date) => {
                setSelectedChecklistDate(date);
                if (activeChild) loadChildChecklistForDate(activeChild.id, date);
                setActiveTab("checklist");
              }}
            />
          )}

          {role === "parent" && activeTab === "checklist" && (
            <ChecklistPage
              child={activeChild}
              habits={habits}
              streak={streak}
              parentNote={parentNote}
              selectedDate={selectedChecklistDate}
              onSelectDate={(newDate) => {
                setSelectedChecklistDate(newDate);
                if (activeChild) loadChildChecklistForDate(activeChild.id, newDate);
              }}
              onToggle={toggleHabit}
              onSave={saveChecklistAll}
              onNoteChange={setParentNote}
            />
          )}

          {role === "parent" && activeTab === "progress" && (
            <ParentProgressView
              child={activeChild}
              childrenList={children}
              streak={streak}
              points={points}
              onSelectChild={handleSelectChild}
            />
          )}

          {role === "parent" && activeTab === "reports" && (
            <ParentReportsView
              child={activeChild}
              childrenList={children}
              schoolInfo={schoolInfo}
              user={user}
              onSelectChild={handleSelectChild}
            />
          )}

          {role === "parent" && activeTab === "messages" && (
            <ParentMessagesView
              child={activeChild}
              parentAvatar={user?.avatarUrl}
            />
          )}

          {role === "parent" && activeTab === "settings" && (
            <ParentSettingsView
              user={user}
              childrenList={children}
              onSaveProfile={handleSaveParentProfile}
              onChangePassword={handleChangeParentPassword}
            />
          )}

          {/* VIEW GURU: DASHBOARD OVERVIEW */}
          {role === "teacher" && activeTab === "overview" && (
            <TeacherOverview
              teacher={teacherProfile}
              classes={teacherClasses}
              activeClassId={activeClassId}
              students={classStudents}
              summary={classSummary}
              attentionList={attentionList}
              onSelectClass={setActiveClassId}
              onOpenAddClass={() => setModalAddClass(true)}
              onOpenAddStudent={() => setModalAddStudent(true)}
              onOpenEditStudent={(s) => setModalEditStudent(s)}
              onDeleteStudent={handleDeleteStudent}
              onDeleteClass={handleDeleteClass}
              onNavigate={setActiveTab}
            />
          )}

          {/* VIEW GURU: DAFTAR SISWA (FITUR AKTIF 1 & 4) */}
          {role === "teacher" && activeTab === "progress" && (
            <TeacherStudentList
              classes={teacherClasses}
              activeClassId={activeClassId}
              students={classStudents}
              onSelectClass={setActiveClassId}
              onOpenAddStudent={() => setModalAddStudent(true)}
              onOpenEditStudent={(s) => setModalEditStudent(s)}
              onDeleteStudent={handleDeleteStudent}
              onOpenBulkStudent={() => setModalBulkStudent(true)}
              onOpenParentAccount={(s) => {
                const cleanFirstName = (s.preferred_name || s.full_name || "siswa")
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "");
                const suggestedEmail = `ortu.${cleanFirstName}@sekolah.id`;
                setModalParentAccount({
                  student: s,
                  parent_name: s.parent_name || `Orang Tua ${s.preferred_name || s.full_name}`,
                  parent_email: s.parent_email || suggestedEmail,
                  password: "Siswa" + Math.floor(1000 + Math.random() * 9000) + "!",
                  phone: s.parent_phone || "",
                });
              }}
              onOpenResetParentPassword={(s) => {
                setModalResetParentPassword({
                  student: s,
                  password: "Sandi" + Math.floor(1000 + Math.random() * 9000) + "!",
                });
              }}
              onOpenChatWithStudent={(s) => {
                setSelectedChatStudentId(s.id);
                setActiveTab("messages");
              }}
            />
          )}

          {/* VIEW GURU: MANAJEMEN BUTIR IBADAH & KEBIASAAN */}
          {role === "teacher" && activeTab === "habits" && (
            <TeacherHabitsView
              showToast={showToast}
            />
          )}

          {/* VIEW GURU: LAPORAN MINGGUAN (FITUR AKTIF) */}
          {role === "teacher" && activeTab === "reports" && (
            <TeacherWeeklyReport
              activeClassId={activeClassId}
              classes={teacherClasses}
              onSelectClass={setActiveClassId}
            />
          )}

          {/* VIEW GURU: PESAN ORANG TUA (FITUR AKTIF) */}
          {role === "teacher" && activeTab === "messages" && (
            <TeacherMessagesView
              classes={teacherClasses}
              activeClassId={activeClassId}
              onSelectClass={setActiveClassId}
              initialChildId={selectedChatStudentId}
              teacherAvatar={teacherProfile?.avatar_url}
            />
          )}

          {/* TAB PENGATURAN GURU & LOGO SEKOLAH (FITUR AKTIF 2 & 3) */}
          {role === "teacher" && activeTab === "settings" && (
            <TeacherSettings
              teacher={teacherProfile}
              onSaveProfile={handleSaveProfile}
              onChangePassword={handleChangePassword}
            />
          )}

          {/* PLACEHOLDER TAB LAINNYA */}
          {((role === "parent" && !["overview", "checklist", "progress", "reports", "messages", "settings"].includes(activeTab)) ||
            (role === "teacher" && !["overview", "progress", "habits", "reports", "messages", "settings"].includes(activeTab))) && (
            <section className="empty-state panel">
              <div className="empty-icon"><HomeIcon size={30} /></div>
              <div className="section-kicker">Modul</div>
              <h1>{menu.find((m) => m.id === activeTab)?.label}</h1>
              <p>Data tersimpan dan terhubung secara langsung ke backend database SQLite lokal.</p>
              <button className="primary-button" onClick={() => setActiveTab("overview")}>
                <HomeIcon size={16} /> Kembali ke Dashboard
              </button>
            </section>
          )}
        </div>
      </main>

      {/* MODAL PENDAFTARAN SISWA MASAL */}
      <BulkStudentModal
        isOpen={modalBulkStudent}
        onClose={() => setModalBulkStudent(false)}
        classes={teacherClasses}
        activeClassId={activeClassId}
        onSuccess={() => {
          loadClassStudents(activeClassId);
          loadTeacherData();
        }}
        showToast={showToast}
      />

      {/* MODAL TAMBAH KELAS */}
      {modalAddClass && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 440, padding: 24, background: "#fff", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <strong style={{ fontSize: 14, color: "#174e46" }}>Tambah Kelas Baru (Guru)</strong>
              <button onClick={() => setModalAddClass(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddClass}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55", marginBottom: 16 }}>
                Nama Kelas
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Contoh: Kelas 4B"
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 6, fontSize: 12 }}
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="ghost-button" onClick={() => setModalAddClass(false)}>Batal</button>
                <button type="submit" className="primary-button">Simpan Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SISWA */}
      {modalAddStudent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 460, padding: 24, background: "#fff", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <strong style={{ fontSize: 14, color: "#174e46" }}>Tambah Siswa ke Kelas</strong>
              <button onClick={() => setModalAddStudent(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddStudent} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nama Lengkap Siswa
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Contoh: Muhammad Faris"
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nama Panggilan
                <input
                  type="text"
                  value={newStudentPreferred}
                  onChange={(e) => setNewStudentPreferred(e.target.value)}
                  placeholder="Contoh: Faris"
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" className="ghost-button" onClick={() => setModalAddStudent(false)}>Batal</button>
                <button type="submit" className="primary-button">Tambahkan Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENDAFTARAN SISWA & ORANG TUA SECARA MASAL (IMPORT) */}
      <BulkStudentModal
        isOpen={modalBulkStudent}
        onClose={() => setModalBulkStudent(false)}
        classes={teacherClasses}
        activeClassId={activeClassId}
        onSuccess={() => {
          if (activeClassId) loadClassStudents(activeClassId);
        }}
        showToast={showToast}
      />

      {/* MODAL EDIT DATA DIRI & FOTO SISWA (FITUR 4) */}
      {modalEditStudent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 480, padding: 24, background: "#fff", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <strong style={{ fontSize: 14, color: "#174e46" }}>Edit Siswa & Foto Profil</strong>
              <button onClick={() => setModalEditStudent(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditStudent} style={{ display: "grid", gap: 14 }}>
              {/* UPLOAD & PREVIEW FOTO SISWA */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: "#f4fbf8", borderRadius: 12, border: "1px dashed #b2ded1" }}>
                <Avatar
                  src={modalEditStudent.avatar_url}
                  initials={modalEditStudent.preferred_name?.slice(0, 2).toUpperCase() || modalEditStudent.full_name?.slice(0, 2).toUpperCase()}
                  size="large"
                  tone="teal"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#174e46" }}>Foto Siswa</div>
                  <div style={{ fontSize: 10, color: "#597c74", marginBottom: 8 }}>Tampil di dashboard Orang Tua & Guru</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, background: "#e8f7f2", color: "#1b6d5c", padding: "6px 10px", borderRadius: 6, border: "1px solid #b2ded1" }}>
                      <Camera size={13} />
                      <span>{modalEditStudent.avatar_url ? "Ganti Foto" : "Unggah Foto"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStudentPhotoChange}
                        style={{ display: "none" }}
                      />
                    </label>
                    {modalEditStudent.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setModalEditStudent({ ...modalEditStudent, avatar_url: null })}
                        style={{ background: "none", border: "none", color: "#dc2626", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Trash2 size={12} /> Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nama Lengkap Siswa
                <input
                  type="text"
                  value={modalEditStudent.full_name}
                  onChange={(e) => setModalEditStudent({ ...modalEditStudent, full_name: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nama Panggilan
                <input
                  type="text"
                  value={modalEditStudent.preferred_name || ""}
                  onChange={(e) => setModalEditStudent({ ...modalEditStudent, preferred_name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button type="button" className="ghost-button" onClick={() => setModalEditStudent(null)}>Batal</button>
                <button type="submit" className="primary-button">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUAT AKUN LOGIN ORANG TUA (FITUR 4) */}
      {modalParentAccount && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 480, padding: 24, background: "#fff", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e8f7f2", color: "#1b6d5c", display: "grid", placeItems: "center" }}>
                  <UserPlus size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: 14, color: "#174e46" }}>Buat Akun Portal Orang Tua</strong>
                  <div style={{ fontSize: 10, color: "#618b80" }}>Untuk ananda: {modalParentAccount.student.full_name}</div>
                </div>
              </div>
              <button onClick={() => setModalParentAccount(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateParentAccount} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nama Orang Tua / Wali
                <input
                  type="text"
                  value={modalParentAccount.parent_name}
                  onChange={(e) => setModalParentAccount({ ...modalParentAccount, parent_name: e.target.value })}
                  placeholder="Contoh: Bapak Ahmad / Ibu Siti"
                  required
                  style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>

              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Email Login Orang Tua
                <input
                  type="email"
                  value={modalParentAccount.parent_email}
                  onChange={(e) => setModalParentAccount({ ...modalParentAccount, parent_email: e.target.value })}
                  placeholder="Contoh: ahmad.wali@gmail.com"
                  required
                  style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>

              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Nomor WhatsApp (Opsional, untuk kirim pesan)
                <input
                  type="tel"
                  value={modalParentAccount.phone}
                  onChange={(e) => setModalParentAccount({ ...modalParentAccount, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid #cbe3dc", marginTop: 4, fontSize: 12 }}
                />
              </label>

              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Kata Sandi Awal
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    value={modalParentAccount.password}
                    onChange={(e) => setModalParentAccount({ ...modalParentAccount, password: e.target.value })}
                    required
                    style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 12, fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setModalParentAccount({ ...modalParentAccount, password: "Ananda" + Math.floor(1000 + Math.random() * 9000) + "!" })}
                    className="ghost-button"
                    style={{ fontSize: 11, whiteSpace: "nowrap", padding: "0 10px" }}
                  >
                    Acak Sandi
                  </button>
                </div>
              </label>

              <div style={{ padding: "8px 12px", background: "#f0f8f5", borderRadius: 8, fontSize: 11, color: "#286355" }}>
                💡 Setelah akun dibuat, template pesan berisi email & sandi siap disalin untuk dikirim ke WhatsApp Orang Tua.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button type="button" className="ghost-button" onClick={() => setModalParentAccount(null)}>Batal</button>
                <button type="submit" className="primary-button">Buat Akun & Lanjut</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD AKUN ORANG TUA */}
      {modalResetParentPassword && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(10, 34, 29, 0.78)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 450, padding: 24, background: "#fff", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff5eb", color: "#b45309", display: "grid", placeItems: "center" }}>
                  <KeyRound size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: 14, color: "#174e46" }}>Reset Kata Sandi Orang Tua</strong>
                  <div style={{ fontSize: 10, color: "#618b80" }}>{modalResetParentPassword.student.full_name} ({modalResetParentPassword.student.parent_email})</div>
                </div>
              </div>
              <button onClick={() => setModalResetParentPassword(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleResetParentPassword} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#365c55" }}>
                Kata Sandi Baru
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    value={modalResetParentPassword.password}
                    onChange={(e) => setModalResetParentPassword({ ...modalResetParentPassword, password: e.target.value })}
                    required
                    style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 12, fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setModalResetParentPassword({ ...modalResetParentPassword, password: "Sandi" + Math.floor(1000 + Math.random() * 9000) + "!" })}
                    className="ghost-button"
                    style={{ fontSize: 11, whiteSpace: "nowrap", padding: "0 10px" }}
                  >
                    Acak Sandi
                  </button>
                </div>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button type="button" className="ghost-button" onClick={() => setModalResetParentPassword(null)}>Batal</button>
                <button type="submit" className="primary-button">Perbarui Sandi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KREDENSIAL SIAP KIRIM KE WHATSAPP ORANG TUA */}
      {createdParentCreds && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(10, 34, 29, 0.84)", display: "grid", placeItems: "center", padding: 16 }}>
          <div className="panel" style={{ width: "100%", maxWidth: 500, padding: 24, background: "#fff", borderRadius: 18, border: "1px solid #cbe3dc", boxShadow: "0 20px 45px rgba(10,48,40,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#e8f7f2", color: "#166534", display: "grid", placeItems: "center" }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: 15, color: "#14532d" }}>Akun Orang Tua Siap!</strong>
                  <div style={{ fontSize: 11, color: "#597c74" }}>Kredensial login berhasil diperbarui di database</div>
                </div>
              </div>
              <button onClick={() => setCreatedParentCreds(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ background: "#f8faf9", padding: "12px 16px", borderRadius: 10, border: "1px solid #e1ede8", marginBottom: 14, fontSize: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 6, color: "#174e46" }}>
                <span style={{ color: "#618b80" }}>Siswa:</span>
                <strong>{createdParentCreds.studentName}</strong>
                <span style={{ color: "#618b80" }}>Wali Murid:</span>
                <span>{createdParentCreds.parentName}</span>
                <span style={{ color: "#618b80" }}>Email Login:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f766e" }}>{createdParentCreds.email}</span>
                <span style={{ color: "#618b80" }}>Kata Sandi:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f766e" }}>{createdParentCreds.password}</span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#365c55", marginBottom: 6 }}>Format Pesan WhatsApp:</div>
              <textarea
                readOnly
                rows={6}
                value={`Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Bapak/Ibu ${createdParentCreds.parentName} (Orang Tua dari ananda ${createdParentCreds.studentName}),\n\nBerikut adalah akses login ke Portal Sahabat Ibadah untuk memantau dan mengisi mutaba'ah ibadah harian siswa:\n🌐 Link Web: ${createdParentCreds.loginUrl}\n📧 Email Login: ${createdParentCreds.email}\n🔑 Kata Sandi: ${createdParentCreds.password}\n\nSilakan masuk dan lengkapi checklist ibadah ananda setiap hari. Jazakumullah khairan katsiran.\n— Guru Kelas`}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbe3dc", fontSize: 11, background: "#fdfefe", fontFamily: "inherit", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Bapak/Ibu ${createdParentCreds.parentName} (Orang Tua dari ananda ${createdParentCreds.studentName}),\n\nBerikut adalah akses login ke Portal Sahabat Ibadah untuk memantau dan mengisi mutaba'ah ibadah harian siswa:\n🌐 Link Web: ${createdParentCreds.loginUrl}\n📧 Email Login: ${createdParentCreds.email}\n🔑 Kata Sandi: ${createdParentCreds.password}\n\nSilakan masuk dan lengkapi checklist ibadah ananda setiap hari. Jazakumullah khairan katsiran.\n— Guru Kelas`;
                  navigator.clipboard.writeText(text);
                  showToast("Teks pesan WhatsApp berhasil disalin ke clipboard!");
                }}
              >
                <Copy size={14} /> Salin Pesan
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. Bapak/Ibu ${createdParentCreds.parentName} (Orang Tua dari ananda ${createdParentCreds.studentName}),\n\nBerikut adalah akses login ke Portal Sahabat Ibadah untuk memantau dan mengisi mutaba'ah ibadah harian siswa:\n🌐 Link Web: ${createdParentCreds.loginUrl}\n📧 Email Login: ${createdParentCreds.email}\n🔑 Kata Sandi: ${createdParentCreds.password}\n\nSilakan masuk dan lengkapi checklist ibadah ananda setiap hari. Jazakumullah khairan katsiran.\n— Guru Kelas`;
                  const phoneNum = createdParentCreds.phone ? createdParentCreds.phone.replace(/^0/, "62").replace(/[^0-9]/g, "") : "";
                  const waUrl = phoneNum
                    ? `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`
                    : `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(waUrl, "_blank");
                }}
              >
                <Share2 size={14} /> Buka WhatsApp
              </button>

              <button
                type="button"
                className="outline-button"
                onClick={() => setCreatedParentCreds(null)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUSAT TUTORIAL MODAL (DAPAT DIAKSES DARI TOPBAR & SIDEBAR) */}
      <TutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        defaultRole={role === "teacher" ? "teacher" : "parent"}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
