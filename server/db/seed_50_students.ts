import { db, hashPassword, initSchema, nowISO } from "./index.js";
import fs from "fs";
import path from "path";

export const studentList50 = [
  // ==========================================
  // KELAS 1A (Siswa 1 s/d 25)
  // ==========================================
  { id: "child-01", name: "ABDUL GHANI ALVARIZY", preferred: "Ghani", gender: "M", classId: "class-1a", parentEmail: "ortu.ghani@keluarga.id", parentName: "Bapak Hendra Alvarizy", diligence: 0.88 },
  { id: "child-02", name: "ABIDAH DANIYA PUTRI PRAWIRA", preferred: "Abidah", gender: "F", classId: "class-1a", parentEmail: "ortu.abidah@keluarga.id", parentName: "Ibu Daniya Prawira", diligence: 0.92 },
  { id: "child-03", name: "Abidzar Adhi Tama", preferred: "Abidzar", gender: "M", classId: "class-1a", parentEmail: "ortu.abidzar@keluarga.id", parentName: "Bapak Adhi Tama", diligence: 0.78 },
  { id: "child-04", name: "Abizar Syahreza", preferred: "Abizar", gender: "M", classId: "class-1a", parentEmail: "ortu.abizar@keluarga.id", parentName: "Bapak Syahreza", diligence: 0.74 },
  { id: "child-05", name: "Abujal", preferred: "Abujal", gender: "M", classId: "class-1a", parentEmail: "ortu.abujal@keluarga.id", parentName: "Bapak Mansur", diligence: 0.65 },
  { id: "child-06", name: "ADDREAAN AL HAFIDZ", preferred: "Addrean", gender: "M", classId: "class-1a", parentEmail: "ortu.addrean@keluarga.id", parentName: "Bapak Hafidz", diligence: 0.84 },
  { id: "child-07", name: "ADEL NACITA PUTRI", preferred: "Adel", gender: "F", classId: "class-1a", parentEmail: "ortu.adel@keluarga.id", parentName: "Ibu Nacita", diligence: 0.82 },
  { id: "child-08", name: "Adibah Uzma Azzahra", preferred: "Adibah", gender: "F", classId: "class-1a", parentEmail: "ortu.adibah.uzma@keluarga.id", parentName: "Ibu Zahra", diligence: 0.90 },
  { id: "child-09", name: "Adlan Ujay Pradifta", preferred: "Adlan", gender: "M", classId: "class-1a", parentEmail: "ortu.adlan@keluarga.id", parentName: "Bapak Ujay Pradifta", diligence: 0.72 },
  { id: "child-10", name: "Adzriel Rafiq Syahputra", preferred: "Adzriel", gender: "M", classId: "class-1a", parentEmail: "ortu.adzriel@keluarga.id", parentName: "Bapak Rafiq Syahputra", diligence: 0.86 },
  { id: "child-11", name: "AFIFAH RAMADANTI", preferred: "Afifah", gender: "F", classId: "class-1a", parentEmail: "ortu.afifah@keluarga.id", parentName: "Ibu Ramadanti", diligence: 0.89 },
  { id: "child-12", name: "AFIKA ANDINI MUTIA SARI", preferred: "Afika", gender: "F", classId: "class-1a", parentEmail: "ortu.afika@keluarga.id", parentName: "Ibu Mutia Sari", diligence: 0.85 },
  { id: "child-13", name: "Afkar Nurdiansyah Pradita H. M", preferred: "Afkar", gender: "M", classId: "class-1a", parentEmail: "ortu.afkar@keluarga.id", parentName: "Bapak Nurdiansyah", diligence: 0.68 },
  { id: "child-14", name: "Aghisna Khanza Ramadhan", preferred: "Aghisna", gender: "F", classId: "class-1a", parentEmail: "ortu.aghisna@keluarga.id", parentName: "Bapak Ramadhan", diligence: 0.80 },
  { id: "child-15", name: "AHMAD ARFAN RAFFASYA", preferred: "Arfan", gender: "M", classId: "class-1a", parentEmail: "ortu.arfan.raffasya@keluarga.id", parentName: "Bapak Raffasya", diligence: 0.87 },
  { id: "child-16", name: "Ahmad Azkha Maula", preferred: "Azkha", gender: "M", classId: "class-1a", parentEmail: "ortu.azkha@keluarga.id", parentName: "Bapak Maula", diligence: 0.79 },
  { id: "child-17", name: "AHMAD ZACKY", preferred: "Zacky", gender: "M", classId: "class-1a", parentEmail: "ortu.zacky@keluarga.id", parentName: "Bapak Ridwan", diligence: 0.76 },
  { id: "child-18", name: "Aifin Ramadan", preferred: "Aifin", gender: "M", classId: "class-1a", parentEmail: "ortu.aifin@keluarga.id", parentName: "Bapak Ramadan", diligence: 0.73 },
  { id: "child-19", name: "AIJAS FARSA MUZAKKY", preferred: "Aijas", gender: "M", classId: "class-1a", parentEmail: "ortu.aijas@keluarga.id", parentName: "Bapak Farsa Muzakky", diligence: 0.83 },
  { id: "child-20", name: "Ainun Najwa Nur Asyifa", preferred: "Ainun", gender: "F", classId: "class-1a", parentEmail: "ortu.ainun@keluarga.id", parentName: "Ibu Asyifa", diligence: 0.91 },
  { id: "child-21", name: "Aiqah Dinar Shofia", preferred: "Aiqah", gender: "F", classId: "class-1a", parentEmail: "ortu.aiqah@keluarga.id", parentName: "Ibu Shofia", diligence: 0.88 },
  { id: "child-22", name: "AKILA ADINDA SUGIATI", preferred: "Akila", gender: "F", classId: "class-1a", parentEmail: "ortu.akila.sugiati@keluarga.id", parentName: "Ibu Sugiati", diligence: 0.75 },
  { id: "child-23", name: "AKILA CORDELIA MONICA", preferred: "Cordelia", gender: "F", classId: "class-1a", parentEmail: "ortu.akila.monica@keluarga.id", parentName: "Ibu Monica", diligence: 0.84 },
  { id: "child-24", name: "AL FAEYZA REVINDRA RASYA", preferred: "Faeyza", gender: "M", classId: "class-1a", parentEmail: "ortu.faeyza@keluarga.id", parentName: "Bapak Revindra Rasya", diligence: 0.77 },
  { id: "child-25", name: "Al Hasbi", preferred: "Hasbi", gender: "M", classId: "class-1a", parentEmail: "ortu.hasbi@keluarga.id", parentName: "Bapak Hasbi", diligence: 0.71 },

  // ==========================================
  // KELAS 2A (Siswa 26 s/d 50)
  // ==========================================
  { id: "child-26", name: "Alby Lutfy Fachry", preferred: "Alby", gender: "M", classId: "class-2a", parentEmail: "ortu.alby@keluarga.id", parentName: "Bapak Fachry", diligence: 0.81 },
  { id: "child-27", name: "Aldiyansyah", preferred: "Aldi", gender: "M", classId: "class-2a", parentEmail: "ortu.aldi@keluarga.id", parentName: "Bapak Yansyah", diligence: 0.73 },
  { id: "child-28", name: "Alfa Putra Mahesa", preferred: "Alfa", gender: "M", classId: "class-2a", parentEmail: "ortu.alfa@keluarga.id", parentName: "Bapak Mahesa", diligence: 0.76 },
  { id: "child-29", name: "Alfreda Aldan Avram", preferred: "Alfreda", gender: "M", classId: "class-2a", parentEmail: "ortu.alfreda@keluarga.id", parentName: "Bapak Avram", diligence: 0.85 },
  { id: "child-30", name: "Ali Tri Saputra", preferred: "Ali", gender: "M", classId: "class-2a", parentEmail: "ortu.ali@keluarga.id", parentName: "Bapak Saputra", diligence: 0.79 },
  { id: "child-31", name: "ALIA AGUSTINA", preferred: "Alia", gender: "F", classId: "class-2a", parentEmail: "ortu.alia@keluarga.id", parentName: "Ibu Agustina", diligence: 0.90 },
  { id: "child-32", name: "Alika Nayla Putri", preferred: "Alika", gender: "F", classId: "class-2a", parentEmail: "ortu.alika@keluarga.id", parentName: "Ibu Nayla Putri", diligence: 0.87 },
  { id: "child-33", name: "Alisa Uzma Acahya", preferred: "Alisa", gender: "F", classId: "class-2a", parentEmail: "ortu.alisa@keluarga.id", parentName: "Ibu Acahya", diligence: 0.86 },
  { id: "child-34", name: "ALISYA NAYLA ZARA", preferred: "Alisya", gender: "F", classId: "class-2a", parentEmail: "ortu.alisya@keluarga.id", parentName: "Ibu Zara", diligence: 0.93 },
  { id: "child-35", name: "ALIYYAH NABILA AZAHRA", preferred: "Aliyyah", gender: "F", classId: "class-2a", parentEmail: "ortu.aliyyah@keluarga.id", parentName: "Ibu Azahra", diligence: 0.89 },
  { id: "child-36", name: "Alya Rahma Pratiwi", preferred: "Alya", gender: "F", classId: "class-2a", parentEmail: "ortu.alya.rahma@keluarga.id", parentName: "Ibu Pratiwi", diligence: 0.83 },
  { id: "child-37", name: "ALYA TANSY ROZUA", preferred: "Tansy", gender: "F", classId: "class-2a", parentEmail: "ortu.alya.tansy@keluarga.id", parentName: "Ibu Rozua", diligence: 0.84 },
  { id: "child-38", name: "Ananda Putri Calista", preferred: "Calista", gender: "F", classId: "class-2a", parentEmail: "ortu.calista@keluarga.id", parentName: "Ibu Calista", diligence: 0.82 },
  { id: "child-39", name: "Anisa Salwa Amalia", preferred: "Anisa", gender: "F", classId: "class-2a", parentEmail: "ortu.anisa@keluarga.id", parentName: "Ibu Amalia", diligence: 0.88 },
  { id: "child-40", name: "ANNISA DIAH AZKADINA", preferred: "Azkadina", gender: "F", classId: "class-2a", parentEmail: "ortu.annisa.diah@keluarga.id", parentName: "Ibu Diah Azkadina", diligence: 0.91 },
  { id: "child-41", name: "ANNISA SEPTIANA", preferred: "Septiana", gender: "F", classId: "class-2a", parentEmail: "ortu.annisa.septiana@keluarga.id", parentName: "Ibu Septiana", diligence: 0.77 },
  { id: "child-42", name: "Aqila Fathiyyah Salma", preferred: "Aqila", gender: "F", classId: "class-2a", parentEmail: "ortu.aqila.salma@keluarga.id", parentName: "Ibu Salma", diligence: 0.86 },
  { id: "child-43", name: "Aqilla Rizkika Ayu", preferred: "Rizkika", gender: "F", classId: "class-2a", parentEmail: "ortu.aqilla.rizkika@keluarga.id", parentName: "Ibu Ayu", diligence: 0.80 },
  { id: "child-44", name: "Aqmar Nasyidah Alhanan", preferred: "Aqmar", gender: "M", classId: "class-2a", parentEmail: "ortu.aqmar@keluarga.id", parentName: "Bapak Alhanan", diligence: 0.75 },
  { id: "child-45", name: "Ardian Bintang Firdaus", preferred: "Bintang", gender: "M", classId: "class-2a", parentEmail: "ortu.bintang@keluarga.id", parentName: "Bapak Firdaus", diligence: 0.74 },
  { id: "child-46", name: "Arfahia Rifid Alfatih", preferred: "Rifid", gender: "M", classId: "class-2a", parentEmail: "ortu.rifid@keluarga.id", parentName: "Bapak Alfatih", diligence: 0.78 },
  { id: "child-47", name: "Arfan Athariz Mubarok", preferred: "Athariz", gender: "M", classId: "class-2a", parentEmail: "ortu.athariz@keluarga.id", parentName: "Bapak Mubarok", diligence: 0.85 },
  { id: "child-48", name: "Arfan Rafisqi Kurniawan", preferred: "Rafisqi", gender: "M", classId: "class-2a", parentEmail: "ortu.rafisqi@keluarga.id", parentName: "Bapak Kurniawan", diligence: 0.81 },
  { id: "child-49", name: "ARIZAL GHIBRAN FADILLAH", preferred: "Ghibran", gender: "M", classId: "class-2a", parentEmail: "ortu.ghibran@keluarga.id", parentName: "Bapak Fadillah", diligence: 0.72 },
  { id: "child-50", name: "ARJUNA", preferred: "Arjuna", gender: "M", classId: "class-2a", parentEmail: "ortu.arjuna@keluarga.id", parentName: "Bapak Pandu", diligence: 0.70 },
];

