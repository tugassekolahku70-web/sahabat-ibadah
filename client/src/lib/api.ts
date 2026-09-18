/**
 * Sahabat Ibadah - Frontend API Client
 * Berkomunikasi dengan Express Backend API (/api/v1)
 */

const TOKEN_KEY = "sahabat_ibadah_token";
const USER_KEY = "sahabat_ibadah_user";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: "parent" | "teacher" | "admin";
  schoolId: string;
  avatarUrl?: string | null;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): UserSession | null {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserSession) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Terjadi kesalahan (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  dates: string[];
  classWeeklyAverage: number;
  weeklyComplianceRate: number;
  totalCompletedActivities: number;
  habitBreakdown: Array<{
    id: string;
    name: string;
    category: string;
    completedCount: number;
    percentage: number;
  }>;
  studentMatrix: Array<{
    id: string;
    name: string;
    preferredName: string;
    avatarUrl: string | null;
    days: Array<{
      date: string;
      dayLabel: string;
      percentage: number;
      completedCount: number;
      totalHabits: number;
      status: "complete" | "partial" | "unreported";
    }>;
    weeklyAverage: number;
    activeDays: number;
  }>;
  topStudents: Array<{
    rank: number;
    name: string;
    average: number;
    avatarUrl: string | null;
  }>;
}

export interface TeacherChatThread {
  threadId: string;
  childId: string;
  childName: string;
  childPreferredName: string;
  childAvatarUrl: string | null;
  classId?: string;
  className?: string;
  parentId: string | null;
  parentName: string;
  parentEmail: string | null;
  lastMessage: string;
  lastSentAt: string;
  hasNewMessage?: boolean;
  unreadCount: number;
}

