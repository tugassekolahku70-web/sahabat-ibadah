import { Router, Request, Response, NextFunction } from "express";
import { execute, generateUUID, hashPassword, nowISO, queryOne, verifyPassword } from "../db/index.js";
import { authenticate, signToken } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { logAudit } from "../services/audit.js";

const router = Router();

/**
 * 1. Pendaftaran Guru Baru dengan Kode OTP Email
 * POST /api/v1/auth/register-teacher
 */
router.post("/register-teacher", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, email, password, school_name } = req.body;

    if (!full_name || !email || !password) {
      throw new AppError("Nama lengkap, email, dan kata sandi wajib diisi.", { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Periksa apakah email sudah aktif di users
    const existing = await queryOne(`SELECT id FROM users WHERE email = ? AND status = 'active'`, [cleanEmail]);
    if (existing) {
      throw new AppError("Email ini sudah terdaftar dan aktif. Silakan masuk.", { status: 409 });
    }

    // Buat OTP 6-digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // Berlaku 10 menit
    const now = nowISO();
    const hashedPass = hashPassword(password);
    const schoolName = (school_name && String(school_name).trim()) || "Kelas Sahabat Ibadah";

    // Simpan ke email_verifications
    const verificationId = generateUUID();
    await execute(
      `INSERT INTO email_verifications (id, email, otp_code, role, full_name, school_name, password_hash, expires_at, created_at)
       VALUES (?, ?, ?, 'teacher', ?, ?, ?, ?, ?)`,
      [verificationId, cleanEmail, otpCode, full_name.trim(), schoolName, hashedPass, expiresAt, now]
    );

    // Cetak OTP ke console server lokal agar mudah direview dan diuji
    console.log(`\n========================================================`);
    console.log(`[SIMULASI EMAIL OTP GURU]`);
    console.log(`Kepada : ${cleanEmail} (${full_name})`);
    console.log(`Kode OTP: >>> ${otpCode} <<< (Berlaku 10 Menit)`);
    console.log(`========================================================\n`);

    res.status(200).json({
      success: true,
      message: `Kode OTP verifikasi telah dikirim ke ${cleanEmail}. Periksa email (atau console server lokal).`,
      email: cleanEmail,
      // Dikembalikan di respon dev lokal agar penguji bisa langsung memasukkan OTP jika membuka di browser tanpa melihat terminal
      devOtpCode: otpCode,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Verifikasi Kode OTP & Aktivasi Akun Guru
 * POST /api/v1/auth/verify-otp
 */
router.post("/verify-otp", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      throw new AppError("Email dan kode OTP wajib diisi.", { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp_code).trim();

    // Cari verifikasi pending terbaru
    const pending = await queryOne<{
      id: string;
      email: string;
      otp_code: string;
      full_name: string;
      school_name: string;
      password_hash: string;
      expires_at: string;
      verified_at: string | null;
    }>(
      `SELECT * FROM email_verifications
       WHERE email = ? AND verified_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    if (!pending) {
      throw new AppError("Data pendaftaran tidak ditemukan atau sudah pernah diverifikasi. Silakan daftar kembali.", { status: 400 });
    }

    if (new Date(pending.expires_at) < new Date()) {
      throw new AppError("Kode OTP sudah kedaluwarsa. Silakan minta kode baru.", { status: 400 });
    }

    if (pending.otp_code !== cleanOtp) {
      throw new AppError("Kode OTP salah. Silakan periksa kembali kode yang dikirimkan.", { status: 400 });
    }

    const now = nowISO();

    // Tandai verifikasi selesai
    await execute(`UPDATE email_verifications SET verified_at = ? WHERE id = ?`, [now, pending.id]);

    // Buat Sekolah/Tenant MANDIRI untuk guru ini agar data terisolasi 100%
    const schoolId = `sch-${generateUUID().slice(0, 8)}`;
    const schoolCode = `TCH-${Math.floor(1000 + Math.random() * 9000)}`;

    await execute(
      `INSERT INTO schools (id, name, code, timezone, status, created_at, updated_at)
       VALUES (?, ?, ?, 'Asia/Jakarta', 'active', ?, ?)`,
      [schoolId, pending.school_name, schoolCode, now, now]
    );

    // Buat User Guru
    const userId = `user-tch-${generateUUID().slice(0, 8)}`;
    await execute(
      `INSERT INTO users (id, email, password_hash, full_name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      [userId, pending.email, pending.password_hash, pending.full_name, now, now]
    );

    // Buat User Role
    await execute(
      `INSERT INTO user_roles (id, user_id, school_id, role, created_at)
       VALUES (?, ?, ?, 'teacher', ?)`,
      [`role-${generateUUID().slice(0, 8)}`, userId, schoolId, now]
    );

    // Salin 8 template kebiasaan standar ke sekolah guru ini
    const templateId = `tmpl-${generateUUID().slice(0, 8)}`;
    await execute(
      `INSERT INTO habit_templates (id, school_id, name, description, is_default, created_at, updated_at)
       VALUES (?, ?, 'Standar Ibadah', 'Kurikulum pembiasaan kebaikan siswa', 1, ?, ?)`,
      [templateId, schoolId, now, now]
    );

    const standardHabits = [
      { id: `fajr-${schoolId}`, name: "Shalat Subuh", cat: "ibadah_wajib", icon: "Sun", sort: 1 },
      { id: `quran-${schoolId}`, name: "Membaca Al-Qur'an", cat: "ibadah_harian", icon: "BookOpen", sort: 2 },
      { id: `dhuhr-${schoolId}`, name: "Shalat Dzuhur", cat: "ibadah_wajib", icon: "Sun", sort: 3 },
      { id: `asr-${schoolId}`, name: "Shalat Ashar", cat: "ibadah_wajib", icon: "Sun", sort: 4 },
      { id: `maghrib-${schoolId}`, name: "Shalat Maghrib", cat: "ibadah_wajib", icon: "Moon", sort: 5 },
      { id: `isha-${schoolId}`, name: "Shalat Isya", cat: "ibadah_wajib", icon: "Moon", sort: 6 },
      { id: `kindness-${schoolId}`, name: "Kebaikan Hari Ini", cat: "kebiasaan_baik", icon: "Heart", sort: 7, desc: "Membantu orang tua & teman" },
      { id: `dua-${schoolId}`, name: "Doa sebelum tidur", cat: "ibadah_harian", icon: "Star", sort: 8 },
    ];

    for (const h of standardHabits) {
      await execute(
        `INSERT INTO habit_template_items (id, school_id, template_id, category, name, description, icon_key, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [h.id, schoolId, templateId, h.cat, h.name, h.desc || null, h.icon, h.sort, now, now]
      );
    }

    // Buat satu kelas awal untuk guru baru
    const initialClassId = `class-${generateUUID().slice(0, 8)}`;
    await execute(
      `INSERT INTO classes (id, school_id, teacher_id, name, grade_level, academic_year, status, created_at, updated_at)
       VALUES (?, ?, ?, 'Kelas 1', 'Kelas 1 SD', '2025/2026', 'active', ?, ?)`,
      [initialClassId, schoolId, userId, now, now]
    );

    await execute(
      `INSERT INTO teacher_class_links (id, teacher_user_id, class_id, is_homeroom, created_at)
       VALUES (?, ?, ?, 1, ?)`,
      [`tcl-${generateUUID().slice(0, 8)}`, userId, initialClassId, now]
    );

    // Audit log registrasi
    await logAudit({
      schoolId,
      actorUserId: userId,
      action: "teacher.registered",
      entityType: "user",
      entityId: userId,
      after: { email: pending.email, fullName: pending.full_name },
      ip: req.ip,
    });

    const token = signToken({
      userId,
      email: pending.email,
      role: "teacher",
      schoolId,
    });

    res.status(201).json({
      success: true,
      message: "Verifikasi berhasil! Akun guru Anda siap digunakan.",
      token,
      user: {
        id: userId,
        email: pending.email,
        fullName: pending.full_name,
        role: "teacher",
        schoolId,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. Kirim Ulang OTP
 * POST /api/v1/auth/resend-otp
 */
router.post("/resend-otp", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError("Email wajib diisi.", { status: 400 });

    const cleanEmail = String(email).trim().toLowerCase();
    const pending = await queryOne<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM email_verifications WHERE email = ? AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    if (!pending) {
      throw new AppError("Tidak ada permintaan verifikasi pending untuk email ini.", { status: 404 });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await execute(
      `UPDATE email_verifications SET otp_code = ?, expires_at = ? WHERE id = ?`,
      [newOtp, expiresAt, pending.id]
    );

    console.log(`\n[KIRIM ULANG OTP GURU] ${cleanEmail} -> OTP: >>> ${newOtp} <<<\n`);

    res.json({
      success: true,
      message: "Kode OTP baru telah dikirimkan.",
      devOtpCode: newOtp,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. Login (Orang Tua, Guru, Admin)
 * POST /api/v1/auth/login
 */
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      throw new AppError("Email/nomor telepon dan kata sandi wajib diisi.", { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const targetRole = role || "parent";

    // Cari user berdasarkan email atau no telepon
    const user = await queryOne<{
      id: string;
      email: string;
      phone: string;
      password_hash: string;
      full_name: string;
      status: string;
      role: "parent" | "teacher" | "admin" | "superadmin";
      school_id: string;
    }>(
      `SELECT u.id, u.email, u.phone, u.password_hash, u.full_name, u.status, r.role, r.school_id
       FROM users u
       JOIN user_roles r ON u.id = r.user_id
       WHERE (LOWER(u.email) = ? OR u.phone = ?) AND r.role = ?`,
      [cleanEmail, cleanEmail, targetRole]
    );

    if (!user || user.status !== "active") {
      throw new AppError("Kredensial tidak valid atau akun tidak ditemukan untuk peran ini.", { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError("Kredensial tidak valid. Silakan periksa kembali kata sandi Anda.", { status: 401 });
    }

    // Update last_login_at
    await execute(`UPDATE users SET last_login_at = ? WHERE id = ?`, [nowISO(), user.id]);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id,
    });

    await logAudit({
      schoolId: user.school_id,
      actorUserId: user.id,
      action: "user.login",
      entityType: "session",
      ip: req.ip,
    });

    res.json({
      success: true,
      message: "Login berhasil.",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        schoolId: user.school_id,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. Logout
 * POST /api/v1/auth/logout
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.json({ success: true, message: "Berhasil keluar dari akun." });
});

/**
 * 6. Get Current Authenticated User
 * GET /api/v1/auth/me
 */
router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({ success: true, user: req.user });
});

export default router;
