import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchEvaluations,
  createEvaluation as createEvaluationApi,
  updateEvaluation as updateEvaluationApi,
  fetchEvaluationById,
  fetchStudentStatistics,
  fetchStudentRating,
  fetchStudentAverageRatings, // @deprecated - للتوافق مع الكود القديم
  submitEvaluation,
  adjustEvaluation,
  finalizeEvaluation,
} from "../../../services/evaluationsApi";
import { fetchStudents } from "../../../services/studentsApi";
import { fetchSupervisors } from "../../../services/supervisorsApi";
import { fetchCaseById } from "../../../services/casesApi";

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
  if (user.email) return user.email;
  return "-";
};

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 * @param {Object} apiEvaluation - بيانات التقييم من API
 * @param {Map} studentsMap - Map من student ID إلى student name
 * @param {Map} supervisorsMap - Map من supervisor ID إلى supervisor name
 */
const mapEvaluationFromApi = (apiEvaluation, studentsMap = new Map(), supervisorsMap = new Map()) => {
  if (!apiEvaluation) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };
  
  // تحديد اسم المقيم بناءً على evaluator_role و evaluator object أو من Map
  const getEvaluatorName = (evaluation) => {
    // إذا كان evaluator object (ليس UUID)
    if (evaluation.evaluator && typeof evaluation.evaluator === "object") {
      return getUserName(evaluation.evaluator);
    }
    
    // إذا كان evaluator UUID، نحاول جلب الاسم من Maps
    if (evaluation.evaluator && typeof evaluation.evaluator === "string") {
      // محاولة من supervisorsMap إذا كان evaluator_role = supervisor
      if (evaluation.evaluator_role === "supervisor" && supervisorsMap.has(evaluation.evaluator)) {
        return supervisorsMap.get(evaluation.evaluator);
      }
      // محاولة من studentsMap إذا كان evaluator_role = student
      if (evaluation.evaluator_role === "student" && studentsMap.has(evaluation.evaluator)) {
        return studentsMap.get(evaluation.evaluator);
      }
    }
    
    // محاولة من الحقول الأخرى
    if (evaluation.evaluator_role === "patient" && evaluation.patient && typeof evaluation.patient === "object") {
      return getUserName(evaluation.patient);
    }
    if (evaluation.evaluator_role === "supervisor" && evaluation.supervisor && typeof evaluation.supervisor === "object") {
      return getUserName(evaluation.supervisor);
    }
    if (evaluation.evaluator_role === "student" && evaluation.student && typeof evaluation.student === "object") {
      return getUserName(evaluation.student);
    }
    
    // إذا كان evaluator UUID فقط ولم نجد الاسم في Maps، نعرض دور المقيم بدلاً من UUID
    if (evaluation.evaluator_role) {
      const roleMap = {
        patient: "مريض",
        supervisor: "مشرف",
        student: "طالب",
        university_admin: "مسؤول جامعة"
      };
      return roleMap[evaluation.evaluator_role] || evaluation.evaluator_role;
    }
    
    return "غير معروف";
  };
  
  // تحديد اسم الطالب المقيّم من Map أو من object
  const getStudentName = (evaluation) => {
    // إذا كان student object
    if (evaluation.student && typeof evaluation.student === "object") {
      return getUserName(evaluation.student);
    }
    
    // إذا كان student UUID، نحاول جلب الاسم من studentsMap
    if (evaluation.student && typeof evaluation.student === "string") {
      if (studentsMap.has(evaluation.student)) {
        return studentsMap.get(evaluation.student);
      }
    }
    
    // إذا كان UUID فقط ولم نجد الاسم، نعرض "طالب" بدلاً من UUID
    return evaluation.student ? "طالب" : "-";
  };
  
  // تحديد اسم/معلومات الهدف (case, appointment, etc.)
  const getTargetName = (evaluation) => {
    if (evaluation.case && typeof evaluation.case === "object") {
      return evaluation.case.title || evaluation.case.name || "حالة سريرية";
    }
    if (evaluation.appointment && typeof evaluation.appointment === "object") {
      return `موعد - ${evaluation.appointment.date || ""}`;
    }
    if (evaluation.session && typeof evaluation.session === "object") {
      return evaluation.session.title || "جلسة";
    }
    // إذا كان UUID فقط، نعرض نوع الهدف فقط
    if (evaluation.target_type) {
      const typeMap = {
        case: "حالة سريرية",
        appointment: "موعد",
        session: "جلسة",
        student: "طالب",
        supervisor: "مشرف"
      };
      return typeMap[evaluation.target_type] || evaluation.target_type;
    }
    return "-";
  };
  
  return {
    id: safeValue(apiEvaluation.id),
    // اسم المقيم (من evaluator object أو من evaluator_role)
    name: getEvaluatorName(apiEvaluation),
    evaluator_name: getEvaluatorName(apiEvaluation),
    // اسم الطالب المقيّم
    student_name: getStudentName(apiEvaluation),
    // اسم/معلومات الهدف
    target_name: getTargetName(apiEvaluation),
    // تاريخ التقييم
    date: formatDate(apiEvaluation.created_at),
    // التقييم (من 1-10 للتوافق مع النظام القديم، أو score 0-100 للنظام الجديد)
    rating: safeValue(apiEvaluation.rating, safeValue(apiEvaluation.score, 0) / 10), // تحويل score إلى rating للتوافق
    // Score (0-100) - النظام الجديد
    score: safeValue(apiEvaluation.final_score || apiEvaluation.score, safeValue(apiEvaluation.rating, 0) * 10),
    original_score: safeValue(apiEvaluation.original_score),
    final_score: safeValue(apiEvaluation.final_score || apiEvaluation.score),
    // عدد النجوم للعرض (من final_score 0-100 إلى 1-5 نجوم)
    starRating: Math.round(((safeValue(apiEvaluation.final_score || apiEvaluation.score, 0) / 100) * 5)),
    // التعليق
    comment: safeValue(apiEvaluation.comment, ""),
    // نوع المقيم (للتوافق مع النظام القديم)
    evaluatorType: safeValue(apiEvaluation.evaluator_type, ""),
    // النظام الجديد: target_type, status
    target_type: safeValue(apiEvaluation.target_type, ""),
    target_id: safeValue(apiEvaluation.target_id || apiEvaluation.case_id || apiEvaluation.session_id || apiEvaluation.appointment_id),
    status: safeValue(apiEvaluation.status, "created"), // created, adjusted, finalized (حسب التوثيق الجديد)
    original_score: safeValue(apiEvaluation.original_score),
    final_score: safeValue(apiEvaluation.final_score || apiEvaluation.score),
    rubric: safeValue(apiEvaluation.rubric, null), // JSON object
    evaluator_role: safeValue(apiEvaluation.evaluator_role || apiEvaluation.evaluator_type, ""),
    // بيانات API الأصلية
    _apiData: {
      id: safeValue(apiEvaluation.id),
      evaluator: safeValue(apiEvaluation.evaluator),
      patient: safeValue(apiEvaluation.patient),
      student: safeValue(apiEvaluation.student),
      appointment: safeValue(apiEvaluation.appointment),
      case: safeValue(apiEvaluation.case),
      session: safeValue(apiEvaluation.session),
      rating: safeValue(apiEvaluation.rating),
      score: safeValue(apiEvaluation.score),
      comment: safeValue(apiEvaluation.comment),
      evaluator_type: safeValue(apiEvaluation.evaluator_type),
      target_type: safeValue(apiEvaluation.target_type),
      case_id: safeValue(apiEvaluation.case_id),
      session_id: safeValue(apiEvaluation.session_id),
      appointment_id: safeValue(apiEvaluation.appointment_id),
      rubric: safeValue(apiEvaluation.rubric),
      status: safeValue(apiEvaluation.status),
      created_at: safeValue(apiEvaluation.created_at),
      submitted_at: safeValue(apiEvaluation.submitted_at),
      finalized_at: safeValue(apiEvaluation.finalized_at),
    },
  };
};

