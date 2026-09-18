-- =============================================================================
-- BAGIAN 1 DARI 4: SKEMA, AKUN GURU, 2 KELAS, 50 SISWA & 50 AKUN ORANG TUA
-- Ukuran sangat ringan (~50 KB) - Langsung Run di Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- SAHABAT IBADAH — SKEMA TABEL POSTGRESQL (SUPABASE)
-- =============================================================================

-- 1. Bersihkan tabel lama jika ada agar struktur 50 siswa masuk bersih tanpa bentrok kunci unik
DROP TABLE IF EXISTS checklist_notes, streak_snapshots, points_ledger, child_badges, badges,
  checklist_entries, parent_child_links, teacher_class_links, student_class_links,
  children, habit_periods, habit_template_items, habit_templates, classes,
  email_verifications, user_roles, users, schools, audit_logs CASCADE;

-- =============================================================================
-- Sahabat Ibadah Database Schema (SQLite)
-- Sesuai PRD Bab 9, Isolasi Data Per-Guru & Registrasi OTP
-- =============================================================================



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

-- DATA: schools (1 rows)
INSERT INTO schools (id, name, code, timezone, status, settings_json, created_at, updated_at, logo_url)
VALUES
  ('sch-sd-islam-01', 'SDN 3 Sumur Putri', 'SIS-001', 'Asia/Jakarta', 'active', '{}', '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z', NULL)
ON CONFLICT DO NOTHING;

