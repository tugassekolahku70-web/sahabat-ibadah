import crypto from "node:crypto";
import { execute, generateUUID, nowISO } from "../db/index.js";

export async function logAudit(options: {
  schoolId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: any;
  after?: any;
  ip?: string;
}) {
  try {
    const id = generateUUID();
    const now = nowISO();
    const ipHash = options.ip
      ? crypto.createHash("sha256").update(options.ip).digest("hex").slice(0, 16)
      : null;

    await execute(
      `INSERT INTO audit_logs (id, school_id, actor_user_id, action, entity_type, entity_id, before_json, after_json, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        options.schoolId || null,
        options.actorUserId || null,
        options.action,
        options.entityType,
        options.entityId || null,
        options.before ? JSON.stringify(options.before) : null,
        options.after ? JSON.stringify(options.after) : null,
        ipHash,
        now,
      ]
    );
  } catch (err) {
    console.error("Gagal mencatat audit log:", err);
  }
}
