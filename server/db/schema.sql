-- =============================================================================
-- Sahabat Ibadah Database Schema (SQLite)
-- Sesuai PRD Bab 9, Isolasi Data Per-Guru & Registrasi OTP
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Schools (Tenant / Organisasi Sekolah atau Institusi Guru)
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  logo_url TEXT,
  settings_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Users (Akun Guru, Orang Tua, Admin)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'deleted')),
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. User Roles (Relasi Akun dengan Peran dan Sekolah)
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin', 'superadmin')),
  created_at TEXT NOT NULL,
  UNIQUE(user_id, school_id, role)
);

-- 4. Email Verifications & OTP (Pendaftaran Guru dengan OTP Email)
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',
  full_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL
);

-- 5. Classes (Rombel / Kelas yang dimiliki dan dikelola guru secara terisolasi)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT,
  academic_year TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Children (Profil Data Siswa)
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  birth_date TEXT,
  grade_level TEXT,
  gender TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 7. Student Class Links (Penghubung Siswa dengan Kelas Guru)
CREATE TABLE IF NOT EXISTS student_class_links (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'moved')),
  created_at TEXT NOT NULL,
  UNIQUE(child_id, class_id)
);

-- 8. Teacher Class Links
CREATE TABLE IF NOT EXISTS teacher_class_links (
  id TEXT PRIMARY KEY,
  teacher_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_homeroom INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(teacher_user_id, class_id)
);

-- 9. Parent Child Links (Penghubung Orang Tua dengan Siswa)
CREATE TABLE IF NOT EXISTS parent_child_links (
  id TEXT PRIMARY KEY,
  parent_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  created_at TEXT NOT NULL,
  UNIQUE(parent_user_id, child_id)
);

-- 10. Habit Templates
CREATE TABLE IF NOT EXISTS habit_templates (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 11. Habit Template Items (Daftar Ibadah & Kebiasaan)
CREATE TABLE IF NOT EXISTS habit_template_items (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES habit_templates(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('ibadah_wajib', 'ibadah_harian', 'kebiasaan_baik')),
  name TEXT NOT NULL,
  description TEXT,
  icon_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 12. Habit Periods
CREATE TABLE IF NOT EXISTS habit_periods (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 13. Checklist Entries (Status Catatan Ibadah Siswa Harian)
CREATE TABLE IF NOT EXISTS checklist_entries (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  habit_item_id TEXT NOT NULL REFERENCES habit_template_items(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_reported' CHECK (status IN ('completed', 'not_completed', 'not_reported')),
  reported_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reported_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'parent' CHECK (source IN ('parent', 'teacher', 'admin', 'system')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(child_id, habit_item_id, entry_date)
);

-- 14. Checklist Notes (Catatan Harian Orang Tua atau Apresiasi Guru)
CREATE TABLE IF NOT EXISTS checklist_notes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  note TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('parent', 'teacher', 'admin')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 15. Streak Snapshots (Snapshot Konsistensi)
CREATE TABLE IF NOT EXISTS streak_snapshots (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_calculated_date TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(child_id)
);

-- 16. Points Ledger (Buku Besar Poin Kebaikan Immutable)
CREATE TABLE IF NOT EXISTS points_ledger (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'checklist',
  created_at TEXT NOT NULL
);

-- 17. Badges (Definisi Lencana Apresiasi)
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  criteria_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 18. Child Badges (Lencana yang Diperoleh Siswa)
CREATE TABLE IF NOT EXISTS child_badges (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TEXT NOT NULL,
  UNIQUE(child_id, badge_id)
);

-- 19. Message Threads
CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 20. Messages (Pesan Guru & Orang Tua Terikat Siswa)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  read_at TEXT,
  deleted_at TEXT
);

-- 21. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read_at TEXT,
  created_at TEXT NOT NULL
);

-- 22. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiet_hours_start TEXT DEFAULT '21:00',
  quiet_hours_end TEXT DEFAULT '05:00',
  email_enabled INTEGER NOT NULL DEFAULT 1,
  inapp_enabled INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id)
);

-- 23. Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

-- 24. Consents
CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL DEFAULT '1.0',
  agreed_at TEXT NOT NULL
);

-- 25. Audit Logs (Pencatatan Perubahan Sensitif & Checklist)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_json TEXT,
  after_json TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL
);

-- 26. Reports (Metadata Laporan yang Dibuat)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  child_id TEXT,
  class_id TEXT,
  report_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- =============================================================================
-- Indeks Minimum (PRD Bab 9.4 & Performa)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_children_school_status ON children(school_id, status);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_class_links_class ON student_class_links(class_id, status);
CREATE INDEX IF NOT EXISTS idx_checklist_child_date ON checklist_entries(child_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_checklist_school_date ON checklist_entries(school_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_messages_thread_sent ON messages(thread_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_school_created ON audit_logs(school_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
