import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lokasi konsisten untuk database SQLite lokal dan skema SQL baik di dev (tsx) maupun build (dist/index.js)
const cwd = process.cwd();
const DATA_DIR = fs.existsSync(path.resolve(cwd, "server", "data"))
  ? path.resolve(cwd, "server", "data")
  : fs.existsSync(path.resolve(__dirname, "..", "server", "data"))
    ? path.resolve(__dirname, "..", "server", "data")
    : path.resolve(__dirname, "..", "data");

const DB_PATH = path.resolve(DATA_DIR, "sahabat_ibadah.db");

const SCHEMA_PATH = fs.existsSync(path.resolve(cwd, "server", "db", "schema.sql"))
  ? path.resolve(cwd, "server", "db", "schema.sql")
  : fs.existsSync(path.resolve(__dirname, "..", "server", "db", "schema.sql"))
    ? path.resolve(__dirname, "..", "server", "db", "schema.sql")
    : path.resolve(__dirname, "schema.sql");


// Deteksi apakah menggunakan Supabase PostgreSQL atau SQLite Lokal
export const isPostgres = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

// Pool PostgreSQL untuk Supabase / Cloud
let pgPool: pg.Pool | null = null;
// SQLite DatabaseSync untuk Offline / Development Lokal
let sqliteDb: DatabaseSync | null = null;

// AsyncLocalStorage untuk mendukung transaksi terisolasi per-request pada PostgreSQL
const txStorage = new AsyncLocalStorage<pg.PoolClient>();

if (isPostgres) {
  console.log("🐘 Menggunakan Supabase PostgreSQL sebagai database cloud.");
  
  // Izinkan sertifikat SSL Supabase Pooler tanpa error self-signed certificate
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  let cleanUrl = (process.env.DATABASE_URL || "").trim();
  try {
    const parsed = new URL(cleanUrl);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("ssl");
    cleanUrl = parsed.toString();
  } catch {
    cleanUrl = cleanUrl.replace(/[?&]sslmode=[^&]+/g, "").replace(/[?&]ssl=[^&]+/g, "");
  }

  pgPool = new pg.Pool({
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pgPool.on("error", (err) => {
    console.error("Supabase PostgreSQL Pool error:", err);
  });
} else {
  // Mode offline / development lokal menggunakan SQLite
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  sqliteDb = new DatabaseSync(DB_PATH);
  sqliteDb.exec("PRAGMA foreign_keys = ON;");
  sqliteDb.exec("PRAGMA journal_mode = WAL;");
}

/**
 * Konversi placeholder '?' ala SQLite ke '$1, $2, ...' ala PostgreSQL
 */
function toPgSql(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Inisialisasi skema tabel jika menggunakan SQLite lokal
 */
export function initSchema() {
  if (isPostgres) {
    // Pada Supabase PostgreSQL, skema tabel dijalankan melalui Supabase SQL Editor
    return;
  }

  if (sqliteDb && fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
    sqliteDb.exec(schemaSql);

    // Auto-migration kolom baru pada SQLite lokal
    try {
      const schoolColumns = (sqliteDb.prepare("PRAGMA table_info(schools)").all() as any[]).map((c) => c.name);
      if (!schoolColumns.includes("logo_url")) {
        sqliteDb.exec("ALTER TABLE schools ADD COLUMN logo_url TEXT;");
      }
    } catch (e) {
      console.error("Migration schools logo_url error:", e);
    }

    try {
      const childrenColumns = (sqliteDb.prepare("PRAGMA table_info(children)").all() as any[]).map((c) => c.name);
      if (!childrenColumns.includes("avatar_url")) {
        sqliteDb.exec("ALTER TABLE children ADD COLUMN avatar_url TEXT;");
      }
    } catch (e) {
      console.error("Migration children avatar_url error:", e);
    }
  }
}

// Jalankan initSchema untuk SQLite
initSchema();

// =============================================================================
// Helper Utilitas Kriptografi & Waktu
// =============================================================================

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(computedHash, "hex")
    );
  } catch {
    return false;
  }
}

// =============================================================================
// Query Helpers (Dukungan Ganda SQLite Lokal & Supabase PostgreSQL)
// =============================================================================

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    const activeClient = txStorage.getStore();
    const runner = activeClient || pgPool;
    const pgSql = toPgSql(sql);
    const result = await runner.query(pgSql, params);
    return result.rows as T[];
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }

  return [];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (isPostgres && pgPool) {
    const activeClient = txStorage.getStore();
    const runner = activeClient || pgPool;
    const pgSql = toPgSql(sql);
    const result = await runner.query(pgSql, params);
    return (result.rows[0] as T) || null;
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const result = stmt.get(...params);
    return (result as T) || null;
  }

  return null;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<{ changes: number | bigint; lastInsertRowid: number | bigint }> {
  if (isPostgres && pgPool) {
    const activeClient = txStorage.getStore();
    const runner = activeClient || pgPool;
    const pgSql = toPgSql(sql);
    const result = await runner.query(pgSql, params);
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: 0,
    };
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.run(...params);
  }

  return { changes: 0, lastInsertRowid: 0 };
}

export async function transaction<T>(callback: () => Promise<T> | T): Promise<T> {
  if (isPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const result = await txStorage.run(client, async () => {
        return await callback();
      });
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (sqliteDb) {
    sqliteDb.exec("BEGIN TRANSACTION;");
    try {
      const result = await callback();
      sqliteDb.exec("COMMIT;");
      return result;
    } catch (error) {
      sqliteDb.exec("ROLLBACK;");
      throw error;
    }
  }

  return await callback();
}

export const db = sqliteDb;
export { pgPool };
export default { db: sqliteDb, pgPool, isPostgres, queryAll, queryOne, execute, transaction };
