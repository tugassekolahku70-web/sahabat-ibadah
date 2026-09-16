import { Router, Request, Response, NextFunction } from "express";
import { execute, generateUUID, nowISO, queryAll, queryOne } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";

const router = Router();
router.use(authenticate);

/**
 * 1. Ambil daftar thread percakapan untuk guru berdasarkan kelas aktif
 * GET /api/v1/messages/teacher/threads?classId=...
 */
router.get(["/teacher/threads", "/threads/teacher"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.query.classId as string;
    if (!classId) {
      return res.json({ success: true, threads: [] });
    }

    // Ambil siswa dalam kelas ini
    const students = await queryAll<{
      id: string;
      full_name: string;
      preferred_name: string;
      avatar_url: string | null;
      parent_id: string | null;
      parent_name: string | null;
      parent_email: string | null;
    }>(
      `SELECT c.id, c.full_name, c.preferred_name, c.avatar_url,
              u.id as parent_id, u.full_name as parent_name, u.email as parent_email
       FROM children c
       JOIN student_class_links scl ON c.id = scl.child_id
       LEFT JOIN parent_child_links pcl ON c.id = pcl.child_id
       LEFT JOIN users u ON pcl.parent_user_id = u.id
       WHERE scl.class_id = ? AND c.status = 'active'
       ORDER BY c.full_name ASC`,
      [classId]
    );

    const threads = [];
    const now = nowISO();

    for (const s of students) {
      // Cari atau buat thread percakapan per siswa
      let thread = await queryOne<{ id: string; updated_at: string }>(
        `SELECT id, updated_at FROM message_threads WHERE school_id = ? AND child_id = ? LIMIT 1`,
        [req.user!.schoolId, s.id]
      );

      if (!thread) {
        const newThreadId = `thread-${generateUUID().slice(0, 8)}`;
        await execute(
          `INSERT INTO message_threads (id, school_id, child_id, created_by, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'open', ?, ?)`,
          [newThreadId, req.user!.schoolId, s.id, req.user!.id, now, now]
        );
        thread = { id: newThreadId, updated_at: now };
      }

      // Ambil pesan terakhir
      const lastMsg = await queryOne<{ body: string; sent_at: string; sender_id: string }>(
        `SELECT body, sent_at, sender_id FROM messages WHERE thread_id = ? ORDER BY sent_at DESC LIMIT 1`,
        [thread.id]
      );

      threads.push({
        threadId: thread.id,
        childId: s.id,
        childName: s.full_name,
        childPreferredName: s.preferred_name || s.full_name.split(" ")[0],
        childAvatarUrl: s.avatar_url,
        parentId: s.parent_id,
        parentName: s.parent_name || "Orang Tua Belum Terdaftar",
        parentEmail: s.parent_email,
        lastMessage: lastMsg?.body || "Belum ada percakapan. Mulai kirim sapaan.",
        lastSentAt: lastMsg?.sent_at || thread.updated_at,
        unreadCount: 0,
      });
    }

    res.json({
      success: true,
      teacherAvatarUrl: req.user!.avatarUrl || null,
      threads,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Ambil thread dan riwayat pesan anak (untuk Orang Tua atau pencarian spesifik)
 * GET /api/v1/messages/threads?childId=...
 */
router.get(["/threads", "/"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const childId = req.query.childId as string;

    let thread = await queryOne<{ id: string }>(
      `SELECT id FROM message_threads WHERE school_id = ? ${childId ? "AND child_id = ?" : ""} ORDER BY updated_at DESC LIMIT 1`,
      childId ? [req.user!.schoolId, childId] : [req.user!.schoolId]
    );

    if (!thread && childId) {
      const newThreadId = `thread-${generateUUID().slice(0, 8)}`;
      const now = nowISO();
      await execute(
        `INSERT INTO message_threads (id, school_id, child_id, created_by, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'open', ?, ?)`,
        [newThreadId, req.user!.schoolId, childId, req.user!.id, now, now]
      );
      thread = { id: newThreadId };
    }

    if (!thread) {
      return res.json({ success: true, messages: [] });
    }

    // Ambil info guru kelas untuk anak ini agar foto & nama guru tampil di percakapan
    let teacherInfo: { id: string; name: string; avatarUrl: string | null; className: string; schoolName: string } | null = null;
    if (childId) {
      const tRow = await queryOne<{
        teacher_id: string;
        teacher_name: string;
        teacher_avatar_url: string | null;
        class_name: string;
        school_name: string;
      }>(
        `SELECT u.id as teacher_id, u.full_name as teacher_name, u.avatar_url as teacher_avatar_url,
                cl.name as class_name, s.name as school_name
         FROM student_class_links scl
         JOIN classes cl ON scl.class_id = cl.id
         JOIN users u ON cl.teacher_id = u.id
         JOIN schools s ON cl.school_id = s.id
         WHERE scl.child_id = ? AND scl.status = 'active'
         LIMIT 1`,
        [childId]
      );
      if (tRow) {
        teacherInfo = {
          id: tRow.teacher_id,
          name: tRow.teacher_name,
          avatarUrl: tRow.teacher_avatar_url,
          className: tRow.class_name,
          schoolName: tRow.school_name,
        };
      }
    }

    const messages = await queryAll(
      `SELECT m.id, m.body, m.sent_at, m.sender_id, u.full_name as sender_name,
              u.avatar_url as sender_avatar,
              CASE WHEN m.sender_id = ? THEN 1 ELSE 0 END as is_self
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.thread_id = ?
       ORDER BY m.sent_at ASC`,
      [req.user!.id, thread.id]
    );

    res.json({
      success: true,
      threadId: thread.id,
      teacher: teacherInfo,
      messages,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. Ambil pesan spesifik per thread ID
 * GET /api/v1/messages/threads/:threadId
 */
router.get(["/threads/:threadId", "/threads/:threadId/messages"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threadId } = req.params;

    const messages = await queryAll(
      `SELECT m.id, m.body, m.sent_at, m.sender_id, u.full_name as sender_name,
              u.avatar_url as sender_avatar,
              CASE WHEN m.sender_id = ? THEN 1 ELSE 0 END as is_self
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.thread_id = ?
       ORDER BY m.sent_at ASC`,
      [req.user!.id, threadId]
    );

    res.json({ success: true, threadId, messages });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. Kirim pesan ke thread
 * POST /api/v1/messages/threads/:threadId
 */
router.post("/threads/:threadId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threadId } = req.params;
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      throw new AppError("Isi pesan tidak boleh kosong.", { status: 400 });
    }

    const now = nowISO();
    const msgId = `msg-${generateUUID().slice(0, 8)}`;

    await execute(
      `INSERT INTO messages (id, thread_id, sender_id, body, sent_at)
       VALUES (?, ?, ?, ?, ?)`,
      [msgId, threadId, req.user!.id, String(body).trim(), now]
    );

    await execute(`UPDATE message_threads SET updated_at = ? WHERE id = ?`, [now, threadId]);

    res.status(201).json({
      success: true,
      message: {
        id: msgId,
        body: String(body).trim(),
        sent_at: now,
        sender_id: req.user!.id,
        sender_name: req.user!.fullName,
        sender_avatar: req.user!.avatarUrl || null,
        is_self: 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
