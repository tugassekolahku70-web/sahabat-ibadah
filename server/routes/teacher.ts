import { Router, Request, Response, NextFunction } from "express";
import {
  execute,
  generateUUID,
  hashPassword,
  verifyPassword,
  nowISO,
  queryAll,
  queryOne,
  transaction,
} from "../db/index.js";
import {
  authenticate,
  requireRole,
  checkTeacherClassOwnership,
  checkTeacherStudentOwnership,
} from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { logAudit } from "../services/audit.js";
import { getChildDailyProgress } from "../services/progress.js";

const router = Router();

// Semua rute guru wajib terautentikasi dan memiliki peran 'teacher'
router.use(authenticate, requireRole("teacher"));

/**
 * 1. Ambil Profil Guru & Profil Sekolah (Termasuk Logo)
 * GET /api/v1/teacher/profile
 */
router.get(["/profile", "/teacher/profile"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await queryOne<{
      id: string;
      email: string;
      phone: string;
      full_name: string;
      avatar_url: string | null;
      school_id: string;
      school_name: string;
      school_logo_url: string | null;
    }>(
      `SELECT u.id, u.email, u.phone, u.full_name, u.avatar_url,
              s.id as school_id, s.name as school_name, s.logo_url as school_logo_url
       FROM users u
       JOIN user_roles r ON u.id = r.user_id
       JOIN schools s ON r.school_id = s.id
       WHERE u.id = ? AND r.role = 'teacher'`,
      [req.user!.id]
    );

    if (!user) throw new AppError("Profil guru tidak ditemukan.", { status: 404 });

    res.json({ success: true, profile: user });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Edit Profil Guru & Pengaturan Sekolah (Termasuk Foto Guru & Logo Sekolah)
 * PUT /api/v1/teacher/profile
 */
router.put(["/profile", "/teacher/profile"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, phone, school_name, school_logo_url, avatar_url } = req.body;
    const now = nowISO();

    if (!full_name) throw new AppError("Nama lengkap wajib diisi.", { status: 400 });

    await transaction(async () => {
      // Update profil guru
      await execute(
        `UPDATE users
         SET full_name = ?, phone = ?, avatar_url = ?, updated_at = ?
         WHERE id = ?`,
        [full_name.trim(), phone?.trim() || null, avatar_url !== undefined ? avatar_url : null, now, req.user!.id]
      );

      // Update profil sekolah (nama & logo)
      if (school_name || school_logo_url !== undefined) {
        await execute(
          `UPDATE schools
           SET name = COALESCE(?, name),
               logo_url = ?,
               updated_at = ?
           WHERE id = ?`,
          [school_name ? school_name.trim() : null, school_logo_url !== undefined ? school_logo_url : null, now, req.user!.schoolId]
        );
      }
    });

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "teacher.profile_updated",
      entityType: "user",
      entityId: req.user!.id,
      after: { full_name, phone, school_name, has_logo: Boolean(school_logo_url) },
      ip: req.ip,
    });

    res.json({ success: true, message: "Profil guru & sekolah berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. Guru Mengganti Password Mandiri
 * PUT /api/v1/teacher/change-password
 */
router.put(["/change-password", "/teacher/change-password"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError("Password saat ini dan password baru wajib diisi.", { status: 400 });
    }

    if (new_password.length < 6) {
      throw new AppError("Password baru minimal 6 karakter.", { status: 400 });
    }

    const user = await queryOne<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [req.user!.id]);
    if (!user || !verifyPassword(current_password, user.password_hash)) {
      throw new AppError("Password saat ini tidak sesuai.", { status: 400 });
    }

    const newHash = hashPassword(new_password);
    await execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [newHash, nowISO(), req.user!.id]);

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "teacher.password_changed",
      entityType: "user",
      entityId: req.user!.id,
      ip: req.ip,
    });

    res.json({ success: true, message: "Password berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. Ambil Daftar Kelas Milik Guru
 * GET /api/v1/teacher/classes
 */
router.get(["/classes", "/", "/teacher/classes"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await queryAll<{
      id: string;
      name: string;
      grade_level: string;
      academic_year: string;
      status: string;
      student_count: number;
    }>(
      `SELECT cl.id, cl.name, cl.grade_level, cl.academic_year, cl.status,
              COUNT(scl.child_id) as student_count
       FROM classes cl
       LEFT JOIN student_class_links scl ON cl.id = scl.class_id AND scl.status = 'active'
       WHERE cl.teacher_id = ? AND cl.status = 'active'
       GROUP BY cl.id
       ORDER BY cl.name ASC`,
      [req.user!.id]
    );

    res.json({ success: true, classes });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. Tambah Kelas Baru
 * POST /api/v1/teacher/classes
 */
router.post(["/classes", "/", "/teacher/classes"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, grade_level, academic_year } = req.body;
    if (!name) throw new AppError("Nama kelas wajib diisi.", { status: 400 });

    const classId = `class-${generateUUID().slice(0, 8)}`;
    const now = nowISO();

    await transaction(async () => {
      await execute(
        `INSERT INTO classes (id, school_id, teacher_id, name, grade_level, academic_year, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [
          classId,
          req.user!.schoolId,
          req.user!.id,
          name.trim(),
          grade_level || "Kelas 4 SD",
          academic_year || "2025/2026",
          now,
          now,
        ]
      );

      await execute(
        `INSERT INTO teacher_class_links (id, teacher_user_id, class_id, is_homeroom, created_at)
         VALUES (?, ?, ?, 1, ?)`,
        [`tcl-${generateUUID().slice(0, 8)}`, req.user!.id, classId, now]
      );
    });

    res.status(201).json({
      success: true,
      message: `Kelas "${name}" berhasil dibuat.`,
      classId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. Edit Kelas
 * PUT /api/v1/teacher/classes/:classId
 */
router.put(["/classes/:classId", "/:classId", "/teacher/classes/:classId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const { name, grade_level, academic_year } = req.body;

    const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
    if (!hasOwnership) {
      throw new AppError("Kelas tidak ditemukan atau Anda tidak memiliki akses ke kelas ini.", { status: 403 });
    }

    if (!name) throw new AppError("Nama kelas wajib diisi.", { status: 400 });

    const now = nowISO();
    await execute(
      `UPDATE classes
       SET name = ?, grade_level = ?, academic_year = ?, updated_at = ?
       WHERE id = ? AND teacher_id = ?`,
      [name.trim(), grade_level, academic_year, now, classId, req.user!.id]
    );

    res.json({ success: true, message: "Informasi kelas berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. Hapus / Arsipkan Kelas
 * DELETE /api/v1/teacher/classes/:classId
 */
router.delete(["/classes/:classId", "/:classId", "/teacher/classes/:classId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;

    const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
    if (!hasOwnership) {
      throw new AppError("Kelas tidak ditemukan atau Anda tidak memiliki akses ke kelas ini.", { status: 403 });
    }

    const studentCountRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM student_class_links WHERE class_id = ? AND status = 'active'`,
      [classId]
    );
    const studentCount = studentCountRow?.count || 0;

    await execute(`UPDATE classes SET status = 'archived', updated_at = ? WHERE id = ?`, [nowISO(), classId]);

    res.json({
      success: true,
      message: `Kelas berhasil dinonaktifkan/dihapus (${studentCount} siswa terkait diarsipkan).`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. Ambil Siswa dalam Kelas Guru (Termasuk Foto Siswa & Status Akun Orang Tua)
 * GET /api/v1/classes/:classId/students
 */
router.get(["/classes/:classId/students", "/:classId/students", "/teacher/classes/:classId/students"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;

    const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
    if (!hasOwnership) {
      throw new AppError("Akses ditolak ke kelas ini.", { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];

    const students = await queryAll<{
      id: string;
      full_name: string;
      preferred_name: string;
      grade_level: string;
      avatar_url: string | null;
      status: string;
      parent_user_id: string | null;
      parent_name: string | null;
      parent_email: string | null;
      parent_phone: string | null;
    }>(
      `SELECT c.id, c.full_name, c.preferred_name, c.grade_level, c.avatar_url, c.status,
              u.id as parent_user_id, u.full_name as parent_name, u.email as parent_email, u.phone as parent_phone
       FROM children c
       JOIN student_class_links scl ON c.id = scl.child_id
       LEFT JOIN parent_child_links pcl ON c.id = pcl.child_id
       LEFT JOIN users u ON pcl.parent_user_id = u.id
       WHERE scl.class_id = ? AND c.status = 'active'
       ORDER BY c.full_name ASC`,
      [classId]
    );

    // Hitung progres harian hari ini per siswa
    const listWithProgress = await Promise.all(
      students.map(async (s) => {
        const { summary } = await getChildDailyProgress(s.id, today);
        return {
          ...s,
          hasParentAccount: Boolean(s.parent_user_id && s.parent_email),
          todayProgress: summary.percentage,
          completedCount: summary.completedCount,
          totalHabits: summary.totalHabits,
          statusLabel: summary.notReportedCount === summary.totalHabits ? "Belum diisi" : `${summary.percentage}% selesai`,
        };
      })
    );

    res.json({ success: true, students: listWithProgress });
  } catch (err) {
    next(err);
  }
});

/**
 * 9. Tambah Siswa Baru ke Kelas Guru (Termasuk Foto Siswa)
 * POST /api/v1/classes/:classId/students
 */
router.post(["/classes/:classId/students", "/:classId/students", "/teacher/classes/:classId/students"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const { full_name, preferred_name, grade_level, avatar_url, parent_name, parent_email, parent_password } = req.body;

    const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
    if (!hasOwnership) {
      throw new AppError("Akses ditolak ke kelas ini.", { status: 403 });
    }

    if (!full_name) throw new AppError("Nama lengkap siswa wajib diisi.", { status: 400 });

    const studentId = `child-${generateUUID().slice(0, 8)}`;
    const now = nowISO();

    await transaction(async () => {
      // 1. Buat Child
      await execute(
        `INSERT INTO children (id, school_id, full_name, preferred_name, grade_level, avatar_url, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [
          studentId,
          req.user!.schoolId,
          full_name.trim(),
          (preferred_name && preferred_name.trim()) || full_name.split(" ")[0],
          grade_level || "Kelas 4 SD",
          avatar_url || null,
          now,
          now,
        ]
      );

      // 2. Hubungkan ke Kelas
      await execute(
        `INSERT INTO student_class_links (id, child_id, class_id, status, created_at)
         VALUES (?, ?, ?, 'active', ?)`,
        [`scl-${generateUUID().slice(0, 8)}`, studentId, classId, now]
      );

      // 3. Jika ada informasi orang tua dan password, daftarkan akun langsung
      if (parent_email) {
        const cleanParentEmail = parent_email.trim().toLowerCase();
        let parentUser = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [cleanParentEmail]);

        const passToUse = parent_password || "Bismillah#123";
        const pHash = hashPassword(passToUse);

        if (!parentUser) {
          const parentUserId = `user-prn-${generateUUID().slice(0, 8)}`;
          await execute(
            `INSERT INTO users (id, email, password_hash, full_name, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'active', ?, ?)`,
            [parentUserId, cleanParentEmail, pHash, parent_name || "Orang Tua Siswa", now, now]
          );
          await execute(
            `INSERT INTO user_roles (id, user_id, school_id, role, created_at)
             VALUES (?, ?, ?, 'parent', ?)
             ON CONFLICT DO NOTHING`,
            [`role-${generateUUID().slice(0, 8)}`, parentUserId, req.user!.schoolId, now]
          );
          parentUser = { id: parentUserId };
        }

        await execute(
          `INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
           VALUES (?, ?, ?, 'parent', ?)
           ON CONFLICT DO NOTHING`,
          [`pcl-${generateUUID().slice(0, 8)}`, parentUser.id, studentId, now]
        );
      }
    });

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "student.created",
      entityType: "child",
      entityId: studentId,
      after: { full_name, classId },
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Siswa "${full_name}" berhasil ditambahkan ke kelas.`,
      studentId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 10. Edit Data Diri & Foto Siswa
 * PUT /api/v1/teacher/students/:studentId
 */
router.put(["/students/:studentId", "/teacher/students/:studentId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { full_name, preferred_name, grade_level, avatar_url } = req.body;

    const hasOwnership = await checkTeacherStudentOwnership(req.user!.id, studentId);
    if (!hasOwnership) {
      throw new AppError("Siswa tidak ditemukan atau bukan berada di kelas Anda.", { status: 403 });
    }

    if (!full_name) throw new AppError("Nama lengkap siswa tidak boleh kosong.", { status: 400 });

    const now = nowISO();
    await execute(
      `UPDATE children
       SET full_name = ?, preferred_name = ?, grade_level = ?, avatar_url = ?, updated_at = ?
       WHERE id = ?`,
      [full_name.trim(), preferred_name?.trim() || null, grade_level || null, avatar_url !== undefined ? avatar_url : null, now, studentId]
    );

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "student.updated",
      entityType: "child",
      entityId: studentId,
      after: { full_name, preferred_name, has_photo: Boolean(avatar_url) },
      ip: req.ip,
    });

    res.json({ success: true, message: "Data & foto siswa berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

/**
 * 11. Hapus / Keluarkan Siswa dari Kelas
 * DELETE /api/v1/teacher/students/:studentId
 */
router.delete(["/students/:studentId", "/teacher/students/:studentId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;

    const hasOwnership = await checkTeacherStudentOwnership(req.user!.id, studentId);
    if (!hasOwnership) {
      throw new AppError("Siswa tidak ditemukan atau bukan berada di kelas Anda.", { status: 403 });
    }

    await transaction(async () => {
      await execute(`UPDATE children SET status = 'archived', updated_at = ? WHERE id = ?`, [nowISO(), studentId]);
      await execute(`UPDATE student_class_links SET status = 'moved' WHERE child_id = ?`, [studentId]);
    });

    res.json({ success: true, message: "Siswa berhasil dihapus dari daftar kelas aktif." });
  } catch (err) {
    next(err);
  }
});

/**
 * 12. Guru Membuat Akun Login Panel Orang Tua untuk Siswa
 * POST /api/v1/teacher/students/:studentId/parent-account
 */
router.post(["/students/:studentId/parent-account", "/teacher/students/:studentId/parent-account"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { parent_name, parent_email, password, phone, relationship } = req.body;

    const hasOwnership = await checkTeacherStudentOwnership(req.user!.id, studentId);
    if (!hasOwnership) {
      throw new AppError("Siswa tidak ditemukan di kelas Anda.", { status: 403 });
    }

    if (!parent_email || !password) {
      throw new AppError("Email dan password akun orang tua wajib diisi.", { status: 400 });
    }

    const cleanEmail = parent_email.trim().toLowerCase();
    const cleanName = parent_name?.trim() || "Orang Tua Siswa";
    const now = nowISO();
    const pHash = hashPassword(password);

    let parentId: string;

    await transaction(async () => {
      // Cek apakah email user sudah terdaftar di sistem
      const existingUser = await queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", [cleanEmail]);

      if (existingUser) {
        parentId = existingUser.id;
        // Update password, nama, status active
        await execute(
          "UPDATE users SET password_hash = ?, full_name = ?, phone = ?, status = 'active', updated_at = ? WHERE id = ?",
          [pHash, cleanName, phone?.trim() || null, now, parentId]
        );
        // Pastikan role parent ada
        await execute(
          "INSERT INTO user_roles (id, user_id, school_id, role, created_at) VALUES (?, ?, ?, 'parent', ?) ON CONFLICT DO NOTHING",
          [`role-${generateUUID().slice(0, 8)}`, parentId, req.user!.schoolId, now]
        );
      } else {
        parentId = `user-prn-${generateUUID().slice(0, 8)}`;
        await execute(
          `INSERT INTO users (id, email, phone, password_hash, full_name, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
          [parentId, cleanEmail, phone?.trim() || null, pHash, cleanName, now, now]
        );
        await execute(
          "INSERT INTO user_roles (id, user_id, school_id, role, created_at) VALUES (?, ?, ?, 'parent', ?) ON CONFLICT DO NOTHING",
          [`role-${generateUUID().slice(0, 8)}`, parentId, req.user!.schoolId, now]
        );
      }

      // Hubungkan ke anak di parent_child_links
      await execute(
        `INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (parent_user_id, child_id) DO UPDATE SET relationship = EXCLUDED.relationship, created_at = EXCLUDED.created_at`,
        [`pcl-${generateUUID().slice(0, 8)}`, parentId, studentId, relationship || "parent", now]
      );
    });

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "parent.account_created_by_teacher",
      entityType: "user",
      entityId: parentId!,
      after: { email: cleanEmail, studentId },
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Akun login Orang Tua (${cleanEmail}) berhasil dibuat & dihubungkan.`,
      parent: {
        id: parentId!,
        email: cleanEmail,
        fullName: cleanName,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 13. Guru Reset Password Akun Orang Tua Siswa
 * POST /api/v1/teacher/students/:studentId/reset-parent-password
 */
router.post(["/students/:studentId/reset-parent-password", "/teacher/students/:studentId/reset-parent-password"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { new_password } = req.body;

    const hasOwnership = await checkTeacherStudentOwnership(req.user!.id, studentId);
    if (!hasOwnership) {
      throw new AppError("Akses ditolak.", { status: 403 });
    }

    if (!new_password || new_password.length < 6) {
      throw new AppError("Password baru minimal 6 karakter.", { status: 400 });
    }

    const link = await queryOne<{ parent_user_id: string }>(
      "SELECT parent_user_id FROM parent_child_links WHERE child_id = ?",
      [studentId]
    );

    if (!link) {
      throw new AppError("Belum ada akun orang tua yang terhubung ke siswa ini.", { status: 404 });
    }

    const pHash = hashPassword(new_password);
    await execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [pHash, nowISO(), link.parent_user_id]);

    res.json({ success: true, message: "Password akun orang tua berhasil direset." });
  } catch (err) {
    next(err);
  }
});

/**
 * 14. Laporan Mingguan Kelas (Weekly Report: Matriks 7 Hari, Breakdown Ibadah, & Kepatuhan)
 * GET /api/v1/classes/:classId/weekly-report
 */
router.get(["/classes/:classId/weekly-report", "/:classId/weekly-report", "/teacher/classes/:classId/weekly-report"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;

    const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
    if (!hasOwnership) {
      throw new AppError("Akses ditolak ke kelas ini.", { status: 403 });
    }

    // Hitung tanggal 7 hari (default: 6 hari lalu sampai hari ini, atau query startDate)
    const startDateStr = req.query.startDate as string;
    const dates: string[] = [];

    if (startDateStr) {
      const start = new Date(startDateStr);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }
    }

    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    const students = await queryAll<{ id: string; full_name: string; preferred_name: string; avatar_url: string | null }>(
      `SELECT c.id, c.full_name, c.preferred_name, c.avatar_url
       FROM children c
       JOIN student_class_links scl ON c.id = scl.child_id
       WHERE scl.class_id = ? AND c.status = 'active'
       ORDER BY c.full_name ASC`,
      [classId]
    );

    // Ambil daftar kebiasaan aktif sekolah
    const habits = await queryAll<{ id: string; name: string; category: string }>(
      `SELECT id, name, category FROM habit_template_items WHERE school_id = ? AND is_active = 1 ORDER BY sort_order ASC`,
      [req.user!.schoolId]
    );

    // Map untuk habit breakdown
    const habitStatsMap = new Map<string, { id: string; name: string; category: string; completedCount: number; totalPossible: number }>();
    habits.forEach((h) => {
      habitStatsMap.set(h.id, {
        id: h.id,
        name: h.name,
        category: h.category,
        completedCount: 0,
        totalPossible: Math.max(1, students.length * dates.length),
      });
    });

    let totalClassEntries = 0;

    const studentMatrix = await Promise.all(
      students.map(async (s) => {
        let studentCompletedEntries = 0;
        let studentActiveDays = 0;

        const days = await Promise.all(
          dates.map(async (date) => {
            const dObj = new Date(date);
            const dayLabel = dayNames[dObj.getDay()];

            const { summary, items } = await getChildDailyProgress(s.id, date);
            const isReported = summary.notReportedCount < summary.totalHabits;
            if (isReported) studentActiveDays++;

            studentCompletedEntries += summary.completedCount;
            totalClassEntries += summary.completedCount;

            // Update habit counter
            items.forEach((it) => {
              if (it.checked && habitStatsMap.has(it.id)) {
                habitStatsMap.get(it.id)!.completedCount++;
              }
            });

            return {
              date,
              dayLabel,
              percentage: summary.percentage,
              completedCount: summary.completedCount,
              totalHabits: summary.totalHabits,
              status: summary.percentage >= 80 ? "complete" : summary.percentage > 0 ? "partial" : "unreported",
            };
          })
        );

        const maxPossibleForStudent = dates.length * (habits.length || 1);
        const weeklyAverage = maxPossibleForStudent > 0 ? Math.round((studentCompletedEntries / maxPossibleForStudent) * 100) : 0;

        return {
          id: s.id,
          name: s.full_name,
          preferredName: s.preferred_name || s.full_name.split(" ")[0],
          avatarUrl: s.avatar_url,
          days,
          weeklyAverage,
          activeDays: studentActiveDays,
        };
      })
    );

    const totalPossibleClassEntries = Math.max(1, students.length * dates.length * (habits.length || 1));
    const classWeeklyAverage = Math.round((totalClassEntries / totalPossibleClassEntries) * 100);

    const activeStudentCount = studentMatrix.filter((s) => s.activeDays >= 4).length;
    const weeklyComplianceRate = students.length > 0 ? Math.round((activeStudentCount / students.length) * 100) : 0;

    const habitBreakdown = Array.from(habitStatsMap.values()).map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      completedCount: h.completedCount,
      percentage: Math.round((h.completedCount / h.totalPossible) * 100),
    }));

    const topStudents = [...studentMatrix]
      .sort((a, b) => b.weeklyAverage - a.weeklyAverage)
      .slice(0, 3)
      .map((s, idx) => ({
        rank: idx + 1,
        name: s.name,
        average: s.weeklyAverage,
        avatarUrl: s.avatarUrl,
      }));

    res.json({
      success: true,
      report: {
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        dates,
        classWeeklyAverage,
        weeklyComplianceRate,
        totalCompletedActivities: totalClassEntries,
        habitBreakdown,
        studentMatrix,
        topStudents,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 15. Ringkasan Kelas Guru (Dashboard Overview)
 * GET /api/v1/classes/:classId/summary
 */
router.get(["/classes/:classId/summary", "/:classId/summary", "/teacher/classes/:classId/summary"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;

    const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
    if (!hasOwnership) {
      throw new AppError("Akses ditolak ke kelas ini.", { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];

    const students = await queryAll<{ id: string; full_name: string; preferred_name: string; avatar_url: string | null }>(
      `SELECT c.id, c.full_name, c.preferred_name, c.avatar_url
       FROM children c
       JOIN student_class_links scl ON c.id = scl.child_id
       WHERE scl.class_id = ? AND c.status = 'active'`,
      [classId]
    );

    let totalPercentage = 0;
    let reportedCount = 0;
    const progressList: Array<{ id: string; name: string; rate: number; notReported: boolean; avatarUrl: string | null }> = [];

    for (const s of students) {
      const { summary } = await getChildDailyProgress(s.id, today);
      totalPercentage += summary.percentage;
      const isReported = summary.notReportedCount < summary.totalHabits;
      if (isReported) reportedCount++;

      progressList.push({
        id: s.id,
        name: s.full_name,
        rate: summary.percentage,
        notReported: !isReported,
        avatarUrl: s.avatar_url,
      });
    }

    const totalStudents = students.length;
    const averageClassRate = totalStudents > 0 ? Math.round(totalPercentage / totalStudents) : 0;
    const complianceRate = totalStudents > 0 ? Math.round((reportedCount / totalStudents) * 100) : 0;

    const topStudents = [...progressList]
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map((s, idx) => ({
        rank: idx + 1,
        name: s.name,
        rate: s.rate,
        avatarUrl: s.avatarUrl,
        initials: s.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      }));

    res.json({
      success: true,
      summary: {
        totalStudents,
        averageClassRate,
        complianceRate,
        reportedCount,
        unreportedCount: totalStudents - reportedCount,
        topStudents,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 16. Daftar Siswa yang Perlu Perhatian Guru (Attention List)
 * GET /api/v1/classes/:classId/students/attention
 */
router.get(
  [
    "/classes/:classId/students/attention",
    "/classes/:classId/attention",
    "/:classId/students/attention",
    "/:classId/attention",
    "/teacher/classes/:classId/students/attention",
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params;

      const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
      if (!hasOwnership) {
        throw new AppError("Akses ditolak ke kelas ini.", { status: 403 });
      }

      const today = new Date().toISOString().split("T")[0];

      const students = await queryAll<{ id: string; full_name: string; preferred_name: string; avatar_url: string | null }>(
        `SELECT c.id, c.full_name, c.preferred_name, c.avatar_url
         FROM children c
         JOIN student_class_links scl ON c.id = scl.child_id
         WHERE scl.class_id = ? AND c.status = 'active'`,
        [classId]
      );

      const attentionList = [];

      for (const s of students) {
        const { summary } = await getChildDailyProgress(s.id, today);
        if (summary.notReportedCount === summary.totalHabits) {
          attentionList.push({
            id: s.id,
            name: s.full_name,
            avatarUrl: s.avatar_url,
            reason: "Belum mengisi checklist hari ini",
            status: "unreported",
          });
        } else if (summary.percentage < 50) {
          attentionList.push({
            id: s.id,
            name: s.full_name,
            avatarUrl: s.avatar_url,
            reason: `Progres ibadah rendah (${summary.percentage}%)`,
            status: "low_progress",
          });
        }
      }

      res.json({ success: true, attentionList });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 17. Guru Mengirim Catatan Apresiasi untuk Siswa
 * POST /api/v1/children/:childId/teacher-notes
 */
router.post(
  ["/children/:childId/teacher-notes", "/teacher/children/:childId/teacher-notes"],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const { note, date } = req.body;

      const hasOwnership = await checkTeacherStudentOwnership(req.user!.id, childId);
      if (!hasOwnership) {
        throw new AppError("Siswa bukan berada di kelas kewenangan Anda.", { status: 403 });
      }

      if (!note) throw new AppError("Catatan apresiasi tidak boleh kosong.", { status: 400 });

      const entryDate = date || new Date().toISOString().split("T")[0];
      const now = nowISO();

      await execute(
        `INSERT INTO checklist_notes (id, school_id, child_id, entry_date, note, author_id, author_role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'teacher', ?, ?)`,
        [`note-t-${generateUUID().slice(0, 8)}`, req.user!.schoolId, childId, entryDate, note.trim(), req.user!.id, now, now]
      );

      await logAudit({
        schoolId: req.user!.schoolId,
        actorUserId: req.user!.id,
        action: "teacher.note_added",
        entityType: "child",
        entityId: childId,
        after: { note },
        ip: req.ip,
      });

      res.json({ success: true, message: "Catatan guru berhasil dikirimkan." });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 18. Pendaftaran Siswa & Orang Tua Masal (Bulk Import)
 * POST /api/v1/classes/:classId/students/bulk
 */
router.post(
  ["/classes/:classId/students/bulk", "/:classId/students/bulk", "/teacher/classes/:classId/students/bulk"],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { classId } = req.params;
      const { students } = req.body;

      const hasOwnership = await checkTeacherClassOwnership(req.user!.id, classId);
      if (!hasOwnership) {
        throw new AppError("Akses ditolak ke kelas ini.", { status: 403 });
      }

      if (!Array.isArray(students) || students.length === 0) {
        throw new AppError("Daftar siswa untuk pendaftaran masal wajib berupa array dan tidak boleh kosong.", { status: 400 });
      }

      const now = nowISO();
      const createdStudents: Array<{ id: string; name: string; parentEmail?: string }> = [];

      await transaction(async () => {
        for (const item of students) {
          const fullName = item.full_name && String(item.full_name).trim();
          if (!fullName) continue;

          const preferredName =
            (item.preferred_name && String(item.preferred_name).trim()) ||
            fullName.split(" ")[0];
          const gradeLevel = item.grade_level || "Kelas 4 SD";
          const studentId = `child-${generateUUID().slice(0, 8)}`;

          // 1. Buat Child
          await execute(
            `INSERT INTO children (id, school_id, full_name, preferred_name, grade_level, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
            [studentId, req.user!.schoolId, fullName, preferredName, gradeLevel, now, now]
          );

          // 2. Tautkan ke Kelas
          await execute(
            `INSERT INTO student_class_links (id, child_id, class_id, status, created_at)
             VALUES (?, ?, ?, 'active', ?)`,
            [`scl-${generateUUID().slice(0, 8)}`, studentId, classId, now]
          );

          // 3. Daftarkan / Tautkan Akun Orang Tua jika email diisi
          const parentEmail = item.parent_email && String(item.parent_email).trim().toLowerCase();
          if (parentEmail) {
            const parentName = item.parent_name ? String(item.parent_name).trim() : `Orang Tua ${preferredName}`;
            const parentPhone = item.parent_phone ? String(item.parent_phone).trim() : null;
            const passToUse = item.parent_password || "Bismillah#123";
            const pHash = hashPassword(passToUse);

            let parentUser = await queryOne<{ id: string }>(
              `SELECT id FROM users WHERE email = ?`,
              [parentEmail]
            );

            let parentUserId = parentUser?.id;
            if (!parentUserId) {
              parentUserId = `user-prn-${generateUUID().slice(0, 8)}`;
              await execute(
                `INSERT INTO users (id, email, phone, password_hash, full_name, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
                [parentUserId, parentEmail, parentPhone, pHash, parentName, now, now]
              );
              await execute(
                `INSERT INTO user_roles (id, user_id, school_id, role, created_at)
                 VALUES (?, ?, ?, 'parent', ?)
                 ON CONFLICT DO NOTHING`,
                [`role-${generateUUID().slice(0, 8)}`, parentUserId, req.user!.schoolId, now]
              );
            }

            await execute(
              `INSERT INTO parent_child_links (id, parent_user_id, child_id, relationship, created_at)
               VALUES (?, ?, ?, 'parent', ?)
               ON CONFLICT DO NOTHING`,
              [`pcl-${generateUUID().slice(0, 8)}`, parentUserId, studentId, now]
            );
          }

          createdStudents.push({
            id: studentId,
            name: fullName,
            parentEmail: parentEmail || undefined,
          });
        }
      });

      await logAudit({
        schoolId: req.user!.schoolId,
        actorUserId: req.user!.id,
        action: "student.bulk_created",
        entityType: "class",
        entityId: classId,
        after: { count: createdStudents.length },
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        message: `Berhasil mendaftarkan ${createdStudents.length} siswa beserta akun orang tua secara masal.`,
        count: createdStudents.length,
        students: createdStudents,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 19. Ambil Daftar Butir Kebiasaan & Ibadah Sekolah Guru
 * GET /api/v1/teacher/habits
 */
router.get(["/habits", "/teacher/habits"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const habits = await queryAll<{
      id: string;
      name: string;
      category: "ibadah_wajib" | "ibadah_harian" | "kebiasaan_baik";
      description: string | null;
      icon_key: string;
      sort_order: number;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, name, category, description, icon_key, sort_order, is_active, created_at, updated_at
       FROM habit_template_items
       WHERE school_id = ? AND is_active = 1
       ORDER BY sort_order ASC, created_at ASC`,
      [req.user!.schoolId]
    );

    res.json({ success: true, habits });
  } catch (err) {
    next(err);
  }
});

/**
 * 20. Tambah Butir Kebiasaan & Ibadah Baru
 * POST /api/v1/teacher/habits
 */
router.post(["/habits", "/teacher/habits"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, description, icon_key, sort_order } = req.body;

    if (!name || !String(name).trim()) {
      throw new AppError("Nama aktivitas ibadah wajib diisi.", { status: 400 });
    }

    const allowedCats = ["ibadah_wajib", "ibadah_harian", "kebiasaan_baik"];
    const cat = allowedCats.includes(category) ? category : "ibadah_harian";
    const now = nowISO();

    // Dapatkan template_id sekolah atau buat jika belum ada
    let template = await queryOne<{ id: string }>(
      `SELECT id FROM habit_templates WHERE school_id = ? LIMIT 1`,
      [req.user!.schoolId]
    );
    let templateId = template?.id;
    if (!templateId) {
      templateId = `tmpl-${generateUUID().slice(0, 8)}`;
      await execute(
        `INSERT INTO habit_templates (id, school_id, name, description, is_default, created_at, updated_at)
         VALUES (?, ?, 'Standar Ibadah', 'Kurikulum pembiasaan kebaikan siswa', 1, ?, ?)`,
        [templateId, req.user!.schoolId, now, now]
      );
    }

    const maxOrderRow = await queryOne<{ max_order: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM habit_template_items WHERE school_id = ?`,
      [req.user!.schoolId]
    );
    const sortOrder = Number.isInteger(sort_order) ? sort_order : (maxOrderRow?.max_order || 0) + 1;

    const habitId = `hi-${generateUUID().slice(0, 8)}`;
    await execute(
      `INSERT INTO habit_template_items (id, school_id, template_id, category, name, description, icon_key, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        habitId,
        req.user!.schoolId,
        templateId,
        cat,
        String(name).trim(),
        description ? String(description).trim() : null,
        icon_key || "Sun",
        sortOrder,
        now,
        now,
      ]
    );

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "habit.created",
      entityType: "habit_template_item",
      entityId: habitId,
      after: { name, category: cat, icon_key },
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Aktivitas "${name}" berhasil ditambahkan.`,
      habit: {
        id: habitId,
        name: String(name).trim(),
        category: cat,
        description: description ? String(description).trim() : null,
        icon_key: icon_key || "Sun",
        sort_order: sortOrder,
        is_active: 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 21. Edit Butir Kebiasaan & Ibadah
 * PUT /api/v1/teacher/habits/:habitId
 */
router.put(["/habits/:habitId", "/teacher/habits/:habitId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const { name, category, description, icon_key, sort_order } = req.body;

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM habit_template_items WHERE id = ? AND school_id = ?`,
      [habitId, req.user!.schoolId]
    );
    if (!existing) {
      throw new AppError("Aktivitas ibadah tidak ditemukan atau Anda tidak memiliki akses.", { status: 404 });
    }

    if (!name || !String(name).trim()) {
      throw new AppError("Nama aktivitas ibadah wajib diisi.", { status: 400 });
    }

    const allowedCats = ["ibadah_wajib", "ibadah_harian", "kebiasaan_baik"];
    const cat = allowedCats.includes(category) ? category : "ibadah_harian";
    const now = nowISO();

    await execute(
      `UPDATE habit_template_items
       SET name = ?, category = ?, description = ?, icon_key = COALESCE(?, icon_key),
           sort_order = COALESCE(?, sort_order), updated_at = ?
       WHERE id = ? AND school_id = ?`,
      [
        String(name).trim(),
        cat,
        description !== undefined ? (description ? String(description).trim() : null) : null,
        icon_key || null,
        Number.isInteger(sort_order) ? sort_order : null,
        now,
        habitId,
        req.user!.schoolId,
      ]
    );

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "habit.updated",
      entityType: "habit_template_item",
      entityId: habitId,
      after: { name, category: cat, icon_key },
      ip: req.ip,
    });

    res.json({ success: true, message: "Aktivitas berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

/**
 * 22. Hapus / Nonaktifkan Butir Kebiasaan (Soft Delete)
 * DELETE /api/v1/teacher/habits/:habitId
 */
router.delete(["/habits/:habitId", "/teacher/habits/:habitId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { habitId } = req.params;
    const existing = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM habit_template_items WHERE id = ? AND school_id = ?`,
      [habitId, req.user!.schoolId]
    );
    if (!existing) {
      throw new AppError("Aktivitas tidak ditemukan.", { status: 404 });
    }

    // Soft delete agar histori catatan masa lalu siswa tidak hilang
    await execute(
      `UPDATE habit_template_items SET is_active = 0, updated_at = ? WHERE id = ? AND school_id = ?`,
      [nowISO(), habitId, req.user!.schoolId]
    );

    await logAudit({
      schoolId: req.user!.schoolId,
      actorUserId: req.user!.id,
      action: "habit.deleted",
      entityType: "habit_template_item",
      entityId: habitId,
      after: { name: existing.name },
      ip: req.ip,
    });

    res.json({ success: true, message: `Aktivitas "${existing.name}" berhasil dinonaktifkan.` });
  } catch (err) {
    next(err);
  }
});

export default router;

