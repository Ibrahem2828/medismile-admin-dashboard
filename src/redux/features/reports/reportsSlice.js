import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchReports,
  fetchReportById,
  createReport,
  updateReport,
  deleteReport,
  submitReport,
  exportReport,
  fetchStudentReports,
  fetchUniversityReports,
} from "../../../services/reportsApi";

/**
 * دالة مساعدة لاستخراج اسم المستخدم من User object
 */
const getUserName = (user) => {
  if (!user) return "-";
  if (typeof user === "string") return user;
  
  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  if (firstName) return firstName;
  if (user.username) return user.username;
  if (user.name) return user.name;
  if (user.email) return user.email;
  return "-";
};

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 */
const mapReportFromApi = (apiReport) => {
  if (!apiReport) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  return {
    id: safeValue(apiReport.id),
    title: safeValue(apiReport.title, ""),
    description: safeValue(apiReport.description, ""),
    content: safeValue(apiReport.content, null), // JSON object
    report_type: safeValue(apiReport.report_type, ""),
    target_type: safeValue(apiReport.target_type, ""),
    target_id: safeValue(apiReport.target_id, null),
    status: safeValue(apiReport.status, "draft"), // draft, submitted, approved, rejected, locked
    attachments: safeValue(apiReport.attachments, []), // Array of attachment objects
    file_url: safeValue(apiReport.file_url, ""),
    is_active: safeValue(apiReport.is_active, true), // للتوافق مع النظام القديم
    // معلومات الطالب (nested User object)
    student: safeValue(apiReport.student, null),
    student_name: apiReport.student_name || getUserName(apiReport.student),
    student_id: apiReport.student?.id || apiReport.student_id || apiReport.student || null,
    // معلومات المؤلف
    author: safeValue(apiReport.author, null),
    author_name: apiReport.author_name || getUserName(apiReport.author),
    author_role: safeValue(apiReport.author_role, null),
    // معلومات المشرف
    supervisor: safeValue(apiReport.supervisor, null),
    supervisor_name: apiReport.supervisor_name || getUserName(apiReport.supervisor),
    // معلومات الجامعة
    university: safeValue(apiReport.university, null),
    university_id: apiReport.university?.id || apiReport.university_id || apiReport.university || null,
    university_name: apiReport.university_name || null,
    // معلومات الموافق عليه
    approved_by: safeValue(apiReport.approved_by, null),
    approved_by_name: apiReport.approved_by_name || getUserName(apiReport.approved_by),
    // معلومات المراجع (supervisor)
    reviewer: safeValue(apiReport.reviewer, null),
    reviewer_name: apiReport.reviewer_name || getUserName(apiReport.reviewer),
    review_notes: safeValue(apiReport.review_notes, ""),
    score: safeValue(apiReport.score, null),
    feedback: safeValue(apiReport.feedback, null),
    // الحقول التاريخية
    created_at: safeValue(apiReport.created_at),
    updated_at: safeValue(apiReport.updated_at),
    submitted_at: safeValue(apiReport.submitted_at),
    reviewed_at: safeValue(apiReport.reviewed_at),
    approved_at: safeValue(apiReport.approved_at),
    locked_at: safeValue(apiReport.locked_at),
    rejected_at: safeValue(apiReport.rejected_at),
  };
};

/**
 * جلب قائمة التقارير
 */
export const fetchReportsAsync = createAsyncThunk(
  "reports/fetchReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchReports(params);
      // تحويل كل تقرير باستخدام دالة mapping
      if (Array.isArray(data)) {
        return data.map(mapReportFromApi).filter(Boolean);
      }
      return [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب التقارير"
      );
    }
  }
);

/**
 * جلب تقرير محدد
 */
export const fetchReportByIdAsync = createAsyncThunk(
  "reports/fetchReportById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await fetchReportById(id);
      return mapReportFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب التقرير"
      );
    }
  }
);

/**
 * إنشاء تقرير جديد
 */
export const createReportAsync = createAsyncThunk(
  "reports/createReport",
  async (reportData, { rejectWithValue }) => {
    try {
      const data = await createReport(reportData);
      return mapReportFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إنشاء التقرير"
      );
    }
  }
);

/**
 * تحديث تقرير
 */
export const updateReportAsync = createAsyncThunk(
  "reports/updateReport",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await updateReport(id, data);
      return mapReportFromApi(updated);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث التقرير"
      );
    }
  }
);

/**
 * تقديم تقرير (Submit)
 */
export const submitReportAsync = createAsyncThunk(
  "reports/submitReport",
  async (id, { rejectWithValue }) => {
    try {
      const data = await submitReport(id);
      return mapReportFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تقديم التقرير"
      );
    }
  }
);

/**
 * تصدير تقرير (Export)
 */
export const exportReportAsync = createAsyncThunk(
  "reports/exportReport",
  async ({ id, format = "pdf" }, { rejectWithValue }) => {
    try {
      const data = await exportReport(id, format);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تصدير التقرير"
      );
    }
  }
);