/**
 * جلب جميع التقييمات من API
 * مع جلب أسماء الطلاب والمشرفين من المعرفات
 */
export const fetchEvaluationsAsync = createAsyncThunk(
  "evaluations/fetchEvaluations",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchEvaluations(params);
      
      // جلب قائمة الطلاب والمشرفين لاستخراج الأسماء من المعرفات
      let studentsMap = new Map();
      let supervisorsMap = new Map();
      
      try {
        const [studentsData, supervisorsData] = await Promise.all([
          fetchStudents().catch(() => []),
          fetchSupervisors().catch(() => [])
        ]);
        
        // إنشاء map من ID إلى Name للطلاب
        if (Array.isArray(studentsData)) {
          studentsData.forEach((student) => {
            const studentId = student.user_id || student.id;
            if (studentId) {
              const name = getUserName(student);
              if (name && name !== "-") {
                studentsMap.set(studentId, name);
              }
            }
          });
        }
        
        // إنشاء map من ID إلى Name للمشرفين
        if (Array.isArray(supervisorsData)) {
          supervisorsData.forEach((supervisor) => {
            const supervisorId = supervisor.user_id || supervisor.id;
            if (supervisorId) {
              const name = getUserName(supervisor);
              if (name && name !== "-") {
                supervisorsMap.set(supervisorId, name);
              }
            }
          });
        }
      } catch (err) {
        // إذا فشل جلب الطلاب/المشرفين، نكمل بدونهم
        console.warn("Failed to fetch students/supervisors for name mapping:", err);
      }
      
      // تحويل كل تقييم باستخدام دالة mapping مع maps الأسماء
      if (Array.isArray(data)) {
        return data.map((evalData) => mapEvaluationFromApi(evalData, studentsMap, supervisorsMap)).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب التقييمات"
      );
    }
  }
);

