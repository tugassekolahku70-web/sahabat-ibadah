import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("\n========================================================");
  console.log("🚀 PUSH DATA 50 SISWA & CHECKLIST LANGSUNG KE SUPABASE");
  console.log("========================================================\n");

  // Ambil connection string dari argument CLI atau .env
  let connectionString = process.argv[2] || process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim().length === 0) {
    console.error("❌ ERROR: Alamat URI Supabase belum diberikan!");
    console.log("\nCara Penggunaan:");
    console.log('npx tsx server/db/push_to_supabase.ts "URI_SUPABASE_ANDA"\n');
    console.log("Contoh:");
    console.log('npx tsx server/db/push_to_supabase.ts "postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"\n');
    process.exit(1);
  }

  connectionString = connectionString.trim();

  // Bersihkan parameter sslmode jika ada
  let cleanUrl = connectionString;
  try {
    const parsed = new URL(cleanUrl);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("ssl");
    cleanUrl = parsed.toString();
  } catch {
    cleanUrl = cleanUrl.replace(/[?&]sslmode=[^&]+/g, "").replace(/[?&]ssl=[^&]+/g, "");
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  console.log("⏳ Sedang menghubungkan ke Supabase PostgreSQL...");

  const pool = new pg.Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Terhubung ke database Supabase!");

    const sqlPath = path.resolve(__dirname, "supabase_seed_50_students.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File ${sqlPath} tidak ditemukan!`);
    }

    console.log("🧹 Membersihkan tabel dan data lama di Supabase agar tidak terjadi bentrok kunci unik...");
    await client.query(`
      DROP TABLE IF EXISTS checklist_notes, streak_snapshots, points_ledger, checklist_entries,
        parent_child_links, teacher_class_links, student_class_links,
        children, habit_template_items, habit_templates, classes,
        email_verifications, user_roles, users, schools, audit_logs CASCADE;
    `);

    console.log("⏳ Sedang memasukkan skema baru, 50 siswa, 50 akun orang tua, & 19.200 checklist...");
    const fullSql = fs.readFileSync(sqlPath, "utf-8");

    const startTime = Date.now();
    await client.query(fullSql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n========================================================");
    console.log(`🎉 SUKSES BESAR! Data berhasil masuk dalam ${duration} detik!`);
    console.log("========================================================");
    console.log("✅ Skema seluruh tabel berhasil dibuat");
    console.log("✅ 50 Siswa (Kelas 1A & Kelas 2A) terdaftar");
    console.log("✅ 50 Akun Orang Tua aktif");
    console.log("✅ Ribuan entri ceklis ibadah (4 Ags - 17 Sept 2026) tersimpan");
    console.log("✅ Poin dan streak santri telah disinkronkan");
    console.log("========================================================\n");

    client.release();
    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ GAGAL memasukkan data ke Supabase:", err.message);
    if (err.message?.includes("password authentication failed")) {
      console.error("👉 Kata sandi database pada URI salah. Pastikan password Supabase Anda benar.");
    }
    await pool.end();
    process.exit(1);
  }
}

main();
