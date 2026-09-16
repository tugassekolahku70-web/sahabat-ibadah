import { Router, Request, Response, NextFunction } from "express";
import { execute, generateUUID, hashPassword, verifyPassword, nowISO, queryAll, queryOne, transaction } from "../db/index.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { logAudit } from "../services/audit.js";
import { calculateAndSaveStreak, getChildDailyProgress, getChildPoints } from "../services/progress.js";

const router = Router();

// Semua rute orang tua wajib terautentikasi dan memiliki peran 'parent'
router.use(authenticate, requireRole("parent"));

async function checkParentChildAccess(parentId: string, childId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT id FROM parent_child_links WHERE parent_user_id = ? AND child_id = ?`,
    [parentId, childId]
  );
  return Boolean(row);
}

/**
 * 1. Ambil Daftar Anak yang Terhubung ke Orang Tua
 * GET /api/v1/parent/children
 */
router.get(["/children", "/", "/parent/children"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const children = await queryAll<{
      id: string;
      full_name: string;
      preferred_name: string;
      grade_level: string;
      avatar_url: string | null;
      class_name: string | null;
      teacher_name: string | null;
      school_name: string | null;
      school_logo_url: string | null;
    }>(
      `SELECT c.id, c.full_name, c.preferred_name, c.grade_level, c.avatar_url,
              cl.name as class_name, u_teacher.full_name as teacher_name,
              s.name as school_name, s.logo_url as school_logo_url
       FROM children c
       JOIN parent_child_links pcl ON c.id = pcl.child_id
       LEFT JOIN student_class_links scl ON c.id = scl.child_id AND scl.status = 'active'
       LEFT JOIN classes cl ON scl.class_id = cl.id
       LEFT JOIN users u_teacher ON cl.teacher_id = u_teacher.id
       LEFT JOIN schools s ON c.school_id = s.id
       WHERE pcl.parent_user_id = ? AND c.status = 'active'
       ORDER BY c.full_name ASC`,
      [req.user!.id]
    );

    res.json({ success: true, children });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Ringkasan Progres Anak (Dashboard Orang Tua)
 * GET /api/v1/children/:childId/summary
 */
router.get(["/:childId/summary", "/children/:childId/summary"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    const hasAccess = await checkParentChildAccess(req.user!.id, childId);
    if (!hasAccess) {
      throw new AppError("Anda tidak memiliki akses ke data anak ini.", { status: 403 });
    }

    // Ambil info sekolah dan anak
    const childInfo = await queryOne<{
      full_name: string;
      preferred_name: string;
      avatar_url: string | null;
      school_name: string | null;
      school_logo_url: string | null;
    }>(
      `SELECT c.full_name, c.preferred_name, c.avatar_url, s.name as school_name, s.logo_url as school_logo_url
       FROM children c
       LEFT JOIN schools s ON c.school_id = s.id
       WHERE c.id = ?`,
      [childId]
    );

    const { summary, items, parentNote, teacherNote } = await getChildDailyProgress(childId, date);
    const { currentStreak, longestStreak } = await calculateAndSaveStreak(childId);
    const points = await getChildPoints(childId);

    // Hitung performa 12 hari terakhir untuk bar chart di UI
    const chartBars: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const p = await getChildDailyProgress(childId, dStr);
      chartBars.push(p.summary.percentage);
    }

    res.json({
      success: true,
      summary,
      school: {
        name: childInfo?.school_name || "SD Islam Sahabat Ibadah",
        logoUrl: childInfo?.school_logo_url || null,
      },
      child: {
        id: childId,
        fullName: childInfo?.full_name,
        preferredName: childInfo?.preferred_name,
        avatarUrl: childInfo?.avatar_url,
      },
      streak: { currentStreak, longestStreak },
      points,
      chartBars,
      parentNote,
      teacherNote,
      items,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. Ambil Checklist Harian Anak
 * GET /api/v1/children/:childId/checklists
 */
router.get(["/:childId/checklists", "/children/:childId/checklists"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    const hasAccess = await checkParentChildAccess(req.user!.id, childId);
    if (!hasAccess) {
      throw new AppError("Akses ditolak ke anak ini.", { status: 403 });
    }

    const progress = await getChildDailyProgress(childId, date);
    res.json({ success: true, ...progress });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. Simpan / Toggle Status Checklist Suatu Aktivitas
 * PUT /api/v1/children/:childId/checklists/:habitItemId
 */
router.put(["/:childId/checklists/:habitItemId", "/children/:childId/checklists/:habitItemId"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId, habitItemId } = req.params;
    const { status, entryDate, note, clientVersion } = req.body;

    const hasAccess = await checkParentChildAccess(req.user!.id, childId);
    if (!hasAccess) {
      throw new AppError("Akses ditolak ke data anak ini.", { status: 403 });
    }

    const targetDate = entryDate || new Date().toISOString().split("T")[0];
    const newStatus = status || "completed"; // completed, not_completed, not_reported
    const now = nowISO();

    const child = await queryOne<{ school_id: string }>(`SELECT school_id FROM children WHERE id = ?`, [childId]);
    if (!child) throw new AppError("Data anak tidak ditemukan.", { status: 404 });

    const existing = await queryOne<{ id: string; version: number; status: string }>(
      `SELECT id, version, status FROM checklist_entries
       WHERE child_id = ? AND habit_item_id = ? AND entry_date = ?`,
      [childId, habitItemId, targetDate]
    );

    // Optimistic Concurrency Check (PRD Bab 10.5 & 14)
    if (existing && clientVersion && existing.version > clientVersion) {
      throw new AppError("Data checklist sudah diperbarui sebelumnya. Muat ulang data terbaru.", {
        status: 409,
        code: "CHECKLIST_VERSION_CONFLICT",
      });
    }

    let nextVersion = (existing?.version || 0) + 1;

    await transaction(async () => {
      if (existing) {
        await execute(
          `UPDATE checklist_entries
           SET status = ?, reported_by = ?, reported_at = ?, version = ?, updated_at = ?
           WHERE id = ?`,
          [newStatus, req.user!.id, now, nextVersion, now, existing.id]
        );
      } else {
        await execute(
          `INSERT INTO checklist_entries (id, school_id, child_id, habit_item_id, entry_date, status, reported_by, reported_at, source, version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'parent', 1, ?, ?)`,
          [`chk-${generateUUID().slice(0, 8)}`, child.school_id, childId, habitItemId, targetDate, newStatus, req.user!.id, now, now, now]
        );
      }

      // Catat ke ledger jika status menjadi completed
      if (newStatus === "completed" && existing?.status !== "completed") {
        await execute(
          `INSERT INTO points_ledger (id, school_id, child_id, points, reason, source_type, created_at)
           VALUES (?, ?, ?, 5, 'Menyelesaikan checklist ibadah', 'checklist', ?)`,
          [`pt-${generateUUID().slice(0, 8)}`, child.school_id, childId, now]
        );
      }
    });

    // Perbarui kalkulasi streak
    await calculateAndSaveStreak(childId);

    await logAudit({
      schoolId: child.school_id,
      actorUserId: req.user!.id,
      action: "checklist.updated",
      entityType: "checklist_entry",
      entityId: habitItemId,
      before: existing ? { status: existing.status } : null,
      after: { status: newStatus, date: targetDate },
      ip: req.ip,
    });

    res.json({
      success: true,
      message: "Checklist berhasil disimpan.",
      habitItemId,
      status: newStatus,
      version: nextVersion,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. Simpan Catatan Harian Orang Tua
 * POST /api/v1/children/:childId/checklists/notes
 */
router.post(["/:childId/checklists/notes", "/children/:childId/checklists/notes"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const { note, entryDate } = req.body;

    const hasAccess = await checkParentChildAccess(req.user!.id, childId);
    if (!hasAccess) {
      throw new AppError("Akses ditolak.", { status: 403 });
    }

    if (!note) throw new AppError("Catatan tidak boleh kosong.", { status: 400 });

    const targetDate = entryDate || new Date().toISOString().split("T")[0];
    const now = nowISO();

    const child = await queryOne<{ school_id: string }>(`SELECT school_id FROM children WHERE id = ?`, [childId]);
    if (!child) throw new AppError("Data anak tidak ditemukan.", { status: 404 });

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM checklist_notes WHERE child_id = ? AND entry_date = ? AND author_role = 'parent'`,
      [childId, targetDate]
    );

    if (existing) {
      await execute(
        `UPDATE checklist_notes SET note = ?, updated_at = ? WHERE id = ?`,
        [note.trim(), now, existing.id]
      );
    } else {
      await execute(
        `INSERT INTO checklist_notes (id, school_id, child_id, entry_date, note, author_id, author_role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'parent', ?, ?)`,
        [`note-${generateUUID().slice(0, 8)}`, child.school_id, childId, targetDate, note.trim(), req.user!.id, now, now]
      );
    }

    res.json({ success: true, message: "Catatan orang tua berhasil disimpan." });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. Ambil Profil Orang Tua
 * GET /api/v1/parent/profile
 */