/**
 * جلب تفاصيل تقييم محدد
 * GET /api/evaluations/<id>/
 * مع جلب أسماء الطلاب والمشرفين والحالات السريرية من المعرفات
 */
export const fetchEvaluationByIdAsync = createAsyncThunk(
  "evaluations/fetchEvaluationById",
  async (evaluationId, { rejectWithValue }) => {
    try {
      const data = await fetchEvaluationById(evaluationId);
      
      // جلب قائمة الطلاب والمشرفين لاستخراج الأسماء من المعرفات
      let studentsMap = new Map();
      let supervisorsMap = new Map();
      
      try {
        const [studentsData, supervisorsData] = await Promise.all([
          fetchStudents().catch(() => []),
          fetchSupervisors().catch(() => [])
        ]);
        
        // إنشاء map من ID إلى Name للطلاب
        if (Array.isArray(studentsData)) {
          studentsData.forEach((student) => {
            const studentId = student.user_id || student.id;
            if (studentId) {
              const name = getUserName(student);
              if (name && name !== "-") {
                studentsMap.set(studentId, name);
              }
            }
          });
        }
        
        // إنشاء map من ID إلى Name للمشرفين
        if (Array.isArray(supervisorsData)) {
          supervisorsData.forEach((supervisor) => {
            const supervisorId = supervisor.user_id || supervisor.id;
            if (supervisorId) {
              const name = getUserName(supervisor);
              if (name && name !== "-") {
                supervisorsMap.set(supervisorId, name);
              }
            }
          });
        }
      } catch (err) {
        // إذا فشل جلب الطلاب/المشرفين، نكمل بدونهم
        console.warn("Failed to fetch students/supervisors for name mapping:", err);
      }
      
      // إذا كان التقييم مرتبط بحالة سريرية ولم يكن case object موجود، نجلب اسم الحالة
      // التحقق من أن case ليس object (قد يكون UUID string)
      const caseId = data?.target_id || data?.case_id || (data?.case && typeof data.case === "string" ? data.case : null);
      if (data && (data.target_type === "case" || caseId) && (!data.case || typeof data.case !== "object")) {
        if (caseId && typeof caseId === "string") {
          try {
            const caseData = await fetchCaseById(caseId);
            // إضافة case object إلى بيانات التقييم
            if (caseData && caseData.title) {
              data.case = {
                id: caseId,
                title: caseData.title,
                name: caseData.title,
              };
            }
          } catch (err) {
            // إذا فشل جلب الحالة، نكمل بدونها
            console.warn("Failed to fetch case details for evaluation:", err);
          }
        }
      }
      
      return mapEvaluationFromApi(data, studentsMap, supervisorsMap);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تفاصيل التقييم"
      );
    }
  }
);

/**
 * إنشاء تقييم جديد
 */
