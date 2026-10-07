import apiClient from "./api";

/**
 * API service لإحصائيات Dashboard لمسؤول الجامعة
 * بناءً على توثيق Backend API
 * 
 * ملاحظات مهمة:
 * - جميع الـ APIs تفلتر تلقائياً حسب university_id من Token
 * - مسؤول الجامعة يرى فقط بيانات جامعته
 */

// ============================================
// 1. إدارة المستخدمين (Accounts API)
// ============================================

/**
 * جلب جميع الطلاب في الجامعة
 * GET /api/accounts/university/students/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * يعيد: {status: "success", data: [...]}
 */
export const fetchStudentsData = async () => {
  try {
    const response = await apiClient.get("/accounts/university/students/");
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching students data:", error);
    return [];
  }
};

/**
 * جلب جميع المشرفين في الجامعة
 * GET /api/accounts/university/supervisors/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * يعيد: {status: "success", data: [...]}
 */
export const fetchSupervisorsData = async () => {
  try {
    const response = await apiClient.get("/accounts/university/supervisors/");
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching supervisors data:", error);
    return [];
  }
};

/**
 * حساب عدد الطلاب
 */
export const fetchStudentsCount = async () => {
  const students = await fetchStudentsData();
  return students.length;
};

/**
 * حساب عدد المشرفين
 */
export const fetchSupervisorsCount = async () => {
  const supervisors = await fetchSupervisorsData();
  return supervisors.length;
};

/**
 * حساب توزيع الطلاب حسب السنة الدراسية
 * @param {Array} students - قائمة الطلاب
 * @returns {Array} [{year: "السنة الأولى", count: 10}, ...]
 */
export const calculateStudentsByYear = (students) => {
  const yearCounts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  students.forEach((student) => {
    const year = student.year_of_study;
    if (year && year >= 1 && year <= 5) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });

  const yearNames = {
    1: "السنة الأولى",
    2: "السنة الثانية",
    3: "السنة الثالثة",
    4: "السنة الرابعة",
    5: "السنة الخامسة",
  };

  return Object.keys(yearCounts).map((year) => ({
    year: yearNames[year],
    count: yearCounts[year],
  }));
};

/**
 * حساب توزيع المشرفين حسب القسم
 * @param {Array} supervisors - قائمة المشرفين
 * @returns {Array} [{department: "الطب النفسي", count: 5}, ...]
 */
export const calculateSupervisorsByDepartment = (supervisors) => {
  const deptCounts = {};

  supervisors.forEach((supervisor) => {
    const dept = supervisor.department || "غير محدد";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  return Object.keys(deptCounts).map((dept) => ({
    department: dept,
    count: deptCounts[dept],
  }));
};

// ============================================
// 2. إحصائيات التدقيق (Audit API)
// ============================================

/**
 * جلب إحصائيات النشاط
 * GET /api/audit/statistics/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * يعيد: {
 *   action_counts: [{action: "create", count: 10}, ...],
 *   top_users: [{user_id: "...", username: "...", action_count: 5}, ...],
 *   daily_activity: [{date: "2025-01-01", count: 5}, ...]
 * }
 */
export const fetchAuditStatistics = async () => {
  try {
    const response = await apiClient.get("/audit/statistics/");
    
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data || {
      action_counts: [],
      top_users: [],
      daily_activity: [],
    };
  } catch (error) {
    // إذا كان الخطأ 500 أو خطأ من الخادم، نعيد قيم افتراضية
    if (error?.response?.status === 500 || error?.response?.status >= 500) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Audit statistics API returned 500, using default values");
      }
    } else if (process.env.NODE_ENV === "development") {
      console.error("Error fetching audit statistics:", error);
    }
    
    return {
      action_counts: [],
      top_users: [],
      daily_activity: [],
    };
  }
};

// ============================================
// 3. التقييمات (Evaluations API)
// ============================================

/**
 * جلب عدد التقييمات
 * GET /api/evaluations/
 */
export const fetchEvaluationsCount = async () => {
  try {
    const response = await apiClient.get("/evaluations/");
    
    let evaluations = [];
    if (response.data?.data && Array.isArray(response.data.data)) {
      evaluations = response.data.data;
    } else if (Array.isArray(response.data)) {
      evaluations = response.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      evaluations = response.data.results;
    }
    
    return evaluations.length;
  } catch (error) {
    console.error("Error fetching evaluations count:", error);
    return 0;
  }
};