router.get(["/profile", "/parent/profile"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await queryOne<{
      id: string;
      email: string;
      phone: string | null;
      full_name: string;
      avatar_url: string | null;
    }>(
      `SELECT id, email, phone, full_name, avatar_url FROM users WHERE id = ?`,
      [req.user!.id]
    );

    res.json({ success: true, profile: user });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. Perbarui Profil Orang Tua
 * PUT /api/v1/parent/profile
 */
router.put(["/profile", "/parent/profile"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, phone, avatar_url } = req.body;

    if (!full_name || !String(full_name).trim()) {
      throw new AppError("Nama lengkap tidak boleh kosong.", { status: 400 });
    }

    const now = nowISO();
    await execute(
      `UPDATE users
       SET full_name = ?, phone = ?, avatar_url = ?, updated_at = ?
       WHERE id = ?`,
      [full_name.trim(), phone?.trim() || null, avatar_url !== undefined ? avatar_url : null, now, req.user!.id]
    );

    res.json({
      success: true,
      message: "Profil orang tua berhasil diperbarui.",
      user: {
        id: req.user!.id,
        fullName: full_name.trim(),
        avatarUrl: avatar_url || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. Ganti Kata Sandi Akun Orang Tua
 * PUT /api/v1/parent/change-password
 */
router.put(["/change-password", "/parent/change-password"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError("Kata sandi lama dan baru wajib diisi.", { status: 400 });
    }

    if (new_password.length < 6) {
      throw new AppError("Kata sandi baru minimal 6 karakter.", { status: 400 });
    }

    const user = await queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = ?`,
      [req.user!.id]
    );

    if (!user) throw new AppError("User tidak ditemukan.", { status: 404 });

    const isValid = verifyPassword(current_password, user.password_hash);
    if (!isValid) {
      throw new AppError("Kata sandi saat ini salah.", { status: 400 });
    }

    const newHash = hashPassword(new_password);
    await execute(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, [newHash, nowISO(), req.user!.id]);

    res.json({ success: true, message: "Kata sandi Anda berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
});

/**
 * 9. Laporan Progres Lengkap Anak (untuk Laporan & Analitik Orang Tua)
 * GET /api/v1/children/:childId/reports
 */
router.get(["/:childId/reports", "/children/:childId/reports"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { childId } = req.params;
    const daysCount = Math.min(60, parseInt(req.query.days as string) || 30);

    const hasAccess = await checkParentChildAccess(req.user!.id, childId);
    if (!hasAccess) {
      throw new AppError("Akses ditolak ke data anak ini.", { status: 403 });
    }

    const child = await queryOne<{
      school_id: string;
      full_name: string;
      preferred_name: string;
      avatar_url: string | null;
      class_name: string | null;
      teacher_name: string | null;
    }>(
      `SELECT c.school_id, c.full_name, c.preferred_name, c.avatar_url,
              cl.name as class_name, u_teacher.full_name as teacher_name
       FROM children c
       LEFT JOIN student_class_links scl ON c.id = scl.child_id AND scl.status = 'active'
       LEFT JOIN classes cl ON scl.class_id = cl.id
       LEFT JOIN users u_teacher ON cl.teacher_id = u_teacher.id
       WHERE c.id = ?`,
      [childId]
    );
    if (!child) throw new AppError("Data anak tidak ditemukan.", { status: 404 });

    const habits = await queryAll<{ id: string; name: string; category: string }>(
      `SELECT id, name, category FROM habit_template_items WHERE school_id = ? AND is_active = 1 ORDER BY sort_order ASC`,
      [child.school_id]
    );

    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const days = [];
    const habitStatsMap = new Map<string, { id: string; name: string; category: string; completedCount: number; totalPossible: number }>();
    habits.forEach((h) => {
      habitStatsMap.set(h.id, { id: h.id, name: h.name, category: h.category, completedCount: 0, totalPossible: daysCount });
    });

    let totalCompleted = 0;
    let activeDays = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayLabel = dayNames[d.getDay()];

      const { summary, items } = await getChildDailyProgress(childId, dStr);
      totalCompleted += summary.completedCount;
      if (summary.completedCount > 0) activeDays++;

      items.forEach((it) => {
        if (it.checked && habitStatsMap.has(it.id)) {
          habitStatsMap.get(it.id)!.completedCount++;
        }
      });

      days.push({
        date: dStr,
        dayLabel,
        percentage: summary.percentage,
        completedCount: summary.completedCount,
        totalHabits: summary.totalHabits,
        status: summary.percentage >= 80 ? "complete" : summary.percentage > 0 ? "partial" : "unreported",
      });
    }

    const totalPossible = Math.max(1, daysCount * (habits.length || 1));
    const averageCompliance = Math.round((totalCompleted / totalPossible) * 100);

    const habitBreakdown = Array.from(habitStatsMap.values()).map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      completedCount: h.completedCount,
      percentage: Math.round((h.completedCount / h.totalPossible) * 100),
    }));

    // Ambil riwayat catatan guru & orang tua
    const notesHistory = await queryAll<{ entry_date: string; note: string; author_role: string }>(
      `SELECT entry_date, note, author_role FROM checklist_notes WHERE child_id = ? ORDER BY entry_date DESC LIMIT 10`,
      [childId]
    );

    res.json({
      success: true,
      report: {
        child: {
          id: childId,
          fullName: child.full_name,
          preferredName: child.preferred_name,
          avatarUrl: child.avatar_url,
          className: child.class_name,
          teacherName: child.teacher_name,
        },
        parent: {
          id: req.user!.id,
          fullName: req.user!.fullName,
        },
        daysCount,
        averageCompliance,
        totalCompleted,
        activeDays,
        days,
        habitBreakdown,
        notesHistory,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
