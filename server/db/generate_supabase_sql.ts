import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "..", "data", "sahabat_ibadah.db");
const outSqlPath = path.resolve(__dirname, "supabase_seed_50_students.sql");

if (!fs.existsSync(dbPath)) {
  console.error("Database SQLite tidak ditemukan di:", dbPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

console.log("Mengekspor data dari SQLite ke PostgreSQL Supabase...");

let sql = `-- =============================================================================\n`;
sql += `-- SAHABAT IBADAH — SKRIP SEED SUPABASE POSTGRESQL\n`;
sql += `-- Berisi 50 Siswa (Kelas 1A & 2A), 50 Akun Ortu, & Riwayat Ceklis (4 Ags - 17 Sept 2026)\n`;
sql += `-- Dijalankan di Supabase SQL Editor: Langsung Paste & Klik RUN\n`;
sql += `-- =============================================================================\n\n`;

// 1. DDL Tables for PostgreSQL (Supabase)
sql += `-- 1. SKEMA TABEL POSTGRESQL\n`;
sql += `
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

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin', 'superadmin')),
  created_at TEXT NOT NULL,
  UNIQUE(user_id, school_id, role)
);

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

CREATE TABLE IF NOT EXISTS student_class_links (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'moved')),
  created_at TEXT NOT NULL,
  UNIQUE(child_id, class_id)
);

CREATE TABLE IF NOT EXISTS teacher_class_links (
  id TEXT PRIMARY KEY,
  teacher_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_homeroom INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(teacher_user_id, class_id)
);

CREATE TABLE IF NOT EXISTS parent_child_links (
  id TEXT PRIMARY KEY,
  parent_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(parent_user_id, child_id)
);

CREATE TABLE IF NOT EXISTS habit_templates (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_template_items (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES habit_templates(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('ibadah_wajib', 'ibadah_harian', 'kebiasaan_baik')),
  name TEXT NOT NULL,
  description TEXT,
  icon_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checklist_entries (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  habit_id TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'not_completed', 'not_reported')),
  completed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(child_id, habit_id, entry_date)
);

CREATE TABLE IF NOT EXISTS checklist_notes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  note TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('parent', 'teacher')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(child_id, entry_date, author_role)
);

CREATE TABLE IF NOT EXISTS streak_snapshots (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(child_id)
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Tuntaskan Ibadah Harian',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data TEXT,
  after_data TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
\n`;

function escapeSqlVal(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function dumpTable(tableName: string, conflictTarget?: string) {
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
  if (rows.length === 0) return;

  sql += `-- DATA TABEL: ${tableName} (${rows.length} records)\n`;
  const cols = Object.keys(rows[0]);

  // Insert in batches of 100 to keep statements clean and within Postgres limits
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    sql += `INSERT INTO ${tableName} (${cols.join(", ")})\nVALUES\n`;
    const valuesList = chunk.map((r) => {
      const vals = cols.map((col) => escapeSqlVal((r as any)[col]));
      return `  (${vals.join(", ")})`;
    });
    sql += valuesList.join(",\n");
    if (conflictTarget) {
      sql += `\nON CONFLICT (${conflictTarget}) DO NOTHING;\n\n`;
    } else {
      sql += `\nON CONFLICT DO NOTHING;\n\n`;
    }
  }
}

dumpTable("schools", "id");
dumpTable("users", "id");
dumpTable("user_roles", "id");
dumpTable("classes", "id");
dumpTable("children", "id");
dumpTable("student_class_links", "id");
dumpTable("teacher_class_links", "id");
dumpTable("parent_child_links", "id");
dumpTable("habit_templates", "id");
dumpTable("habit_template_items", "id");
dumpTable("checklist_entries", "id");
dumpTable("points_ledger", "id");
dumpTable("streak_snapshots", "id");
dumpTable("checklist_notes", "id");

fs.writeFileSync(outSqlPath, sql, "utf-8");
console.log(`✅ Berhasil membuat file SQL Supabase di: ${outSqlPath}`);
console.log(`Ukuran file: ${(fs.statSync(outSqlPath).size / 1024).toFixed(1)} KB`);