export const api = {
  // ===========================================================================
  // Autentikasi & Registrasi Guru (OTP)
  // ===========================================================================
  auth: {
    login: async (email: string, password: string, role: "parent" | "teacher") => {
      const res = await request<{
        success: boolean;
        token: string;
        user: UserSession;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });
      if (res.token) setStoredToken(res.token);
      if (res.user) setStoredUser(res.user);
      return res;
    },

    registerTeacher: (data: {
      full_name: string;
      email: string;
      password: string;
      school_name?: string;
    }) => {
      return request<{
        success: boolean;
        message: string;
        email: string;
        devOtpCode?: string;
      }>("/auth/register-teacher", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    verifyOtp: async (email: string, otp_code: string) => {
      const res = await request<{
        success: boolean;
        token: string;
        user: UserSession;
        message: string;
      }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp_code }),
      });
      if (res.token) setStoredToken(res.token);
      if (res.user) setStoredUser(res.user);
      return res;
    },

    resendOtp: (email: string) => {
      return request<{ success: boolean; message: string; devOtpCode?: string }>("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    logout: async () => {
      try {
        await request("/auth/logout", { method: "POST" });
      } finally {
        clearStoredSession();
      }
    },

    getMe: () => request<{ success: boolean; user: UserSession }>("/auth/me"),
  },

  // ===========================================================================
  // Fitur Guru (Profil, Sekolah, Kelas, Siswa, Laporan & Akun Ortu)
  // ===========================================================================
  teacher: {
    getProfile: () =>
      request<{
        success: boolean;
        profile: {
          id: string;
          email: string;
          phone: string;
          full_name: string;
          avatar_url: string | null;
          school_id: string;
          school_name: string;
          school_logo_url: string | null;
        };
      }>("/teacher/profile"),

    updateProfile: (data: {
      full_name: string;
      email?: string;
      phone?: string;
      school_name?: string;
      school_logo_url?: string | null;
      avatar_url?: string | null;
    }) =>
      request<{ success: boolean; message: string; email?: string }>("/teacher/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    changePassword: (data: { current_password: string; new_password: string }) =>
      request<{ success: boolean; message: string }>("/teacher/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    getClasses: () =>
      request<{
        success: boolean;
        classes: Array<{
          id: string;
          name: string;
          grade_level: string;
          academic_year: string;
          status: string;
          student_count: number;
        }>;
      }>("/teacher/classes"),

    addClass: (data: { name: string; grade_level?: string; academic_year?: string }) =>
      request<{ success: boolean; message: string; classId: string }>("/teacher/classes", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateClass: (classId: string, data: { name: string; grade_level?: string; academic_year?: string }) =>
      request<{ success: boolean; message: string }>(`/teacher/classes/${classId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteClass: (classId: string) =>
      request<{ success: boolean; message: string }>(`/teacher/classes/${classId}`, {
        method: "DELETE",
      }),

    getStudents: (classId: string) =>
      request<{
        success: boolean;
        students: Array<{
          id: string;
          full_name: string;
          preferred_name: string;
          grade_level: string;
          avatar_url: string | null;
          status: string;
          hasParentAccount: boolean;
          parent_user_id: string | null;
          parent_name: string | null;
          parent_email: string | null;
          parent_phone: string | null;
          todayProgress: number;
          completedCount: number;
          totalHabits: number;
          statusLabel: string;
        }>;
      }>(`/classes/${classId}/students`),

    addStudent: (
      classId: string,
      data: {
        full_name: string;
        preferred_name?: string;
        grade_level?: string;
        avatar_url?: string | null;
        parent_name?: string;
        parent_email?: string;
        parent_password?: string;
      }
    ) =>
      request<{ success: boolean; message: string; studentId: string }>(`/classes/${classId}/students`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateStudent: (
      studentId: string,
      data: {
        full_name: string;
        preferred_name?: string;
        grade_level?: string;
        avatar_url?: string | null;
      }
    ) =>
      request<{ success: boolean; message: string }>(`/teacher/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteStudent: (studentId: string) =>
      request<{ success: boolean; message: string }>(`/teacher/students/${studentId}`, {
        method: "DELETE",
      }),

    createParentAccount: (
      studentId: string,
      data: {
        parent_name: string;
        parent_email: string;
        password: string;
        phone?: string;
        relationship?: string;
      }
    ) =>
      request<{
        success: boolean;
        message: string;
        parent: { id: string; email: string; fullName: string };
      }>(`/teacher/students/${studentId}/parent-account`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    resetParentPassword: (studentId: string, new_password: string) =>
      request<{ success: boolean; message: string }>(`/teacher/students/${studentId}/reset-parent-password`, {
        method: "POST",
        body: JSON.stringify({ new_password }),
      }),

    getWeeklyReport: (classId: string, startDate?: string) =>
      request<{ success: boolean; report: WeeklyReportData }>(
        `/classes/${classId}/weekly-report${startDate ? `?startDate=${startDate}` : ""}`
      ),

    getClassSummary: (classId: string) =>
      request<{
        success: boolean;
        summary: {
          totalStudents: number;
          averageClassRate: number;
          complianceRate: number;
          reportedCount: number;
          unreportedCount: number;
          topStudents: Array<{ rank: number; name: string; rate: number; initials: string; avatarUrl?: string | null }>;
        };
      }>(`/classes/${classId}/summary`),

    getAttentionList: (classId: string) =>
      request<{
        success: boolean;
        attentionList: Array<{
          id: string;
          name: string;
          avatarUrl?: string | null;
          reason: string;
          status: string;
        }>;
      }>(`/classes/${classId}/students/attention`),

    sendNote: (childId: string, note: string) =>
      request<{ success: boolean; message: string }>(`/children/${childId}/teacher-notes`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),

    // Pendaftaran Siswa & Orang Tua Masal
    bulkCreateStudents: (
      classId: string,
      students: Array<{
        full_name: string;
        preferred_name?: string;
        grade_level?: string;
        parent_name?: string;
        parent_email?: string;
        parent_phone?: string;
        parent_password?: string;
      }>
    ) =>
      request<{ success: boolean; message: string; count: number; students: any[] }>(
        `/classes/${classId}/students/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ students }),
        }
      ),

    // Manajemen Butir Kebiasaan & Ibadah
    getHabits: () =>
      request<{
        success: boolean;
        habits: Array<{
          id: string;
          name: string;
          category: "ibadah_wajib" | "ibadah_harian" | "kebiasaan_baik";
          description: string | null;
          icon_key: string;
          sort_order: number;
          is_active: number;
          created_at: string;
          updated_at: string;
        }>;
      }>("/teacher/habits"),

    createHabit: (data: {
      name: string;
      category: "ibadah_wajib" | "ibadah_harian" | "kebiasaan_baik";
      description?: string;
      icon_key?: string;
      sort_order?: number;
    }) =>
      request<{ success: boolean; message: string; habit: any }>("/teacher/habits", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateHabit: (
      habitId: string,
      data: {
        name: string;
        category?: "ibadah_wajib" | "ibadah_harian" | "kebiasaan_baik";
        description?: string | null;
        icon_key?: string;
        sort_order?: number;
      }
    ) =>
      request<{ success: boolean; message: string }>(`/teacher/habits/${habitId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteHabit: (habitId: string) =>
      request<{ success: boolean; message: string }>(`/teacher/habits/${habitId}`, {
        method: "DELETE",
      }),
  },

  // ===========================================================================
  // Fitur Orang Tua (Anak & Checklist Harian)
  // ===========================================================================
  parent: {
    getChildren: () =>
      request<{
        success: boolean;
        children: Array<{
          id: string;
          full_name: string;
          preferred_name: string;
          grade_level: string;
          avatar_url: string | null;
          class_name: string | null;
          school_name: string | null;
          school_logo_url: string | null;
        }>;
      }>("/parent/children"),

    getChildSummary: (childId: string, date?: string) =>
      request<{
        success: boolean;
        summary: {
          date: string;
          totalHabits: number;
          completedCount: number;
          notCompletedCount: number;
          notReportedCount: number;
          percentage: number;
        };
        school?: {
          name: string;
          logoUrl: string | null;
        };
        child?: {
          id: string;
          fullName: string;
          preferredName: string;
          avatarUrl: string | null;
        };
        streak: { currentStreak: number; longestStreak: number };
        points: number;
        chartBars: number[];
        parentNote?: string;
        teacherNote?: string;
        items: Array<{
          id: string;
          label: string;
          category: string;
          iconKey: string;
          sortOrder: number;
          status: "completed" | "not_completed" | "not_reported";
          checked: boolean;
          note?: string;
          version: number;
        }>;
      }>(`/children/${childId}/summary${date ? `?date=${date}` : ""}`),

    getChildChecklist: (childId: string, date?: string) =>
      request<{
        success: boolean;
        summary: any;
        items: Array<{
          id: string;
          label: string;
          category: string;
          iconKey: string;
          sortOrder: number;
          status: "completed" | "not_completed" | "not_reported";
          checked: boolean;
          note?: string;
          version: number;
        }>;
        parentNote?: string;
        teacherNote?: string;
      }>(`/children/${childId}/checklists${date ? `?date=${date}` : ""}`),

    saveChecklistItem: (
      childId: string,
      habitItemId: string,
      data: { status: "completed" | "not_completed" | "not_reported"; entryDate?: string; note?: string; clientVersion?: number }
    ) =>
      request<{ success: boolean; message: string; version: number }>(`/children/${childId}/checklists/${habitItemId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    saveParentNote: (childId: string, note: string, entryDate?: string) =>
      request<{ success: boolean; message: string }>(`/children/${childId}/checklists/notes`, {
        method: "POST",
        body: JSON.stringify({ note, entryDate }),
      }),

    getProfile: () =>
      request<{
        success: boolean;
        profile: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
        };
      }>("/parent/profile"),

    updateProfile: (data: { full_name: string; phone?: string; avatar_url?: string | null }) =>
      request<{ success: boolean; message: string; user: any }>("/parent/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    updateChildAvatar: (childId: string, avatar_url: string | null) =>
      request<{ success: boolean; message: string; childId: string; avatarUrl: string | null }>(
        `/children/${childId}/avatar`,
        {
          method: "PUT",
          body: JSON.stringify({ avatar_url }),
        }
      ),

    changePassword: (data: { current_password: string; new_password: string }) =>
      request<{ success: boolean; message: string }>("/parent/change-password", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    getChildReports: (childId: string, days?: number) =>
      request<{
        success: boolean;
        report: {
          child: {
            id: string;
            fullName: string;
            preferredName: string;
            avatarUrl: string | null;
          };
          daysCount: number;
          averageCompliance: number;
          totalCompleted: number;
          activeDays: number;
          days: Array<{
            date: string;
            dayLabel: string;
            percentage: number;
            completedCount: number;
            totalHabits: number;
            status: "complete" | "partial" | "unreported";
          }>;
          habitBreakdown: Array<{
            id: string;
            name: string;
            category: string;
            completedCount: number;
            percentage: number;
          }>;
          notesHistory: Array<{
            entry_date: string;
            note: string;
            author_role: string;
          }>;
        };
      }>(`/children/${childId}/reports${days ? `?days=${days}` : ""}`),
  },

  // ===========================================================================
  // Pesan Kontekstual Guru & Orang Tua
  // ===========================================================================
  messages: {
    getTeacherThreads: (classId?: string) =>
      request<{
        success: boolean;
        teacherAvatarUrl?: string | null;
        threads: TeacherChatThread[];
      }>(`/messages/teacher/threads${classId && classId !== "all" ? `?classId=${classId}` : ""}`),

    getThreads: (childId?: string) =>
      request<{
        success: boolean;
        threadId?: string;
        teacher?: {
          id: string;
          name: string;
          avatarUrl: string | null;
          className: string;
          schoolName: string;
        } | null;
        messages: Array<{
          id: string;
          body: string;
          sent_at: string;
          sender_id: string;
          sender_name: string;
          sender_avatar?: string | null;
          is_self: number;
        }>;
      }>(`/messages/threads${childId ? `?childId=${childId}` : ""}`),

    getThreadMessages: (threadId: string) =>
      request<{
        success: boolean;
        threadId: string;
        messages: Array<{
          id: string;
          body: string;
          sent_at: string;
          sender_id: string;
          sender_name: string;
          sender_avatar?: string | null;
          is_self: number;
        }>;
      }>(`/messages/threads/${threadId}`),

    sendMessage: (threadId: string, body: string) =>
      request<{
        success: boolean;
        message: {
          id: string;
          body: string;
          sent_at: string;
          sender_id: string;
          sender_name: string;
          sender_avatar?: string | null;
          is_self: number;
        };
      }>(`/messages/threads/${threadId}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
  },
};

export default api;
