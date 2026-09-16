import { Router, Request, Response, NextFunction } from "express";
import { queryAll, queryOne } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

/**
 * Konfigurasi Sekolah
 * GET /api/v1/admin/school
 */
router.get("/school", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const school = await queryOne(
      `SELECT id, name, code, timezone, status, created_at FROM schools WHERE id = ?`,
      [req.user!.schoolId]
    );
    res.json({ success: true, school });
  } catch (err) {
    next(err);
  }
});

/**
 * Rekam Jejak Audit (Audit Logs)
 * GET /api/v1/admin/audit-logs
 */
router.get("/audit-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await queryAll(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.before_json, a.after_json, a.created_at,
              u.full_name as actor_name, u.email as actor_email
       FROM audit_logs a
       LEFT JOIN users u ON a.actor_user_id = u.id
       WHERE a.school_id = ?
       ORDER BY a.created_at DESC LIMIT 50`,
      [req.user!.schoolId]
    );
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

export default router;
