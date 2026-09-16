-- =============================================================================
-- SAHABAT IBADAH - POSTGRESQL SCHEMA & SEED DATA (SUPABASE)
-- Jalankan skrip ini sekali di Supabase SQL Editor (https://supabase.com/dashboard)
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

-- 5. Classes (Rombel / Kelas yang dikelola guru secara terisolasi)
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

-- 16. Points Ledger (Buku Besar Poin Kebaikan)
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
-- INDEKS PERFORMA
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

-- =============================================================================
-- DATA AWAL / SEED DATA (SD Islam Sahabat Ibadah & Demo Accounts)
-- Password untuk semua akun demo adalah: password123
-- =============================================================================

-- 1. Sekolah
INSERT INTO schools (id, name, code, timezone, status, created_at, updated_at)
VALUES ('sch-sd-islam-01', 'SD Islam Sahabat Ibadah', 'SIS-001', 'Asia/Jakarta', 'active', NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 2. Akun Demo (Pak Andi, Bunda Rina, Admin)
-- Hash password123: a1b2c3d4e5f60718293a4b5c6d7e8f90:bd2a0d77b0b3bb3fb91967ef947b311b65783ebacd8eaaa0b773bee021252e0c186602982b6ef9824ffdac2449f9d5f9bdc892479778e2d6c2c9e748927e4c12
INSERT INTO users (id, email, phone, password_hash, full_name, avatar_url, status, created_at, updated_at)
VALUES 
  ('user-teacher-andi', 'andi@sekolah.sch.id', '081234567890', 'a1b2c3d4e5f60718293a4b5c6d7e8f90:bd2a0d77b0b3bb3fb91967ef947b311b65783ebacd8eaaa0b773bee021252e0c186602982b6ef9824ffdac2449f9d5f9bdc892479778e2d6c2c9e748927e4c12', 'Pak Andi', null, 'active', NOW()::text, NOW()::text),
  ('user-parent-rina', 'rina@keluarga.id', '081298765432', 'a1b2c3d4e5f60718293a4b5c6d7e8f90:bd2a0d77b0b3bb3fb91967ef947b311b65783ebacd8eaaa0b773bee021252e0c186602982b6ef9824ffdac2449f9d5f9bdc892479778e2d6c2c9e748927e4c12', 'Bunda Rina', null, 'active', NOW()::text, NOW()::text),
  ('user-admin-sekolah', 'admin@sekolah.sch.id', '081111222333', 'a1b2c3d4e5f60718293a4b5c6d7e8f90:bd2a0d77b0b3bb3fb91967ef947b311b65783ebacd8eaaa0b773bee021252e0c186602982b6ef9824ffdac2449f9d5f9bdc892479778e2d6c2c9e748927e4c12', 'Admin Sekolah', null, 'active', NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- User Roles
INSERT INTO user_roles (id, user_id, school_id, role, created_at)
VALUES 
  ('role-teacher-1', 'user-teacher-andi', 'sch-sd-islam-01', 'teacher', NOW()::text),
  ('role-parent-1', 'user-parent-rina', 'sch-sd-islam-01', 'parent', NOW()::text),
  ('role-admin-1', 'user-admin-sekolah', 'sch-sd-islam-01', 'admin', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 3. Kelas 4A (Milik Pak Andi)
INSERT INTO classes (id, school_id, teacher_id, name, grade_level, academic_year, status, created_at, updated_at)
VALUES ('class-4a', 'sch-sd-islam-01', 'user-teacher-andi', 'Kelas 4A', 'Kelas 4 SD', '2025/2026', 'active', NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

INSERT INTO teacher_class_links (id, teacher_user_id, class_id, is_homeroom, created_at)
VALUES ('tcl-1', 'user-teacher-andi', 'class-4a', 1, NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 4. Siswa-siswi Kelas 4A
INSERT INTO children (id, school_id, full_name, preferred_name, grade_level, status, created_at, updated_at)
VALUES 
  ('child-ahmad', 'sch-sd-islam-01', 'Ahmad Fauzan', 'Ahmad', 'Kelas 4 SD', 'active', NOW()::text, NOW()::text),
  ('child-aisyah', 'sch-sd-islam-01', 'Aisyah Putri', 'Aisyah', 'Kelas 4 SD', 'active', NOW()::text, NOW()::text),
  ('child-zahra', 'sch-sd-islam-01', 'Zahra Nabila', 'Zahra', 'Kelas 4 SD', 'active', NOW()::text, NOW()::text),
  ('child-rafi', 'sch-sd-islam-01', 'Rafi Bintang', 'Rafi', 'Kelas 4 SD', 'active', NOW()::text, NOW()::text),
  ('child-naila', 'sch-sd-islam-01', 'Naila Azzahra', 'Naila', 'Kelas 4 SD', 'active', NOW()::text, NOW()::text),
  ('child-dimas', 'sch-sd-islam-01', 'Dimas Maulana', 'Dimas', 'Kelas 4 SD', 'active', NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- Hubungkan Siswa ke Kelas 4A
INSERT INTO student_class_links (id, child_id, class_id, status, created_at)
VALUES 
  ('scl-ahmad', 'child-ahmad', 'class-4a', 'active', NOW()::text),
  ('scl-aisyah', 'child-aisyah', 'class-4a', 'active', NOW()::text),
  ('scl-zahra', 'child-zahra', 'class-4a', 'active', NOW()::text),
  ('scl-rafi', 'child-rafi', 'class-4a', 'active', NOW()::text),
  ('scl-naila', 'child-naila', 'class-4a', 'active', NOW()::text),
  ('scl-dimas', 'child-dimas', 'class-4a', 'active', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- Hubungkan Bunda Rina ke Ahmad Fauzan
INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
VALUES ('pcl-rina-ahmad', 'user-parent-rina', 'child-ahmad', 'Ibu Kandung', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 5. Template Kebiasaan Ibadah
INSERT INTO habit_templates (id, school_id, name, description, is_default, created_at, updated_at)
VALUES ('tmpl-sd-01', 'sch-sd-islam-01', 'Standar Ibadah SD Islam', 'Kurikulum pembiasaan ibadah harian peserta didik', 1, NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 8 Butir Kebiasaan Standar
INSERT INTO habit_template_items (id, school_id, template_id, category, name, description, icon_key, sort_order, is_active, created_at, updated_at)
VALUES 
  ('hi-fajr', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_wajib', 'Shalat Subuh', 'Tepat waktu berjamaah atau di rumah', 'Sun', 1, 1, NOW()::text, NOW()::text),
  ('hi-quran', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_harian', 'Membaca Al-Qur''an', 'Minimal 1 lembar / tadarus harian', 'BookOpen', 2, 1, NOW()::text, NOW()::text),
  ('hi-dhuhr', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_wajib', 'Shalat Dzuhur', 'Berjamaah di sekolah / tepat waktu', 'Sun', 3, 1, NOW()::text, NOW()::text),
  ('hi-asr', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_wajib', 'Shalat Ashar', 'Tepat waktu sebelum petang', 'Sun', 4, 1, NOW()::text, NOW()::text),
  ('hi-maghrib', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_wajib', 'Shalat Maghrib', 'Berjamaah di masjid / rumah', 'Moon', 5, 1, NOW()::text, NOW()::text),
  ('hi-isha', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_wajib', 'Shalat Isya', 'Tepat waktu sebelum istirahat', 'Moon', 6, 1, NOW()::text, NOW()::text),
  ('hi-kindness', 'sch-sd-islam-01', 'tmpl-sd-01', 'kebiasaan_baik', 'Kebaikan Hari Ini', 'Membantu orang tua, sedekah, atau berbuat ramah', 'Heart', 7, 1, NOW()::text, NOW()::text),
  ('hi-dua', 'sch-sd-islam-01', 'tmpl-sd-01', 'ibadah_harian', 'Doa sebelum tidur', 'Membaca doa & ayat kursi', 'Star', 8, 1, NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 6. Lencana / Badges
INSERT INTO badges (id, name, description, icon_key, criteria_key, created_at)
VALUES 
  ('badge-7days', '7 Hari Istiqomah', 'Menuntaskan seluruh checklist selama 7 hari berturut-turut', 'Flame', 'streak_7', NOW()::text),
  ('badge-subuh', 'Penjaga Subuh', 'Selalu shalat subuh tepat waktu', 'Sun', 'subuh_master', NOW()::text),
  ('badge-quran', 'Sahabat Al-Qur''an', 'Membaca Al-Qur''an secara konsisten', 'BookOpen', 'quran_consistent', NOW()::text),
  ('badge-kebaikan', 'Penebar Kebaikan', 'Mencatat amal kebaikan lebih dari 10 kali', 'Award', 'kindness_champion', NOW()::text)
ON CONFLICT (id) DO NOTHING;

INSERT INTO child_badges (id, child_id, badge_id, earned_at)
VALUES ('cb-1', 'child-ahmad', 'badge-7days', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 7. Snapshot Streak & Poin untuk Ahmad
INSERT INTO streak_snapshots (id, child_id, current_streak, longest_streak, last_calculated_date, updated_at)
VALUES ('streak-ahmad', 'child-ahmad', 7, 12, CURRENT_DATE::text, NOW()::text)
ON CONFLICT (child_id) DO UPDATE SET current_streak = EXCLUDED.current_streak, longest_streak = EXCLUDED.longest_streak;

INSERT INTO points_ledger (id, school_id, child_id, points, reason, source_type, created_at)
VALUES 
  ('pt-1', 'sch-sd-islam-01', 'child-ahmad', 100, 'Checklist rutin 7 hari berturut-turut', 'streak', NOW()::text),
  ('pt-2', 'sch-sd-islam-01', 'child-ahmad', 80, 'Kebaikan harian beruntun', 'kindness', NOW()::text),
  ('pt-3', 'sch-sd-islam-01', 'child-ahmad', 68, 'Aktivitas ibadah wajib selesai tepat waktu', 'checklist', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- 8. Thread & Pesan Guru - Orang Tua
INSERT INTO message_threads (id, school_id, child_id, created_by, status, created_at, updated_at)
VALUES ('thread-ahmad', 'sch-sd-islam-01', 'child-ahmad', 'user-teacher-andi', 'open', NOW()::text, NOW()::text)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, thread_id, sender_id, body, sent_at)
VALUES 
  ('msg-1', 'thread-ahmad', 'user-teacher-andi', 'Assalamu''alaikum Bunda Rina, Ahmad menunjukkan kemajuan luar biasa dalam shalat berjamaah dan tadarus.', NOW()::text),
  ('msg-2', 'thread-ahmad', 'user-parent-rina', 'Wa''alaikumsalam Pak Andi, alhamdulillah kami sangat senang mendengarnya. Terima kasih atas bimbingannya di sekolah.', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- Selesai!
