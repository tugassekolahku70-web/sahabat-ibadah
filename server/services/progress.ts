import { execute, generateUUID, nowISO, queryAll, queryOne } from "../db/index.js";

export interface DailySummary {
  date: string;
  totalHabits: number;
  completedCount: number;
  notCompletedCount: number;
  notReportedCount: number;
  percentage: number;
}

export interface HabitProgressDetail {
  id: string;
  label: string;
  category: string;
  iconKey: string;
  sortOrder: number;
  status: "completed" | "not_completed" | "not_reported";
  checked: boolean;
  note?: string;
  version: number;
}

/**
 * Menghitung progres harian seorang anak pada tanggal tertentu
 */
export async function getChildDailyProgress(childId: string, date: string): Promise<{
  summary: DailySummary;
  items: HabitProgressDetail[];
  parentNote?: string;
  teacherNote?: string;
}> {
  // Ambil school_id anak
  const child = await queryOne<{ school_id: string }>(
    `SELECT school_id FROM children WHERE id = ?`,
    [childId]
  );
  const schoolId = child?.school_id || "";

  // Ambil semua habit item aktif
  const habits = await queryAll<{
    id: string;
    name: string;
    category: string;
    icon_key: string;
    sort_order: number;
  }>(
    `SELECT id, name, category, icon_key, sort_order
     FROM habit_template_items
     WHERE school_id = ? AND is_active = 1
     ORDER BY sort_order ASC`,
    [schoolId]
  );

  // Ambil entri checklist pada tanggal tersebut
  const entries = await queryAll<{
    habit_item_id: string;
    status: "completed" | "not_completed" | "not_reported";
    version: number;
  }>(
    `SELECT habit_item_id, status, version
     FROM checklist_entries
     WHERE child_id = ? AND entry_date = ?`,
    [childId, date]
  );

  const entryMap = new Map(entries.map((e) => [e.habit_item_id, e]));

  // Ambil catatan harian
  const notes = await queryAll<{ note: string; author_role: string }>(
    `SELECT note, author_role FROM checklist_notes WHERE child_id = ? AND entry_date = ?`,
    [childId, date]
  );
  const parentNote = notes.find((n) => n.author_role === "parent")?.note;
  const teacherNote = notes.find((n) => n.author_role === "teacher")?.note;

  let completedCount = 0;
  let notCompletedCount = 0;
  let notReportedCount = 0;

  const items: HabitProgressDetail[] = habits.map((h) => {
    const entry = entryMap.get(h.id);
    const status = entry ? entry.status : "not_reported";
    if (status === "completed") completedCount++;
    else if (status === "not_completed") notCompletedCount++;
    else notReportedCount++;

    return {
      id: h.id,
      label: h.name,
      category: h.category === "ibadah_wajib" ? "Ibadah wajib" : h.category === "ibadah_harian" ? "Ibadah harian" : "Kebiasaan baik",
      iconKey: h.icon_key || "Sun",
      sortOrder: h.sort_order,
      status,
      checked: status === "completed",
      version: entry?.version || 1,
    };
  });

  const totalHabits = habits.length;
  const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return {
    summary: {
      date,
      totalHabits,
      completedCount,
      notCompletedCount,
      notReportedCount,
      percentage,
    },
    items,
    parentNote,
    teacherNote,
  };
}

/**
 * Menghitung streak dan snapshot konsistensi anak
 */
export async function calculateAndSaveStreak(childId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  // Ambil school_id anak untuk tahu habit aktif
  const child = await queryOne<{ school_id: string }>(
    `SELECT school_id FROM children WHERE id = ?`,
    [childId]
  );
  const schoolId = child?.school_id || "";

  const habitCountRes = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM habit_template_items WHERE school_id = ? AND is_active = 1`,
    [schoolId]
  );
  const totalHabits = Number(habitCountRes?.total || 0);

  if (totalHabits === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Ambil data checklist yang selesai 60 hari terakhir dalam 1 query agregasi cepat
  const d60 = new Date();
  d60.setDate(d60.getDate() - 60);
  const startDateStr = d60.toISOString().split("T")[0];

  const completedRows = await queryAll<{ entry_date: string; completed_count: number }>(
    `SELECT entry_date, COUNT(*) as completed_count
     FROM checklist_entries
     WHERE child_id = ? AND entry_date >= ? AND status = 'completed'
     GROUP BY entry_date`,
    [childId, startDateStr]
  );

  const completedMap = new Map<string, number>();
  for (const row of completedRows) {
    completedMap.set(row.entry_date, Number(row.completed_count));
  }

  let streak = 0;
  let maxStreak = 0;

  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const completed = completedMap.get(dateStr) || 0;
    const percentage = Math.round((completed / totalHabits) * 100);

    // Jika hari ini belum selesai (i === 0), tidak memutus streak hari sebelumnya bila belum mencapai 75%
    if (i === 0 && percentage < 75) {
      continue;
    }

    if (percentage >= 75) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      break;
    }
  }

  const existing = await queryOne<{ id: string; longest_streak: number }>(
    `SELECT id, longest_streak FROM streak_snapshots WHERE child_id = ?`,
    [childId]
  );

  const longestStreak = Math.max(streak, existing?.longest_streak || 0);
  const now = nowISO();
  const today = new Date().toISOString().split("T")[0];

  if (existing) {
    await execute(
      `UPDATE streak_snapshots
       SET current_streak = ?, longest_streak = ?, last_calculated_date = ?, updated_at = ?
       WHERE child_id = ?`,
      [streak, longestStreak, today, now, childId]
    );
  } else {
    await execute(
      `INSERT INTO streak_snapshots (id, child_id, current_streak, longest_streak, last_calculated_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generateUUID(), childId, streak, longestStreak, today, now]
    );
  }

  return { currentStreak: streak, longestStreak };
}

/**
 * Mengambil total poin anak dari ledger
 */
export async function getChildPoints(childId: string): Promise<number> {
  const result = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(points), 0) as total FROM points_ledger WHERE child_id = ?`,
    [childId]
  );
  return result?.total || 0;
}