/**
 * حذف تقرير
 */
export const deleteReportAsync = createAsyncThunk(
  "reports/deleteReport",
  async (id, { rejectWithValue }) => {
    try {
      await deleteReport(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في حذف التقرير"
      );
    }
  }
);

/**
 * جلب تقارير طالب محدد
 */
export const fetchStudentReportsAsync = createAsyncThunk(
  "reports/fetchStudentReports",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await fetchStudentReports(studentId);
      return { studentId, reports: data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تقارير الطالب"
      );
    }
  }
);

/**
 * جلب تقارير جامعة محددة
 */
export const fetchUniversityReportsAsync = createAsyncThunk(
  "reports/fetchUniversityReports",
  async (universityId, { rejectWithValue }) => {
    try {
      const data = await fetchUniversityReports(universityId);
      return { universityId, reports: data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تقارير الجامعة"
      );
    }
  }
);

const initialState = {
  // قائمة التقارير من API
  reports: [],
  // التقرير المحدد
  selectedReport: null,
  // تقارير الطلاب (مخزنة حسب studentId)
  studentReports: {},
  // تقارير الجامعات (مخزنة حسب universityId)
  universityReports: {},
  // حالة التحميل
  loading: false,
  // حالة التحميل للتقرير المحدد
  loadingSelected: false,
  // الأخطاء
  error: null,
  // معاملات البحث
  filters: {
    student_id: null,
    university_id: null,
    report_type: null,
    is_active: null,
  },
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    // مسح الخطأ
    clearError: (state) => {
      state.error = null;
    },
    // مسح التقرير المحدد
    clearSelectedReport: (state) => {
      state.selectedReport = null;
    },
    // تحديث الفلاتر
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // مسح الفلاتر
    clearFilters: (state) => {
      state.filters = {
        student_id: null,
        university_id: null,
        report_type: null,
        is_active: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب قائمة التقارير
      .addCase(fetchReportsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload || [];
        state.error = null;
      })
      .addCase(fetchReportsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب التقارير";
        state.reports = [];
      })
      // جلب تقرير محدد
      .addCase(fetchReportByIdAsync.pending, (state) => {
        state.loadingSelected = true;
        state.error = null;
      })
      .addCase(fetchReportByIdAsync.fulfilled, (state, action) => {
        state.loadingSelected = false;
        state.selectedReport = action.payload;
        state.error = null;
      })
      .addCase(fetchReportByIdAsync.rejected, (state, action) => {
        state.loadingSelected = false;
        state.error = action.payload || "حدث خطأ أثناء جلب التقرير";
        state.selectedReport = null;
      })
      // إنشاء تقرير جديد
      .addCase(createReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        // إضافة التقرير الجديد للقائمة
        if (action.payload) {
          state.reports.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(createReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء إنشاء التقرير";
      })
      // تحديث تقرير
      .addCase(updateReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        // تحديث في القائمة
        const index = state.reports.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.reports[index] = updated;
        }
        // تحديث التقرير المحدد إذا كان نفسه
        if (state.selectedReport?.id === updated.id) {
          state.selectedReport = updated;
        }
        state.error = null;
      })
      .addCase(updateReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تحديث التقرير";
      })
      // تقديم تقرير (Submit)
      .addCase(submitReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        // تحديث في القائمة
        const index = state.reports.findIndex((item) => item.id === updated?.id);
        if (index !== -1) {
          state.reports[index] = updated;
        }
        // تحديث التقرير المحدد إذا كان نفسه
        if (state.selectedReport?.id === updated?.id) {
          state.selectedReport = updated;
        }
        state.error = null;
      })
      .addCase(submitReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تقديم التقرير";
      })
      // تصدير تقرير (Export)
      .addCase(exportReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // لا نحتاج لتحديث state - فقط file_url في response
      })
      .addCase(exportReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تصدير التقرير";
      })
      // حذف تقرير
      .addCase(deleteReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        // حذف من القائمة
        state.reports = state.reports.filter((item) => item.id !== action.payload);
        // مسح التقرير المحدد إذا كان المحذوف
        if (state.selectedReport?.id === action.payload) {
          state.selectedReport = null;
        }
        state.error = null;
      })
      .addCase(deleteReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء حذف التقرير";
      })
      // جلب تقارير طالب
      .addCase(fetchStudentReportsAsync.fulfilled, (state, action) => {
        const { studentId, reports } = action.payload;
        state.studentReports[studentId] = reports;
      })
      // جلب تقارير جامعة
      .addCase(fetchUniversityReportsAsync.fulfilled, (state, action) => {
        const { universityId, reports } = action.payload;
        state.universityReports[universityId] = reports;
      });
  },
});

export const {
  clearError,
  clearSelectedReport,
  setFilters,
  clearFilters,
} = reportsSlice.actions;

export default reportsSlice.reducer;