-- DATA: users (54 rows)
INSERT INTO users (id, email, phone, password_hash, full_name, avatar_url, status, last_login_at, created_at, updated_at)
VALUES
  ('user-teacher-andi', 'andi@sekolah.sch.id', '081234567890', 'bd5b65674277d8db40ebf222850afb2d:b7c71066d511a7a9445d6f3241a859a706ab7c9e8737ebf7f54d1db00c8d91401fe0337e186e6d16d6a30a2d12850c32c6b07f709c1bf6cd66b49f9b95ba3a1e', 'Pak Andi', NULL, 'active', '2026-09-17T15:00:03.356Z', '2026-09-17T05:16:22.742Z', '2026-09-17T14:53:46.503Z'),
  ('user-parent-rina', 'rina@keluarga.id', '081298765432', '95046dfdd1bc2a5e62716adcb5b52791:c93cf2833cca6c6df2ba9a323ef3b69ae0f35fa2f6cb3e6518778ee25a5d8f9cc0f7a60cd811c7502c5b5309703f63f5fe76e09d63e014dee35a6d1abd2ba79b', 'Bunda Rina', NULL, 'active', '2026-09-17T07:18:48.464Z', '2026-09-17T05:16:22.742Z', '2026-09-17T06:44:26.575Z'),
  ('user-admin-sekolah', 'admin@sekolah.sch.id', '081111222333', 'bd5b65674277d8db40ebf222850afb2d:b7c71066d511a7a9445d6f3241a859a706ab7c9e8737ebf7f54d1db00c8d91401fe0337e186e6d16d6a30a2d12850c32c6b07f709c1bf6cd66b49f9b95ba3a1e', 'Admin Sekolah', NULL, 'active', NULL, '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z'),
  ('user-prn-56ccf264', 'fatimah@test.id', '081233445566', 'a553751b4312eee7215b5b84eff52926:a866c843c0dd1b3b4b24657c0a3a595ffbc5313ae452a4b6527f51a0149ee015dbe145ea926624b9afb58563bf0a9bca1f4b6d858cefa1c7f8366aa46ad4f0bb', 'Ibu Fatimah', NULL, 'active', NULL, '2026-09-17T06:37:23.786Z', '2026-09-17T06:37:23.786Z'),
  ('user-parent-01', 'ortu.ghani@keluarga.id', '08120000001', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Hendra Alvarizy', NULL, 'active', '2026-09-17T12:47:24.614Z', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-02', 'ortu.abidah@keluarga.id', '08120000002', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Daniya Prawira', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-03', 'ortu.abidzar@keluarga.id', '08120000003', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Adhi Tama', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-04', 'ortu.abizar@keluarga.id', '08120000004', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Syahreza', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-05', 'ortu.abujal@keluarga.id', '08120000005', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Mansur', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-06', 'ortu.addrean@keluarga.id', '08120000006', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Hafidz', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-07', 'ortu.adel@keluarga.id', '08120000007', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Nacita', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-08', 'ortu.adibah.uzma@keluarga.id', '08120000008', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Zahra', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-09', 'ortu.adlan@keluarga.id', '08120000009', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Ujay Pradifta', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-10', 'ortu.adzriel@keluarga.id', '08120000010', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Rafiq Syahputra', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-11', 'ortu.afifah@keluarga.id', '08120000011', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Ramadanti', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-12', 'ortu.afika@keluarga.id', '08120000012', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Mutia Sari', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-13', 'ortu.afkar@keluarga.id', '08120000013', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Nurdiansyah', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-14', 'ortu.aghisna@keluarga.id', '08120000014', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Ramadhan', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-15', 'ortu.arfan.raffasya@keluarga.id', '08120000015', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Raffasya', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-16', 'ortu.azkha@keluarga.id', '08120000016', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Maula', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-17', 'ortu.zacky@keluarga.id', '08120000017', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Ridwan', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-18', 'ortu.aifin@keluarga.id', '08120000018', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Ramadan', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-19', 'ortu.aijas@keluarga.id', '08120000019', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Farsa Muzakky', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-20', 'ortu.ainun@keluarga.id', '08120000020', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Asyifa', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-21', 'ortu.aiqah@keluarga.id', '08120000021', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Shofia', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-22', 'ortu.akila.sugiati@keluarga.id', '08120000022', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Sugiati', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-23', 'ortu.akila.monica@keluarga.id', '08120000023', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Monica', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-24', 'ortu.faeyza@keluarga.id', '08120000024', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Revindra Rasya', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-25', 'ortu.hasbi@keluarga.id', '08120000025', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Hasbi', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-26', 'ortu.alby@keluarga.id', '08120000026', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Fachry', NULL, 'active', '2026-09-17T12:36:16.134Z', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-27', 'ortu.aldi@keluarga.id', '08120000027', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Yansyah', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-28', 'ortu.alfa@keluarga.id', '08120000028', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Mahesa', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-29', 'ortu.alfreda@keluarga.id', '08120000029', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Avram', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-30', 'ortu.ali@keluarga.id', '08120000030', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Saputra', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-31', 'ortu.alia@keluarga.id', '08120000031', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Agustina', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-32', 'ortu.alika@keluarga.id', '08120000032', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Nayla Putri', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-33', 'ortu.alisa@keluarga.id', '08120000033', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Acahya', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-34', 'ortu.alisya@keluarga.id', '08120000034', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Zara', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-35', 'ortu.aliyyah@keluarga.id', '08120000035', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Azahra', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-36', 'ortu.alya.rahma@keluarga.id', '08120000036', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Pratiwi', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-37', 'ortu.alya.tansy@keluarga.id', '08120000037', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Rozua', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-38', 'ortu.calista@keluarga.id', '08120000038', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Calista', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-39', 'ortu.anisa@keluarga.id', '08120000039', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Amalia', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-40', 'ortu.annisa.diah@keluarga.id', '08120000040', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Diah Azkadina', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-41', 'ortu.annisa.septiana@keluarga.id', '08120000041', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Septiana', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-42', 'ortu.aqila.salma@keluarga.id', '08120000042', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Salma', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-43', 'ortu.aqilla.rizkika@keluarga.id', '08120000043', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Ibu Ayu', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-44', 'ortu.aqmar@keluarga.id', '08120000044', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Alhanan', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-45', 'ortu.bintang@keluarga.id', '08120000045', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Firdaus', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-46', 'ortu.rifid@keluarga.id', '08120000046', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Alfatih', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-47', 'ortu.athariz@keluarga.id', '08120000047', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Mubarok', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-48', 'ortu.rafisqi@keluarga.id', '08120000048', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Kurniawan', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-49', 'ortu.ghibran@keluarga.id', '08120000049', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Fadillah', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('user-parent-50', 'ortu.arjuna@keluarga.id', '08120000050', '28b704d8357ff0e899a39dd50b8cb78b:9785e68f43691ab5e9ca7d2ce1f832991b077e71feef24be8d8e004fcf7d291aae45b1929ffb56f9689f86f1bcace24f0611e12e87c826deaa1f3418c8e4957e', 'Bapak Pandu', NULL, 'active', NULL, '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z')
ON CONFLICT DO NOTHING;

-- DATA: user_roles (54 rows)
INSERT INTO user_roles (id, user_id, school_id, role, created_at)
VALUES
  ('role-teacher-1', 'user-teacher-andi', 'sch-sd-islam-01', 'teacher', '2026-09-17T05:16:22.742Z'),
  ('role-parent-1', 'user-parent-rina', 'sch-sd-islam-01', 'parent', '2026-09-17T05:16:22.742Z'),
  ('role-admin-1', 'user-admin-sekolah', 'sch-sd-islam-01', 'admin', '2026-09-17T05:16:22.742Z'),
  ('role-b52408ec', 'user-prn-56ccf264', 'sch-sd-islam-01', 'parent', '2026-09-17T06:37:23.786Z'),
  ('role-prn-01', 'user-parent-01', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-02', 'user-parent-02', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-03', 'user-parent-03', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-04', 'user-parent-04', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-05', 'user-parent-05', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-06', 'user-parent-06', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-07', 'user-parent-07', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-08', 'user-parent-08', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-09', 'user-parent-09', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-10', 'user-parent-10', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-11', 'user-parent-11', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-12', 'user-parent-12', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-13', 'user-parent-13', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-14', 'user-parent-14', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-15', 'user-parent-15', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-16', 'user-parent-16', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-17', 'user-parent-17', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-18', 'user-parent-18', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-19', 'user-parent-19', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-20', 'user-parent-20', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-21', 'user-parent-21', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-22', 'user-parent-22', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-23', 'user-parent-23', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-24', 'user-parent-24', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-25', 'user-parent-25', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-26', 'user-parent-26', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-27', 'user-parent-27', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-28', 'user-parent-28', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-29', 'user-parent-29', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-30', 'user-parent-30', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-31', 'user-parent-31', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-32', 'user-parent-32', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-33', 'user-parent-33', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-34', 'user-parent-34', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-35', 'user-parent-35', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-36', 'user-parent-36', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-37', 'user-parent-37', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-38', 'user-parent-38', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-39', 'user-parent-39', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-40', 'user-parent-40', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-41', 'user-parent-41', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-42', 'user-parent-42', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-43', 'user-parent-43', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-44', 'user-parent-44', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-45', 'user-parent-45', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-46', 'user-parent-46', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-47', 'user-parent-47', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-48', 'user-parent-48', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-49', 'user-parent-49', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('role-prn-50', 'user-parent-50', 'sch-sd-islam-01', 'parent', '2026-09-17T12:23:09.090Z')
ON CONFLICT DO NOTHING;

-- DATA: classes (3 rows)
INSERT INTO classes (id, school_id, teacher_id, name, grade_level, academic_year, status, created_at, updated_at)
VALUES
  ('class-4a', 'sch-sd-islam-01', 'user-teacher-andi', 'Kelas 4A', 'Kelas 4 SD', '2025/2026', 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z'),
  ('class-1a', 'sch-sd-islam-01', 'user-teacher-andi', 'Kelas 1A', 'Kelas 1 SD', '2025/2026', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z'),
  ('class-2a', 'sch-sd-islam-01', 'user-teacher-andi', 'Kelas 2A', 'Kelas 2 SD', '2025/2026', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z')
ON CONFLICT DO NOTHING;

-- DATA: children (57 rows)
INSERT INTO children (id, school_id, full_name, preferred_name, birth_date, grade_level, gender, status, created_at, updated_at, avatar_url)
VALUES
  ('child-ahmad', 'sch-sd-islam-01', 'Ahmad Fauzan', 'Ahmad', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z', NULL),
  ('child-aisyah', 'sch-sd-islam-01', 'Aisyah Putri', 'Aisyah', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z', NULL),
  ('child-zahra', 'sch-sd-islam-01', 'Zahra Nabila', 'Zahra', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z', NULL),
  ('child-rafi', 'sch-sd-islam-01', 'Rafi Bintang', 'Rafi', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z', NULL),
  ('child-naila', 'sch-sd-islam-01', 'Naila Azzahra', 'Naila', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z', NULL),
  ('child-dimas', 'sch-sd-islam-01', 'Dimas Maulana', 'Dimas', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z', NULL),
  ('child-8d4cb3e2', 'sch-sd-islam-01', 'Siti Aminah', 'Siti', NULL, 'Kelas 4 SD', NULL, 'active', '2026-09-17T06:37:23.786Z', '2026-09-17T06:37:23.786Z', NULL),
  ('child-01', 'sch-sd-islam-01', 'ABDUL GHANI ALVARIZY', 'Ghani', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-02', 'sch-sd-islam-01', 'ABIDAH DANIYA PUTRI PRAWIRA', 'Abidah', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-03', 'sch-sd-islam-01', 'Abidzar Adhi Tama', 'Abidzar', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-04', 'sch-sd-islam-01', 'Abizar Syahreza', 'Abizar', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-05', 'sch-sd-islam-01', 'Abujal', 'Abujal', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-06', 'sch-sd-islam-01', 'ADDREAAN AL HAFIDZ', 'Addrean', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-07', 'sch-sd-islam-01', 'ADEL NACITA PUTRI', 'Adel', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-08', 'sch-sd-islam-01', 'Adibah Uzma Azzahra', 'Adibah', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-09', 'sch-sd-islam-01', 'Adlan Ujay Pradifta', 'Adlan', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-10', 'sch-sd-islam-01', 'Adzriel Rafiq Syahputra', 'Adzriel', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-11', 'sch-sd-islam-01', 'AFIFAH RAMADANTI', 'Afifah', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-12', 'sch-sd-islam-01', 'AFIKA ANDINI MUTIA SARI', 'Afika', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-13', 'sch-sd-islam-01', 'Afkar Nurdiansyah Pradita H. M', 'Afkar', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-14', 'sch-sd-islam-01', 'Aghisna Khanza Ramadhan', 'Aghisna', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-15', 'sch-sd-islam-01', 'AHMAD ARFAN RAFFASYA', 'Arfan', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-16', 'sch-sd-islam-01', 'Ahmad Azkha Maula', 'Azkha', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-17', 'sch-sd-islam-01', 'AHMAD ZACKY', 'Zacky', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-18', 'sch-sd-islam-01', 'Aifin Ramadan', 'Aifin', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-19', 'sch-sd-islam-01', 'AIJAS FARSA MUZAKKY', 'Aijas', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-20', 'sch-sd-islam-01', 'Ainun Najwa Nur Asyifa', 'Ainun', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-21', 'sch-sd-islam-01', 'Aiqah Dinar Shofia', 'Aiqah', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-22', 'sch-sd-islam-01', 'AKILA ADINDA SUGIATI', 'Akila', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-23', 'sch-sd-islam-01', 'AKILA CORDELIA MONICA', 'Cordelia', NULL, 'Kelas 1 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-24', 'sch-sd-islam-01', 'AL FAEYZA REVINDRA RASYA', 'Faeyza', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-25', 'sch-sd-islam-01', 'Al Hasbi', 'Hasbi', NULL, 'Kelas 1 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-26', 'sch-sd-islam-01', 'Alby Lutfy Fachry', 'Alby', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-27', 'sch-sd-islam-01', 'Aldiyansyah', 'Aldi', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-28', 'sch-sd-islam-01', 'Alfa Putra Mahesa', 'Alfa', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-29', 'sch-sd-islam-01', 'Alfreda Aldan Avram', 'Alfreda', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-30', 'sch-sd-islam-01', 'Ali Tri Saputra', 'Ali', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-31', 'sch-sd-islam-01', 'ALIA AGUSTINA', 'Alia', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-32', 'sch-sd-islam-01', 'Alika Nayla Putri', 'Alika', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-33', 'sch-sd-islam-01', 'Alisa Uzma Acahya', 'Alisa', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-34', 'sch-sd-islam-01', 'ALISYA NAYLA ZARA', 'Alisya', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-35', 'sch-sd-islam-01', 'ALIYYAH NABILA AZAHRA', 'Aliyyah', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-36', 'sch-sd-islam-01', 'Alya Rahma Pratiwi', 'Alya', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-37', 'sch-sd-islam-01', 'ALYA TANSY ROZUA', 'Tansy', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-38', 'sch-sd-islam-01', 'Ananda Putri Calista', 'Calista', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-39', 'sch-sd-islam-01', 'Anisa Salwa Amalia', 'Anisa', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-40', 'sch-sd-islam-01', 'ANNISA DIAH AZKADINA', 'Azkadina', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-41', 'sch-sd-islam-01', 'ANNISA SEPTIANA', 'Septiana', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-42', 'sch-sd-islam-01', 'Aqila Fathiyyah Salma', 'Aqila', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-43', 'sch-sd-islam-01', 'Aqilla Rizkika Ayu', 'Rizkika', NULL, 'Kelas 2 SD', 'F', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-44', 'sch-sd-islam-01', 'Aqmar Nasyidah Alhanan', 'Aqmar', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-45', 'sch-sd-islam-01', 'Ardian Bintang Firdaus', 'Bintang', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-46', 'sch-sd-islam-01', 'Arfahia Rifid Alfatih', 'Rifid', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-47', 'sch-sd-islam-01', 'Arfan Athariz Mubarok', 'Athariz', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-48', 'sch-sd-islam-01', 'Arfan Rafisqi Kurniawan', 'Rafisqi', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-49', 'sch-sd-islam-01', 'ARIZAL GHIBRAN FADILLAH', 'Ghibran', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL),
  ('child-50', 'sch-sd-islam-01', 'ARJUNA', 'Arjuna', NULL, 'Kelas 2 SD', 'M', 'active', '2026-09-17T12:23:09.090Z', '2026-09-17T12:30:26.098Z', NULL)
ON CONFLICT DO NOTHING;

-- DATA: student_class_links (57 rows)
INSERT INTO student_class_links (id, child_id, class_id, status, created_at)
VALUES
  ('scl-child-ahmad', 'child-ahmad', 'class-4a', 'active', '2026-09-17T05:16:22.742Z'),
  ('scl-child-aisyah', 'child-aisyah', 'class-4a', 'active', '2026-09-17T05:16:22.742Z'),
  ('scl-child-zahra', 'child-zahra', 'class-4a', 'active', '2026-09-17T05:16:22.742Z'),
  ('scl-child-rafi', 'child-rafi', 'class-4a', 'active', '2026-09-17T05:16:22.742Z'),
  ('scl-child-naila', 'child-naila', 'class-4a', 'active', '2026-09-17T05:16:22.742Z'),
  ('scl-child-dimas', 'child-dimas', 'class-4a', 'active', '2026-09-17T05:16:22.742Z'),
  ('scl-3917d1b2', 'child-8d4cb3e2', 'class-4a', 'active', '2026-09-17T06:37:23.786Z'),
  ('scl-child-01', 'child-01', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-02', 'child-02', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-03', 'child-03', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-04', 'child-04', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-05', 'child-05', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-06', 'child-06', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-07', 'child-07', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-08', 'child-08', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-09', 'child-09', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-10', 'child-10', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-11', 'child-11', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-12', 'child-12', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-13', 'child-13', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-14', 'child-14', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-15', 'child-15', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-16', 'child-16', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-17', 'child-17', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-18', 'child-18', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-19', 'child-19', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-20', 'child-20', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-21', 'child-21', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-22', 'child-22', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-23', 'child-23', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-24', 'child-24', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-25', 'child-25', 'class-1a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-26', 'child-26', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-27', 'child-27', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-28', 'child-28', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-29', 'child-29', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-30', 'child-30', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-31', 'child-31', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-32', 'child-32', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-33', 'child-33', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-34', 'child-34', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-35', 'child-35', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-36', 'child-36', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-37', 'child-37', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-38', 'child-38', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-39', 'child-39', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-40', 'child-40', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-41', 'child-41', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-42', 'child-42', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-43', 'child-43', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-44', 'child-44', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-45', 'child-45', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-46', 'child-46', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-47', 'child-47', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-48', 'child-48', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-49', 'child-49', 'class-2a', 'active', '2026-09-17T12:23:09.090Z'),
  ('scl-child-50', 'child-50', 'class-2a', 'active', '2026-09-17T12:23:09.090Z')
ON CONFLICT DO NOTHING;

-- DATA: teacher_class_links (3 rows)
INSERT INTO teacher_class_links (id, teacher_user_id, class_id, is_homeroom, created_at)
VALUES
  ('tcl-1', 'user-teacher-andi', 'class-4a', 1, '2026-09-17T05:16:22.742Z'),
  ('tcl-class-1a', 'user-teacher-andi', 'class-1a', 1, '2026-09-17T12:23:09.090Z'),
  ('tcl-class-2a', 'user-teacher-andi', 'class-2a', 1, '2026-09-17T12:23:09.090Z')
ON CONFLICT DO NOTHING;

-- DATA: parent_child_links (52 rows)
INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
VALUES
  ('pcl-child-ahmad', 'user-parent-rina', 'child-ahmad', 'mother', '2026-09-17T05:16:22.742Z'),
  ('pcl-e9600ef6', 'user-prn-56ccf264', 'child-8d4cb3e2', 'parent', '2026-09-17T06:37:23.786Z'),
  ('pcl-child-01', 'user-parent-01', 'child-01', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-02', 'user-parent-02', 'child-02', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-03', 'user-parent-03', 'child-03', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-04', 'user-parent-04', 'child-04', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-05', 'user-parent-05', 'child-05', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-06', 'user-parent-06', 'child-06', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-07', 'user-parent-07', 'child-07', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-08', 'user-parent-08', 'child-08', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-09', 'user-parent-09', 'child-09', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-10', 'user-parent-10', 'child-10', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-11', 'user-parent-11', 'child-11', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-12', 'user-parent-12', 'child-12', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-13', 'user-parent-13', 'child-13', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-14', 'user-parent-14', 'child-14', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-15', 'user-parent-15', 'child-15', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-16', 'user-parent-16', 'child-16', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-17', 'user-parent-17', 'child-17', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-18', 'user-parent-18', 'child-18', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-19', 'user-parent-19', 'child-19', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-20', 'user-parent-20', 'child-20', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-21', 'user-parent-21', 'child-21', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-22', 'user-parent-22', 'child-22', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-23', 'user-parent-23', 'child-23', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-24', 'user-parent-24', 'child-24', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-25', 'user-parent-25', 'child-25', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-26', 'user-parent-26', 'child-26', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-27', 'user-parent-27', 'child-27', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-28', 'user-parent-28', 'child-28', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-29', 'user-parent-29', 'child-29', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-30', 'user-parent-30', 'child-30', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-31', 'user-parent-31', 'child-31', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-32', 'user-parent-32', 'child-32', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-33', 'user-parent-33', 'child-33', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-34', 'user-parent-34', 'child-34', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-35', 'user-parent-35', 'child-35', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-36', 'user-parent-36', 'child-36', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-37', 'user-parent-37', 'child-37', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-38', 'user-parent-38', 'child-38', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-39', 'user-parent-39', 'child-39', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-40', 'user-parent-40', 'child-40', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-41', 'user-parent-41', 'child-41', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-42', 'user-parent-42', 'child-42', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-43', 'user-parent-43', 'child-43', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-44', 'user-parent-44', 'child-44', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-45', 'user-parent-45', 'child-45', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-46', 'user-parent-46', 'child-46', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-47', 'user-parent-47', 'child-47', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-48', 'user-parent-48', 'child-48', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-49', 'user-parent-49', 'child-49', 'parent', '2026-09-17T12:23:09.090Z'),
  ('pcl-child-50', 'user-parent-50', 'child-50', 'parent', '2026-09-17T12:23:09.090Z')
ON CONFLICT DO NOTHING;

-- DATA: habit_templates (1 rows)
INSERT INTO habit_templates (id, school_id, name, description, is_default, created_at, updated_at)
VALUES
  ('tmpl-standar-sd', 'sch-sd-islam-01', 'Standar Ibadah & Kebiasaan Baik', 'Kurikulum pembiasaan dasar siswa SD', 1, '2026-09-17T05:16:22.742Z', '2026-09-17T05:16:22.742Z')
ON CONFLICT DO NOTHING;

-- DATA: habit_template_items (8 rows)
INSERT INTO habit_template_items (id, school_id, template_id, category, name, description, icon_key, sort_order, is_active, created_at, updated_at)
VALUES
  ('fajr', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_wajib', 'Shalat Subuh', NULL, 'Sun', 1, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('quran', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_harian', 'Membaca Al-Qur''an', NULL, 'BookOpen', 2, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('dhuhr', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_wajib', 'Shalat Dzuhur', NULL, 'Sun', 3, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('asr', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_wajib', 'Shalat Ashar', NULL, 'Sun', 4, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('maghrib', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_wajib', 'Shalat Maghrib', NULL, 'Moon', 5, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('isha', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_wajib', 'Shalat Isya', NULL, 'Moon', 6, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('kindness', 'sch-sd-islam-01', 'tmpl-standar-sd', 'kebiasaan_baik', 'Kebaikan Hari Ini', 'Membantu orang tua & sesama', 'Heart', 7, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z'),
  ('dua', 'sch-sd-islam-01', 'tmpl-standar-sd', 'ibadah_harian', 'Doa sebelum tidur', NULL, 'Star', 8, 1, '2026-09-17T05:16:22.742Z', '2026-09-17T12:30:26.098Z')
ON CONFLICT DO NOTHING;

