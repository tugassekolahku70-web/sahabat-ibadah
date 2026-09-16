import { db, hashPassword, initSchema, nowISO } from "./index.js";

export function seedDatabase() {
  console.log("🌱 Memulai seeding database lokal Sahabat Ibadah...");
  initSchema();

  if (!db) {
    console.log("Database SQLite lokal tidak aktif (menggunakan PostgreSQL cloud). Seeding lokal dilewati.");
    return;
  }
  const sqlite = db;

  // Bersihkan data lama jika ada untuk idempotency
  sqlite.exec(`
    DELETE FROM audit_logs;
    DELETE FROM messages;
    DELETE FROM message_threads;
    DELETE FROM child_badges;
    DELETE FROM badges;
    DELETE FROM points_ledger;
    DELETE FROM streak_snapshots;
    DELETE FROM checklist_notes;
    DELETE FROM checklist_entries;
    DELETE FROM habit_template_items;
    DELETE FROM habit_templates;
    DELETE FROM parent_child_links;
    DELETE FROM teacher_class_links;
    DELETE FROM student_class_links;
    DELETE FROM children;
    DELETE FROM classes;
    DELETE FROM email_verifications;
    DELETE FROM user_roles;
    DELETE FROM users;
    DELETE FROM schools;
  `);

  const now = nowISO();
  const today = new Date().toISOString().split("T")[0];

  // 1. Sekolah
  const schoolId = "sch-sd-islam-01";
  sqlite.prepare(`
    INSERT INTO schools (id, name, code, timezone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(schoolId, "SD Islam Sahabat Ibadah", "SIS-001", "Asia/Jakarta", "active", now, now);

  // 2. Pengguna (Password standar: password123)
  const defaultPass = hashPassword("password123");

  const teacherId = "user-teacher-andi";
  const parentId = "user-parent-rina";
  const adminId = "user-admin-sekolah";

  sqlite.prepare(`
    INSERT INTO users (id, email, phone, password_hash, full_name, avatar_url, status, created_at, updated_at)
    VALUES 
      (?, 'andi@sekolah.sch.id', '081234567890', ?, 'Pak Andi', null, 'active', ?, ?),
      (?, 'rina@keluarga.id', '081298765432', ?, 'Bunda Rina', null, 'active', ?, ?),
      (?, 'admin@sekolah.sch.id', '081111222333', ?, 'Admin Sekolah', null, 'active', ?, ?)
  `).run(
    teacherId, defaultPass, now, now,
    parentId, defaultPass, now, now,
    adminId, defaultPass, now, now
  );

  // User Roles
  sqlite.prepare(`
    INSERT INTO user_roles (id, user_id, school_id, role, created_at)
    VALUES 
      ('role-teacher-1', ?, ?, 'teacher', ?),
      ('role-parent-1', ?, ?, 'parent', ?),
      ('role-admin-1', ?, ?, 'admin', ?)
  `).run(
    teacherId, schoolId, now,
    parentId, schoolId, now,
    adminId, schoolId, now
  );

  // 3. Kelas (Milik Pak Andi secara terisolasi)
  const classId = "class-4a";
  sqlite.prepare(`
    INSERT INTO classes (id, school_id, teacher_id, name, grade_level, academic_year, status, created_at, updated_at)
    VALUES (?, ?, ?, 'Kelas 4A', 'Kelas 4 SD', '2025/2026', 'active', ?, ?)
  `).run(classId, schoolId, teacherId, now, now);

  sqlite.prepare(`
    INSERT INTO teacher_class_links (id, teacher_user_id, class_id, is_homeroom, created_at)
    VALUES ('tcl-1', ?, ?, 1, ?)
  `).run(teacherId, classId, now);

  // 4. Data Siswa
  const students = [
    { id: "child-ahmad", name: "Ahmad Fauzan", preferred: "Ahmad", parentId },
    { id: "child-aisyah", name: "Aisyah Putri", preferred: "Aisyah" },
    { id: "child-zahra", name: "Zahra Nabila", preferred: "Zahra" },
    { id: "child-rafi", name: "Rafi Bintang", preferred: "Rafi" },
    { id: "child-naila", name: "Naila Azzahra", preferred: "Naila" },
    { id: "child-dimas", name: "Dimas Maulana", preferred: "Dimas" },
  ];

  const insertChildStmt = sqlite.prepare(`
    INSERT INTO children (id, school_id, full_name, preferred_name, grade_level, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Kelas 4 SD', 'active', ?, ?)
  `);

  const insertLinkStmt = sqlite.prepare(`
    INSERT INTO student_class_links (id, child_id, class_id, status, created_at)
    VALUES (?, ?, ?, 'active', ?)
  `);

  for (const s of students) {
    insertChildStmt.run(s.id, schoolId, s.name, s.preferred, now, now);
    insertLinkStmt.run(`scl-${s.id}`, s.id, classId, now);

    if (s.parentId) {
      sqlite.prepare(`
        INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
        VALUES (?, ?, ?, 'mother', ?)
      `).run(`pcl-${s.id}`, s.parentId, s.id, now);
    }
  }

  // 5. Template & Item Kebiasaan Ibadah
  const templateId = "tmpl-standar-sd";
  sqlite.prepare(`
    INSERT INTO habit_templates (id, school_id, name, description, is_default, created_at, updated_at)
    VALUES (?, ?, 'Standar Ibadah & Kebiasaan Baik', 'Kurikulum pembiasaan dasar siswa SD', 1, ?, ?)
  `).run(templateId, schoolId, now, now);

  const habitItems = [
    { id: "fajr", category: "ibadah_wajib", name: "Shalat Subuh", icon: "Sun", color: "amber", sort: 1 },
    { id: "quran", category: "ibadah_harian", name: "Membaca Al-Qur'an", icon: "BookOpen", color: "emerald", sort: 2 },
    { id: "dhuhr", category: "ibadah_wajib", name: "Shalat Dzuhur", icon: "Sun", color: "orange", sort: 3 },
    { id: "asr", category: "ibadah_wajib", name: "Shalat Ashar", icon: "Sun", color: "sky", sort: 4 },
    { id: "maghrib", category: "ibadah_wajib", name: "Shalat Maghrib", icon: "Moon", color: "violet", sort: 5 },
    { id: "isha", category: "ibadah_wajib", name: "Shalat Isya", icon: "Moon", color: "indigo", sort: 6 },
    { id: "kindness", category: "kebiasaan_baik", name: "Kebaikan Hari Ini", icon: "Heart", color: "rose", sort: 7, desc: "Membantu orang tua & sesama" },
    { id: "dua", category: "ibadah_harian", name: "Doa sebelum tidur", icon: "Star", color: "teal", sort: 8 },
  ];

  const insertHabitStmt = sqlite.prepare(`
    INSERT INTO habit_template_items (id, school_id, template_id, category, name, description, icon_key, sort_order, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  for (const h of habitItems) {
    insertHabitStmt.run(h.id, schoolId, templateId, h.category, h.name, h.desc || null, h.icon, h.sort, now, now);
  }

  // 6. Isi Histori Checklist 12 Hari ke Belakang untuk Ahmad
  const insertChecklistStmt = sqlite.prepare(`
    INSERT INTO checklist_entries (id, school_id, child_id, habit_item_id, entry_date, status, reported_by, reported_at, source, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'parent', 1, ?, ?)
  `);

  // 12 hari ke belakang
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    for (const h of habitItems) {
      let status: "completed" | "not_completed" | "not_reported" = "completed";

      if (i === 0) {
        // Hari ini (partially completed)
        if (["fajr", "quran", "dhuhr", "maghrib", "kindness"].includes(h.id)) {
          status = "completed";
        } else {
          status = "not_completed";
        }
      } else {
        // Hari-hari sebelumnya (kebanyakan completed untuk membentuk streak 12 hari)
        if (h.id === "asr" && i % 3 === 0) {
          status = "not_completed";
        } else if (h.id === "dua" && i % 4 === 0) {
          status = "not_completed";
        }
      }

      insertChecklistStmt.run(
        `chk-${dateStr}-${h.id}-ahmad`,
        schoolId,
        "child-ahmad",
        h.id,
        dateStr,
        status,
        parentId,
        now,
        now,
        now
      );
    }
  }

  // Catatan Ahmad hari ini
  sqlite.prepare(`
    INSERT INTO checklist_notes (id, school_id, child_id, entry_date, note, author_id, author_role, created_at, updated_at)
    VALUES (?, ?, 'child-ahmad', ?, 'Ahmad membaca surah An-Naba bersama Ayah setelah Maghrib.', ?, 'parent', ?, ?)
  `).run(`note-${today}-ahmad`, schoolId, today, parentId, now, now);

  // Catatan guru untuk Ahmad
  sqlite.prepare(`
    INSERT INTO checklist_notes (id, school_id, child_id, entry_date, note, author_id, author_role, created_at, updated_at)
    VALUES (?, ?, 'child-ahmad', ?, 'Ahmad sangat bersemangat saat membaca Al-Qur''an bersama teman-temannya di kelas.', ?, 'teacher', ?, ?)
  `).run(`note-t-${today}-ahmad`, schoolId, today, teacherId, now, now);

  // Streak Snapshot
  sqlite.prepare(`
    INSERT INTO streak_snapshots (id, child_id, current_streak, longest_streak, last_calculated_date, updated_at)
    VALUES ('streak-ahmad', 'child-ahmad', 12, 14, ?, ?)
  `).run(today, now);

  // Points Ledger
  sqlite.prepare(`
    INSERT INTO points_ledger (id, school_id, child_id, points, reason, source_type, created_at)
    VALUES 
      ('pt-1', ?, 'child-ahmad', 100, 'Checklist rutin 7 hari berturut-turut', 'streak', ?),
      ('pt-2', ?, 'child-ahmad', 80, 'Kebaikan harian beruntun', 'kindness', ?),
      ('pt-3', ?, 'child-ahmad', 68, 'Aktivitas ibadah wajib selesai tepat waktu', 'checklist', ?)
  `).run(schoolId, now, schoolId, now, schoolId, now);

  // Badges
  sqlite.prepare(`
    INSERT INTO badges (id, name, description, icon_key, criteria_key, created_at)
    VALUES 
      ('badge-first', 'Langkah Pertama', 'Menyelesaikan checklist pertama', 'Sparkles', 'first_checklist', ?),
      ('badge-streak-3', 'Konsisten 3 Hari', 'Menjaga rutinitas ibadah 3 hari berturut-turut', 'Flame', 'streak_3', ?),
      ('badge-quran', 'Sahabat Al-Qur''an', 'Membaca Al-Qur''an 5 kali dalam sepekan', 'BookOpen', 'quran_5', ?)
  `).run(now, now, now);

  sqlite.prepare(`
    INSERT INTO child_badges (id, child_id, badge_id, earned_at)
    VALUES 
      ('cb-1', 'child-ahmad', 'badge-first', ?),
      ('cb-2', 'child-ahmad', 'badge-streak-3', ?)
  `).run(now, now);

  // Message Thread & Messages
  const threadId = "thread-ahmad-teacher-parent";
  sqlite.prepare(`
    INSERT INTO message_threads (id, school_id, child_id, created_by, status, created_at, updated_at)
    VALUES (?, ?, 'child-ahmad', ?, 'open', ?, ?)
  `).run(threadId, schoolId, teacherId, now, now);

  sqlite.prepare(`
    INSERT INTO messages (id, thread_id, sender_id, body, sent_at)
    VALUES 
      ('msg-1', ?, ?, 'Assalamu''alaikum Bunda Rina, Ahmad menunjukkan kemajuan luar biasa dalam shalat berjamaah dan tadarus.', ?),
      ('msg-2', ?, ?, 'Wa''alaikumsalam Pak Andi, alhamdulillah kami sangat senang mendengarnya. Terima kasih atas bimbingannya di sekolah.', ?)
  `).run(threadId, teacherId, now, threadId, parentId, now);

  // Checklist untuk siswa lain hari ini agar dashboard kelas guru realistis
  for (const s of students) {
    if (s.id === "child-ahmad") continue;

    for (const h of habitItems) {
      let status: "completed" | "not_completed" | "not_reported" = "completed";
      if (s.id === "child-rafi") {
        status = "not_reported"; // Belum mengisi 2 hari
      } else if (s.id === "child-naila") {
        status = "not_reported"; // Belum mengisi hari ini
      } else if (s.id === "child-dimas") {
        status = (h.id === "fajr" || h.id === "dhuhr") ? "completed" : "not_completed"; // Progres menurun
      } else if (s.id === "child-zahra") {
        status = (h.id === "dua") ? "not_completed" : "completed";
      }

      insertChecklistStmt.run(
        `chk-${today}-${h.id}-${s.id}`,
        schoolId,
        s.id,
        h.id,
        today,
        status,
        null,
        now,
        now,
        now
      );
    }
  }

  console.log("✅ Seeding database lokal selesai dengan sukses!");
  console.log("----------------------------------------------------------------");
  console.log("Akun Pengujian Siap Pakai:");
  console.log("1. Guru       : andi@sekolah.sch.id     | Sandi: password123");
  console.log("2. Orang Tua  : rina@keluarga.id        | Sandi: password123");
  console.log("3. Admin      : admin@sekolah.sch.id    | Sandi: password123");
  console.log("----------------------------------------------------------------");
}

// Jalankan jika dieksekusi langsung
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase();
}
