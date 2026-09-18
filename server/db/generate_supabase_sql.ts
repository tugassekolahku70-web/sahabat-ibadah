import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "..", "data", "sahabat_ibadah.db");
const schemaSqlPath = path.resolve(__dirname, "schema.sql");
const outSqlPath = path.resolve(__dirname, "supabase_seed_50_students.sql");
const partsDir = path.resolve(__dirname, "supabase_parts");

if (!fs.existsSync(dbPath)) {
  console.error("Database SQLite tidak ditemukan di:", dbPath);
  process.exit(1);
}

if (!fs.existsSync(partsDir)) {
  fs.mkdirSync(partsDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

console.log("Mengekspor data dari SQLite ke PostgreSQL Supabase...");

// Baca skema SQL resmi dan bersihkan PRAGMA SQLite
let rawSchema = fs.readFileSync(schemaSqlPath, "utf-8");
rawSchema = rawSchema.replace(/PRAGMA\s+foreign_keys\s*=\s*ON;/gi, "");

const ddlSchema = `-- =============================================================================
-- SAHABAT IBADAH — SKEMA TABEL POSTGRESQL (SUPABASE)
-- =============================================================================

-- 1. Bersihkan tabel lama jika ada agar struktur 50 siswa masuk bersih tanpa bentrok kunci unik
DROP TABLE IF EXISTS checklist_notes, streak_snapshots, points_ledger, child_badges, badges,
  checklist_entries, parent_child_links, teacher_class_links, student_class_links,
  children, habit_periods, habit_template_items, habit_templates, classes,
  email_verifications, user_roles, users, schools, audit_logs CASCADE;

${rawSchema}
`;

function escapeSqlVal(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function dumpTableRows(tableName: string, whereClause = "", conflictTarget = ""): string {
  const query = whereClause ? `SELECT * FROM ${tableName} WHERE ${whereClause}` : `SELECT * FROM ${tableName}`;
  const rows = db.prepare(query).all();
  if (rows.length === 0) return "";

  let res = `-- DATA: ${tableName} (${rows.length} rows)\n`;
  const cols = Object.keys(rows[0]);
  const batchSize = 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    res += `INSERT INTO ${tableName} (${cols.join(", ")})\nVALUES\n`;
    const vals = chunk.map((r) => `  (${cols.map((col) => escapeSqlVal((r as any)[col])).join(", ")})`);
    res += vals.join(",\n");
    if (conflictTarget) {
      res += `\nON CONFLICT (${conflictTarget}) DO NOTHING;\n\n`;
    } else {
      res += `\nON CONFLICT DO NOTHING;\n\n`;
    }
  }
  return res;
}

// 1. BAGIAN 1: Skema, Sekolah, Guru, 2 Kelas, 50 Siswa, 50 Akun Ortu (~50 KB)
let part1 = `-- =============================================================================\n`;
part1 += `-- BAGIAN 1 DARI 4: SKEMA, AKUN GURU, 2 KELAS, 50 SISWA & 50 AKUN ORANG TUA\n`;
part1 += `-- Ukuran sangat ringan (~50 KB) - Langsung Run di Supabase SQL Editor\n`;
part1 += `-- =============================================================================\n\n`;
part1 += ddlSchema;
part1 += dumpTableRows("schools");
part1 += dumpTableRows("users");
part1 += dumpTableRows("user_roles");
part1 += dumpTableRows("classes");
part1 += dumpTableRows("children");
part1 += dumpTableRows("student_class_links");
part1 += dumpTableRows("teacher_class_links");
part1 += dumpTableRows("parent_child_links");
part1 += dumpTableRows("habit_templates");
part1 += dumpTableRows("habit_template_items");
fs.writeFileSync(path.join(partsDir, "01_skema_dan_50_siswa.sql"), part1, "utf-8");

// 2. BAGIAN 2: Ceklis 4 Agustus - 17 Agustus 2026 (Minggu 1 & 2)
let part2 = `-- =============================================================================\n`;
part2 += `-- BAGIAN 2 DARI 4: RIWAYAT CEKLIS PEKAN 1 & 2 (4 AGUSTUS - 17 AGUSTUS 2026)\n`;
part2 += `-- =============================================================================\n\n`;
part2 += dumpTableRows("checklist_entries", "entry_date >= '2026-08-04' AND entry_date <= '2026-08-17'");
fs.writeFileSync(path.join(partsDir, "02_ceklis_pekan_1_dan_2.sql"), part2, "utf-8");

// 3. BAGIAN 3: Ceklis 18 Agustus - 31 Agustus 2026 (Minggu 3 & 4)
let part3 = `-- =============================================================================\n`;
part3 += `-- BAGIAN 3 DARI 4: RIWAYAT CEKLIS PEKAN 3 & 4 (18 AGUSTUS - 31 AGUSTUS 2026)\n`;
part3 += `-- =============================================================================\n\n`;
part3 += dumpTableRows("checklist_entries", "entry_date >= '2026-08-18' AND entry_date <= '2026-08-31'");
fs.writeFileSync(path.join(partsDir, "03_ceklis_pekan_3_dan_4.sql"), part3, "utf-8");

// 4. BAGIAN 4: Ceklis 1 September - 20 September 2026 (Minggu 5, 6, 7) + Poin + Streak + Catatan
let part4 = `-- =============================================================================\n`;
part4 += `-- BAGIAN 4 DARI 4: RIWAYAT CEKLIS PEKAN 5, 6, 7 (1 - 20 SEPTEMBER 2026) + POIN + STREAK\n`;
part4 += `-- =============================================================================\n\n`;
part4 += dumpTableRows("checklist_entries", "entry_date >= '2026-09-01'");
part4 += dumpTableRows("points_ledger");
part4 += dumpTableRows("streak_snapshots");
part4 += dumpTableRows("checklist_notes");
fs.writeFileSync(path.join(partsDir, "04_ceklis_pekan_5_6_7_dan_rekap.sql"), part4, "utf-8");

// Full SQL File (untuk terminal push langsung)
const fullSql = part1 + "\n" + part2 + "\n" + part3 + "\n" + part4;
fs.writeFileSync(outSqlPath, fullSql, "utf-8");

console.log("✅ Berhasil membuat file SQL lengkap di:", outSqlPath);
console.log("- Ukuran fullSql:", (fs.statSync(outSqlPath).size / 1024).toFixed(1), "KB");