export const createEvaluationAsync = createAsyncThunk(
  "evaluations/createEvaluation",
  async (evaluationData, { rejectWithValue }) => {
    try {
      const createdEvaluation = await createEvaluationApi(evaluationData);
      return createdEvaluation; // نعيد البيانات كما هي (قد تحتاج mapping لاحقاً)
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || error?.response?.data?.detail || "فشل في إنشاء التقييم"
      );
    }
  }
);

/**
 * تحديث تقييم (فقط المسودات)
 */
export const updateEvaluationAsync = createAsyncThunk(
  "evaluations/updateEvaluation",
  async ({ evaluationId, evaluationData }, { rejectWithValue }) => {
    try {
      const updated = await updateEvaluationApi(evaluationId, evaluationData);
      return updated;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث التقييم"
      );
    }
  }
);

/**
 * تقديم تقييم (Submit)
 */
export const submitEvaluationAsync = createAsyncThunk(
  "evaluations/submitEvaluation",
  async (evaluationId, { rejectWithValue }) => {
    try {
      const updated = await submitEvaluation(evaluationId);
      return updated;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تقديم التقييم"
      );
    }
  }
);

/**
 * تعديل التقييم (Adjust) - لمسؤول الجامعة والمشرف
 * PATCH /api/evaluations/{id}/adjust/
 */
export const adjustEvaluationAsync = createAsyncThunk(
  "evaluations/adjustEvaluation",
  async ({ evaluationId, adjustmentData }, { rejectWithValue }) => {
    try {
      const updated = await adjustEvaluation(evaluationId, adjustmentData);
      return updated;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تعديل التقييم"
      );
    }
  }
);

/**
 * إقرار التقييم (Finalize) - لمسؤول الجامعة فقط
 * POST /api/evaluations/{id}/finalize/
 */
export const finalizeEvaluationAsync = createAsyncThunk(
  "evaluations/finalizeEvaluation",
  async (evaluationId, { rejectWithValue }) => {
    try {
      const updated = await finalizeEvaluation(evaluationId);
      return updated;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إقرار التقييم"
      );
    }
  }
);

/**
 * جلب تقييم الطالب العام (Student Rating)
 * GET /api/evaluations/students/{id}/rating/
 */
export const fetchStudentRatingAsync = createAsyncThunk(
  "evaluations/fetchStudentRating",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await fetchStudentRating(studentId);
      return { studentId, rating: data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تقييم الطالب"
      );
    }
  }
);

/**
 * جلب إحصائيات التقييمات لطالب محدد (قديم - للتوافق)
 * GET /api/evaluations/students/<student_id>/statistics/
 */
export const fetchStudentStatisticsAsync = createAsyncThunk(
  "evaluations/fetchStudentStatistics",
  async (studentId, { rejectWithValue }) => {
    try {
      const data = await fetchStudentStatistics(studentId);
      return { studentId, statistics: data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب إحصائيات التقييمات"
      );
    }
  }
);

/**
 * @deprecated استخدم fetchStudentStatisticsAsync بدلاً منها
 * جلب متوسط تقييمات طالب (قديم)
 */
export const fetchStudentAverageRatingsAsync = createAsyncThunk(
  "evaluations/fetchStudentAverageRatings",
  async (studentId, { rejectWithValue }) => {
    try {
      // استخدام الـ endpoint الجديد
      const data = await fetchStudentStatistics(studentId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب متوسط التقييمات"
      );
    }
  }
);

