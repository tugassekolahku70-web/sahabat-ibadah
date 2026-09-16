import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { queryOne } from "../db/index.js";
import { AppError } from "./error.js";

const JWT_SECRET = process.env.JWT_SECRET || "sahabat-ibadah-secure-secret-key-2026";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: "parent" | "teacher" | "admin" | "superadmin";
  schoolId: string;
  avatarUrl?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Buat auth token sederhana bertanda tangan HMAC-SHA256
 */
export function signToken(payload: { userId: string; email: string; role: string; schoolId: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 hari
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

/**
 * Verifikasi auth token
 */
export function verifyToken(token: string): { userId: string; email: string; role: string; schoolId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${data}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware autentikasi
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/app_session_id=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return next(new AppError("Silakan masuk terlebih dahulu.", { status: 401, code: "UNAUTHORIZED" }));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new AppError("Sesi telah kedaluwarsa atau tidak valid. Silakan masuk kembali.", { status: 401, code: "INVALID_TOKEN" }));
    }

    // Validasi user di database
    const user = await queryOne<{
      id: string;
      email: string;
      full_name: string;
      avatar_url: string | null;
      status: string;
      role: "parent" | "teacher" | "admin" | "superadmin";
      school_id: string;
    }>(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.status, r.role, r.school_id
       FROM users u
       JOIN user_roles r ON u.id = r.user_id
       WHERE u.id = ? AND r.role = ? AND u.status = 'active'`,
      [payload.userId, payload.role]
    );

    if (!user) {
      return next(new AppError("Akun tidak ditemukan atau tidak aktif.", { status: 401, code: "USER_INACTIVE" }));
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      schoolId: user.school_id,
      avatarUrl: user.avatar_url || null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware otorisasi berdasarkan peran (RBAC)
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Akses ditolak. Belum terautentikasi.", { status: 401, code: "UNAUTHORIZED" }));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Anda tidak memiliki izin untuk mengakses resource ini.", { status: 403, code: "FORBIDDEN" }));
    }
    next();
  };
}

/**
 * Middleware proteksi isolasi data guru: memastikan kelas atau siswa benar-benar milik guru yang login
 */
export async function checkTeacherClassOwnership(teacherId: string, classId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT id FROM classes WHERE id = ? AND teacher_id = ?`,
    [classId, teacherId]
  );
  return Boolean(row);
}

export async function checkTeacherStudentOwnership(teacherId: string, studentId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT c.id FROM children c
     JOIN student_class_links scl ON c.id = scl.child_id
     JOIN classes cl ON scl.class_id = cl.id
     WHERE c.id = ? AND cl.teacher_id = ?`,
    [studentId, teacherId]
  );
  return Boolean(row);
}