// ============================================
// 4. الحالات السريرية (Cases API)
// ============================================

/**
 * جلب عدد الحالات النشطة
 * GET /api/cases/?status=in_progress
 */
export const fetchActiveCasesCount = async () => {
  try {
    const response = await apiClient.get("/cases/", {
      params: { status: "in_progress" },
    });
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data.length;
    }
    if (Array.isArray(response.data)) {
      return response.data.length;
    }
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results.length;
    }
    
    return 0;
  } catch (error) {
    console.error("Error fetching active cases count:", error);
    return 0;
  }
};

// ============================================
// 5. التقارير (Reports API)
// ============================================

/**
 * جلب عدد التقارير
 * GET /api/reports/
 */
export const fetchReportsCount = async () => {
  try {
    const response = await apiClient.get("/reports/");
    
    let reports = [];
    if (response.data?.data && Array.isArray(response.data.data)) {
      reports = response.data.data;
    } else if (Array.isArray(response.data)) {
      reports = response.data;
    } else if (response.data?.results && Array.isArray(response.data.results)) {
      reports = response.data.results;
    }
    
    return reports.length;
  } catch (error) {
    console.error("Error fetching reports count:", error);
    return 0;
  }
};

// ============================================
// 6. المحتوى المجتمعي (Community API)
// ============================================

/**
 * جلب الموافقات والرفض
 * GET /api/community/approvals/
 */
export const fetchApprovals = async () => {
  try {
    const response = await apiClient.get("/community/approvals/");
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    // إذا كان الخطأ 500 أو خطأ من الخادم، نعيد مصفوفة فارغة
    if (error?.response?.status === 500 || error?.response?.status >= 500) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Approvals API returned 500, using empty array");
      }
    } else if (process.env.NODE_ENV === "development") {
      console.error("Error fetching approvals:", error);
    }
    
    return [];
  }
};

/**
 * @deprecated استخدم fetchApprovals بدلاً منها
 * جلب المحتوى المعلق عليه (قديم)
 */
export const fetchPendingContent = async () => {
  return fetchApprovals();
};

// ============================================
// 7. دالة رئيسية لجلب جميع إحصائيات Dashboard
// ============================================

/**
 * جلب جميع إحصائيات Dashboard لمسؤول الجامعة
 * يجمع البيانات من جميع الـ APIs المطلوبة
 * 
 * @returns {Object} {
 *   totalStudents: number,
 *   totalSupervisors: number,
 *   activeCases: number,
 *   pendingContent: number,
 *   totalEvaluations: number,
 *   reportsGenerated: number,
 *   studentsByYear: Array,
 *   supervisorsByDepartment: Array,
 *   auditStatistics: Object
 * }
 */
export const fetchUniversityAdminDashboardStats = async () => {
  try {
    // جلب جميع البيانات بشكل متوازي
    const [
      students,
      supervisors,
      activeCases,
      pendingContent,
      evaluationsCount,
      reportsCount,
      auditStats,
    ] = await Promise.all([
      fetchStudentsData(),
      fetchSupervisorsData(),
      fetchActiveCasesCount(),
      fetchApprovals().then((approvals) => approvals.length),
      fetchEvaluationsCount(),
      fetchReportsCount(),
      fetchAuditStatistics(),
    ]);

    // حساب التوزيعات
    const studentsByYear = calculateStudentsByYear(students);
    const supervisorsByDepartment = calculateSupervisorsByDepartment(supervisors);

    return {
      // الإحصائيات الأساسية
      totalStudents: students.length,
      totalSupervisors: supervisors.length,
      activeCases,
      pendingContent,
      totalEvaluations: evaluationsCount,
      reportsGenerated: reportsCount,
      
      // بيانات Charts
      studentsByYear,
      supervisorsByDepartment,
      
      // إحصائيات Audit
      auditStatistics: auditStats,
    };
  } catch (error) {
    console.error("Error fetching university admin dashboard stats:", error);
    return {
      totalStudents: 0,
      totalSupervisors: 0,
      activeCases: 0,
      pendingContent: 0,
      totalEvaluations: 0,
      reportsGenerated: 0,
      studentsByYear: [],
      supervisorsByDepartment: [],
      auditStatistics: {
        action_counts: [],
        top_users: [],
        daily_activity: [],
      },
    };
  }
};