const evaluationsSlice = createSlice({
  name: "evaluations",
  initialState: {
    reviews: [], // قائمة التقييمات
    selectedEvaluation: null, // التقييم المحدد (لصفحة التفاصيل)
    averageRatings: null, // متوسط التقييمات (لطالب معين) - قديم
    studentStatistics: {}, // إحصائيات التقييمات للطلاب {studentId: statistics}
    studentRatings: {}, // تقييمات الطلاب {studentId: rating}
    loading: false,
    error: null,
    search: "",
    statusFilter: "all",
    dateFilter: "",
    evaluatorTypeFilter: "all", // فلتر نوع المقيم
  },
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setDateFilter: (state, action) => {
      state.dateFilter = action.payload;
    },
    setEvaluatorTypeFilter: (state, action) => {
      state.evaluatorTypeFilter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب التقييمات
      .addCase(fetchEvaluationsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluationsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload || [];
        state.error = null;
      })
      .addCase(fetchEvaluationsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب التقييمات";
        state.reviews = [];
      })
      // جلب تفاصيل تقييم محدد
      .addCase(fetchEvaluationByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluationByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          // حفظ التقييم المحدد
          state.selectedEvaluation = action.payload;
          // تحديث التقييم في القائمة إذا كان موجوداً
          const index = state.reviews.findIndex((r) => r.id === action.payload.id);
          if (index !== -1) {
            state.reviews[index] = action.payload;
          } else {
            // أو إضافته إذا لم يكن موجوداً
            state.reviews.push(action.payload);
          }
        }
        state.error = null;
      })
      .addCase(fetchEvaluationByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب تفاصيل التقييم";
        state.selectedEvaluation = null;
      })
      // إنشاء تقييم
      .addCase(createEvaluationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvaluationAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.reviews.unshift(action.payload); // إضافة في البداية
        }
        state.error = null;
      })
      .addCase(createEvaluationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء إنشاء التقييم";
      })
      // تحديث تقييم
      .addCase(updateEvaluationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvaluationAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.reviews.findIndex((r) => r.id === updated.id);
        if (index !== -1) {
          state.reviews[index] = mapEvaluationFromApi(updated);
        }
        state.error = null;
      })
      .addCase(updateEvaluationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تحديث التقييم";
      })
      // تقديم تقييم
      .addCase(submitEvaluationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitEvaluationAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.reviews.findIndex((r) => r.id === updated.id);
        if (index !== -1) {
          state.reviews[index] = mapEvaluationFromApi(updated);
        }
        state.error = null;
      })
      .addCase(submitEvaluationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تقديم التقييم";
      })
      // تعديل تقييم (Adjust)
      .addCase(adjustEvaluationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustEvaluationAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = mapEvaluationFromApi(action.payload);
        // تحديث التقييم المحدد
        if (state.selectedEvaluation?.id === updated?.id) {
          state.selectedEvaluation = updated;
        }
        // تحديث التقييم في القائمة
        const index = state.reviews.findIndex((r) => r.id === updated?.id);
        if (index !== -1) {
          state.reviews[index] = updated;
        }
        state.error = null;
      })
      .addCase(adjustEvaluationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تعديل التقييم";
      })
      // إقرار تقييم (Finalize)
      .addCase(finalizeEvaluationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizeEvaluationAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = mapEvaluationFromApi(action.payload);
        // تحديث التقييم المحدد
        if (state.selectedEvaluation?.id === updated?.id) {
          state.selectedEvaluation = updated;
        }
        // تحديث التقييم في القائمة
        const index = state.reviews.findIndex((r) => r.id === updated?.id);
        if (index !== -1) {
          state.reviews[index] = updated;
        }
        state.error = null;
      })
      .addCase(finalizeEvaluationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء إقرار التقييم";
      })
      // جلب تقييم الطالب العام (Student Rating)
      .addCase(fetchStudentRatingAsync.fulfilled, (state, action) => {
        const { studentId, rating } = action.payload;
        if (!state.studentRatings[studentId]) {
          state.studentRatings[studentId] = {};
        }
        state.studentRatings[studentId] = rating;
        // أيضاً في studentStatistics للتوافق
        if (!state.studentStatistics[studentId]) {
          state.studentStatistics[studentId] = {};
        }
        state.studentStatistics[studentId].rating = rating;
        state.error = null;
      })
      .addCase(fetchStudentRatingAsync.rejected, (state, action) => {
        state.error = action.payload || "حدث خطأ أثناء جلب تقييم الطالب";
      })
      // جلب إحصائيات التقييمات لطالب
      .addCase(fetchStudentStatisticsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentStatisticsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { studentId, statistics } = action.payload;
        state.studentStatistics[studentId] = statistics;
        state.error = null;
      })
      .addCase(fetchStudentStatisticsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب إحصائيات التقييمات";
      })
      // جلب متوسط التقييمات (قديم - للتوافق)
      .addCase(fetchStudentAverageRatingsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentAverageRatingsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.averageRatings = action.payload;
        state.error = null;
      })
      .addCase(fetchStudentAverageRatingsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب متوسط التقييمات";
      });
  },
});

export const {
  setSearch,
  setStatusFilter,
  setDateFilter,
  setEvaluatorTypeFilter,
  clearError,
} = evaluationsSlice.actions;

export default evaluationsSlice.reducer;