/**
 * Mendapatkan target persentase rata-rata sesuai ketentuan periode rekap pengguna:
 * Minggu 1 (4–8 Agustus)	  : 58%
 * Minggu 2 (11–15 Agustus)	: 64%
 * Minggu 3 (18–22 Agustus)	: 71%
 * Minggu 4 (25–29 Agustus)	: 77%
 * Minggu 5 (1–5 September)	: 82%
 * Minggu 6 (8–12 September)	: 86%
 * Minggu 7 (14–18 September)	: 89%
 */
export function getWeeklyTargetRate(dateStr: string): number {
  if (dateStr <= "2026-08-10") return 0.58;
  if (dateStr <= "2026-08-17") return 0.64;
  if (dateStr <= "2026-08-24") return 0.71;
  if (dateStr <= "2026-08-31") return 0.77;
  if (dateStr <= "2026-09-07") return 0.82;
  if (dateStr <= "2026-09-13") return 0.86;
  return 0.89; // 14-18 September
}

// Pseudo-random konsisten berdasar seed string
function pseudoRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

export function seed50Students() {
  console.log("🌟 Memulai Seeding 50 Siswa, 50 Akun Orang Tua & Histori Checklist (4 Ags - 17 Sept 2026)...");
  initSchema();

  if (!db) {
    console.log("Database SQLite lokal tidak aktif.");
    return;
  }
  const sqlite = db;
  const now = nowISO();

  // 1. Sekolah & Akun Guru
  const schoolId = "sch-sd-islam-01";
  sqlite.prepare(`
    INSERT INTO schools (id, name, code, timezone, status, created_at, updated_at)
    VALUES (?, 'SDN 3 Sumur Putri', 'SDN3-SMP', 'Asia/Jakarta', 'active', ?, ?)
    ON CONFLICT (id) DO UPDATE SET name = 'SDN 3 Sumur Putri', updated_at = ?
  `).run(schoolId, now, now, now);

  const teacherId = "user-teacher-andi";
  const defaultPass = hashPassword("password123");

  sqlite.prepare(`
    INSERT INTO users (id, email, phone, password_hash, full_name, status, created_at, updated_at)
    VALUES (?, 'andi@sekolah.sch.id', '081234567890', ?, 'Pak Andi', 'active', ?, ?)
    ON CONFLICT (id) DO UPDATE SET email = 'andi@sekolah.sch.id', full_name = 'Pak Andi', updated_at = ?
  `).run(teacherId, defaultPass, now, now, now);

  sqlite.prepare(`
    INSERT INTO user_roles (id, user_id, school_id, role, created_at)
    VALUES ('role-teacher-1', ?, ?, 'teacher', ?)
    ON CONFLICT DO NOTHING
  `).run(teacherId, schoolId, now);

  // 2. Kelas: Kelas 1A dan Kelas 2A
  const classesToSeed = [
    { id: "class-1a", name: "Kelas 1A", grade: "Kelas 1 SD" },
    { id: "class-2a", name: "Kelas 2A", grade: "Kelas 2 SD" },
  ];

  for (const c of classesToSeed) {
    sqlite.prepare(`
      INSERT INTO classes (id, school_id, teacher_id, name, grade_level, academic_year, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, '2025/2026', 'active', ?, ?)
      ON CONFLICT (id) DO UPDATE SET name = excluded.name, grade_level = excluded.grade_level, updated_at = ?
    `).run(c.id, schoolId, teacherId, c.name, c.grade, now, now, now);

    sqlite.prepare(`
      INSERT INTO teacher_class_links (id, teacher_user_id, class_id, is_homeroom, created_at)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT DO NOTHING
    `).run(`tcl-${c.id}`, teacherId, c.id, now);
  }

  // 3. Template & Item Kebiasaan Ibadah
  const templateId = "tmpl-standar-sd";
  sqlite.prepare(`
    INSERT INTO habit_templates (id, school_id, name, description, is_default, created_at, updated_at)
    VALUES (?, ?, 'Standar Ibadah & Kebiasaan Baik', 'Kurikulum pembiasaan dasar siswa SD', 1, ?, ?)
    ON CONFLICT (id) DO NOTHING
  `).run(templateId, schoolId, now, now);

  const habitItems = [
    { id: "fajr", category: "ibadah_wajib", name: "Shalat Subuh", icon: "Sun", color: "amber", sort: 1, weight: 1.05 },
    { id: "quran", category: "ibadah_harian", name: "Membaca Al-Qur'an", icon: "BookOpen", color: "emerald", sort: 2, weight: 0.90 },
    { id: "dhuhr", category: "ibadah_wajib", name: "Shalat Dzuhur", icon: "Sun", color: "orange", sort: 3, weight: 1.20 },
    { id: "asr", category: "ibadah_wajib", name: "Shalat Ashar", icon: "Sun", color: "sky", sort: 4, weight: 1.00 },
    { id: "maghrib", category: "ibadah_wajib", name: "Shalat Maghrib", icon: "Moon", color: "violet", sort: 5, weight: 1.15 },
    { id: "isha", category: "ibadah_wajib", name: "Shalat Isya", icon: "Moon", color: "indigo", sort: 6, weight: 0.95 },
    { id: "kindness", category: "kebiasaan_baik", name: "Kebaikan Hari Ini", icon: "Heart", color: "rose", sort: 7, weight: 0.85, desc: "Membantu orang tua & sesama" },
    { id: "dua", category: "ibadah_harian", name: "Doa sebelum tidur", icon: "Star", color: "teal", sort: 8, weight: 0.80 },
  ];

  const insertHabitStmt = sqlite.prepare(`
    INSERT INTO habit_template_items (id, school_id, template_id, category, name, description, icon_key, sort_order, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT (id) DO UPDATE SET name = excluded.name, sort_order = excluded.sort_order, updated_at = ?
  `);

  for (const h of habitItems) {
    insertHabitStmt.run(h.id, schoolId, templateId, h.category, h.name, h.desc || null, h.icon, h.sort, now, now, now);
  }

  // 4. Daftarkan 50 Siswa & 50 Akun Orang Tua
  const insertUserStmt = sqlite.prepare(`
    INSERT INTO users (id, email, phone, password_hash, full_name, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT (id) DO UPDATE SET email = excluded.email, full_name = excluded.full_name, updated_at = ?
  `);

  const insertRoleStmt = sqlite.prepare(`
    INSERT INTO user_roles (id, user_id, school_id, role, created_at)
    VALUES (?, ?, ?, 'parent', ?)
    ON CONFLICT DO NOTHING
  `);

  const insertChildStmt = sqlite.prepare(`
    INSERT INTO children (id, school_id, full_name, preferred_name, grade_level, gender, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT (id) DO UPDATE SET full_name = excluded.full_name, preferred_name = excluded.preferred_name, updated_at = ?
  `);

  const insertStudentClassStmt = sqlite.prepare(`
    INSERT INTO student_class_links (id, child_id, class_id, status, created_at)
    VALUES (?, ?, ?, 'active', ?)
    ON CONFLICT (child_id, class_id) DO NOTHING
  `);

  const insertParentChildStmt = sqlite.prepare(`
    INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
    VALUES (?, ?, ?, 'parent', ?)
    ON CONFLICT (parent_user_id, child_id) DO NOTHING
  `);

  for (let i = 0; i < studentList50.length; i++) {
    const s = studentList50[i];
    const parentId = `user-parent-${s.id.replace("child-", "")}`;
    const gradeLevel = s.classId === "class-1a" ? "Kelas 1 SD" : "Kelas 2 SD";
    const phone = `0812${String(10000000 + i + 1).slice(1)}`;

    // User Parent
    insertUserStmt.run(parentId, s.parentEmail, phone, defaultPass, s.parentName, now, now, now);
    insertRoleStmt.run(`role-prn-${s.id.replace("child-", "")}`, parentId, schoolId, now);

    // Child
    insertChildStmt.run(s.id, schoolId, s.name, s.preferred, gradeLevel, s.gender, now, now, now);
    insertStudentClassStmt.run(`scl-${s.id}`, s.id, s.classId, now);
    insertParentChildStmt.run(`pcl-${s.id}`, parentId, s.id, now);
  }

  console.log("✅ 50 Siswa (25 di Kelas 1A & 25 di Kelas 2A) beserta 50 Akun Orang Tua berhasil didaftarkan!");

  // 5. Generate Histori Checklist dari 4 Agustus 2026 s/d 20 September 2026 (Pekan 1 s/d 7 penuh)
  const startDate = new Date("2026-08-04T00:00:00Z");
  const endDate = new Date("2026-09-20T00:00:00Z");
  const dates: string[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  console.log(`📅 Mengisi checklist untuk ${dates.length} hari (${dates[0]} s/d ${dates[dates.length - 1]})...`);

  // Hapus entri lama untuk 50 siswa agar data bersih dan persis sesuai formula rekap
  sqlite.exec(`DELETE FROM checklist_entries WHERE child_id LIKE 'child-%';`);
  sqlite.exec(`DELETE FROM checklist_notes WHERE child_id LIKE 'child-%';`);
  sqlite.exec(`DELETE FROM points_ledger WHERE child_id LIKE 'child-%';`);
  sqlite.exec(`DELETE FROM streak_snapshots WHERE child_id LIKE 'child-%';`);

  const insertChecklistStmt = sqlite.prepare(`
    INSERT INTO checklist_entries (id, school_id, child_id, habit_item_id, entry_date, status, reported_by, reported_at, source, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'parent', 1, ?, ?)
  `);

  const insertPointStmt = sqlite.prepare(`
    INSERT INTO points_ledger (id, school_id, child_id, points, reason, source_type, created_at)
    VALUES (?, ?, ?, ?, 'Checklist Ibadah Harian', 'checklist', ?)
  `);

  const insertStreakStmt = sqlite.prepare(`
    INSERT INTO streak_snapshots (id, child_id, current_streak, longest_streak, last_calculated_date, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (child_id) DO UPDATE SET current_streak = excluded.current_streak, longest_streak = excluded.longest_streak, updated_at = excluded.updated_at
  `);

  const studentCompletedCounts = new Map<string, number>();
  studentList50.forEach((s) => studentCompletedCounts.set(s.id, 0));

  // Pisahkan siswa per kelas
  const studentsClass1 = studentList50.filter((s) => s.classId === "class-1a");
  const studentsClass2 = studentList50.filter((s) => s.classId === "class-2a");

  // Siapkan transaksi cepat
  sqlite.exec("BEGIN TRANSACTION;");

  for (const dateStr of dates) {
    const targetRate = getWeeklyTargetRate(dateStr);
    const dateTimestamp = `${dateStr}T19:30:00.000Z`;

    // Proses untuk setiap kelas (25 siswa * 8 kebiasaan = 200 total entri per kelas)
    for (const classStudents of [studentsClass1, studentsClass2]) {
      const totalPossible = classStudents.length * habitItems.length; // 200
      const targetCompletedCount = Math.round(totalPossible * targetRate);

      // Hitung skor untuk setiap kombinasi (siswa, kebiasaan)
      const pairs: Array<{
        student: (typeof studentList50)[0];
        habit: (typeof habitItems)[0];
        score: number;
      }> = [];

      for (const s of classStudents) {
        for (const h of habitItems) {
          const rand = pseudoRandom(`${dateStr}-${s.id}-${h.id}`);
          const score = s.diligence * h.weight * 1.5 + rand;
          pairs.push({ student: s, habit: h, score });
        }
      }

      // Urutkan berdasarkan skor tertinggi
      pairs.sort((a, b) => b.score - a.score);

      // Tandai sejumlah targetCompletedCount teratas sebagai 'completed'
      for (let idx = 0; idx < pairs.length; idx++) {
        const { student, habit } = pairs[idx];
        const isCompleted = idx < targetCompletedCount;
        let status: "completed" | "not_completed" | "not_reported";

        if (isCompleted) {
          status = "completed";
          studentCompletedCounts.set(student.id, (studentCompletedCounts.get(student.id) || 0) + 1);
        } else {
          // 85% tidak terlaksana, 15% belum dilaporkan
          const randUnreported = pseudoRandom(`unrep-${dateStr}-${student.id}-${habit.id}`);
          status = randUnreported < 0.15 ? "not_reported" : "not_completed";
        }

        const parentId = `user-parent-${student.id.replace("child-", "")}`;

        insertChecklistStmt.run(
          `chk-${dateStr}-${habit.id}-${student.id}`,
          schoolId,
          student.id,
          habit.id,
          dateStr,
          status,
          parentId,
          dateTimestamp,
          dateTimestamp,
          dateTimestamp
        );
      }
    }
  }

  // Rekap Poin & Streak untuk masing-masing siswa
  for (const s of studentList50) {
    const completed = studentCompletedCounts.get(s.id) || 0;
    const points = completed * 10;
    insertPointStmt.run(`pt-${s.id}`, schoolId, s.id, points, now);

    // Hitung streak realistis
    const currentStreak = Math.min(28, Math.max(7, Math.round(s.diligence * 22)));
    const longestStreak = currentStreak + Math.round(s.diligence * 8);

    insertStreakStmt.run(`strk-${s.id}`, s.id, currentStreak, longestStreak, "2026-09-17", now);
  }

  // Tambahkan beberapa catatan wali murid dan apresiasi guru pada hari ini & pekan terakhir
  const sampleNotes = [
    { studentId: "child-01", date: "2026-09-17", role: "parent", text: "Alhamdulillah ananda Ghani shalat Subuh tepat waktu berjamaah di masjid bersama Ayah." },
    { studentId: "child-02", date: "2026-09-17", role: "parent", text: "Abidah hari ini tilawah juz 30 surah Al-A'la dengan lancar dan tartil." },
    { studentId: "child-08", date: "2026-09-16", role: "parent", text: "Adibah rajin membantu ibu merapikan meja makan setelah berbuka puasa sunnah." },
    { studentId: "child-15", date: "2026-09-17", role: "parent", text: "Arfan membaca doa sebelum tidur dan tidur tepat waktu pukul 20.30." },
    { studentId: "child-31", date: "2026-09-17", role: "parent", text: "Alia shalat Dzuhur dan Ashar di sekolah selalu terjaga. Terima kasih bimbingan Pak Guru." },
    { studentId: "child-34", date: "2026-09-16", role: "parent", text: "Alisya sangat bersemangat membaca hafalan surah pendek sebelum tidur." },
    { studentId: "child-01", date: "2026-09-17", role: "teacher", text: "Masya Allah, hebat sekali ananda Ghani! Pertahankan shalat berjamaahnya ya nak." },
    { studentId: "child-34", date: "2026-09-16", role: "teacher", text: "Barakallahu fiik ananda Alisya, hafalan surahnya semakin lancar dan fasih." },
  ];

  const insertNoteStmt = sqlite.prepare(`
    INSERT INTO checklist_notes (id, school_id, child_id, entry_date, note, author_id, author_role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let idx = 0; idx < sampleNotes.length; idx++) {
    const n = sampleNotes[idx];
    const authorId = n.role === "teacher" ? teacherId : `user-parent-${n.studentId.replace("child-", "")}`;
    insertNoteStmt.run(`note-seed-${idx + 1}`, schoolId, n.studentId, n.date, n.text, authorId, n.role, now, now);
  }

  sqlite.exec("COMMIT;");

  console.log("\n================================================================");
  console.log("🎉 SEEDING SELESAI DENGAN SUKSES!");
  console.log("----------------------------------------------------------------");
  console.log("Total Siswa Terdaftar : 50 Siswa");
  console.log(" - Kelas 1A           : 25 Siswa (child-01 s/d child-25)");
  console.log(" - Kelas 2A           : 25 Siswa (child-26 s/d child-50)");
  console.log("Total Akun Orang Tua  : 50 Akun (Password standar: password123)");
  console.log("Rentang Waktu Checklist: 4 Agustus 2026 s/d 17 September 2026");
  console.log("Ketentuan Rekap Pekanan:");
  console.log(" - Minggu 1 (4–8 Ags)   : 58% konsistensi");
  console.log(" - Minggu 2 (11–15 Ags) : 64% konsistensi");
  console.log(" - Minggu 3 (18–22 Ags) : 71% konsistensi");
  console.log(" - Minggu 4 (25–29 Ags) : 77% konsistensi");
  console.log(" - Minggu 5 (1–5 Sept)  : 82% konsistensi");
  console.log(" - Minggu 6 (8–12 Sept) : 86% konsistensi");
  console.log(" - Minggu 7 (14–18 Sept): 89% konsistensi");
  console.log("Akun Guru             : andi@sekolah.sch.id | Sandi: password123");
  console.log("Contoh Akun Ortu 1A   : ortu.ghani@keluarga.id | Sandi: password123");
  console.log("Contoh Akun Ortu 2A   : ortu.alby@keluarga.id | Sandi: password123");
  console.log("================================================================\n");
}

// Jalankan langsung jika dieksekusi via CLI
if (process.argv[1]?.includes("seed_50_students")) {
  seed50Students();
}
