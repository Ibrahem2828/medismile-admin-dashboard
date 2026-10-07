import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as casesApi from "../../../services/casesApi";

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
 * بناءً على التوثيق الكامل لـ Case API
 * الحقول الصحيحة: id, title, description, patient, student, supervisor, 
 * status, priority, is_public, created_at, updated_at
 */
const mapCaseFromApi = (apiCase) => {
  if (!apiCase) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  return {
    id: safeValue(apiCase.id),
    // معلومات الحالة الأساسية
    title: safeValue(apiCase.title, ""),
    description: safeValue(apiCase.description, ""),
    // معلومات المريض (nested User object)
    patient: safeValue(apiCase.patient, null),
    patient_name: getUserName(apiCase.patient),
    patient_id: apiCase.patient?.id || apiCase.patient || null,
    // معلومات الطالب (nested User object)
    student: safeValue(apiCase.student, null),
    student_name: getUserName(apiCase.student),
    student_id: apiCase.student?.id || apiCase.student || null,
    // معلومات المشرف (nested User object)
    supervisor: safeValue(apiCase.supervisor, null),
    supervisor_name: getUserName(apiCase.supervisor),
    supervisor_id: apiCase.supervisor?.id || apiCase.supervisor || null,
    // حالة وأولوية الحالة
    status: safeValue(apiCase.status, "open"),
    priority: safeValue(apiCase.priority, "medium"),
    is_public: safeValue(apiCase.is_public, false),
    // التاريخ والسجل
    history: Array.isArray(apiCase.history) ? apiCase.history : [],
    assignment_requests: Array.isArray(apiCase.assignment_requests) ? apiCase.assignment_requests : [],
    // الحقول التاريخية
    created_at: safeValue(apiCase.created_at),
    updated_at: safeValue(apiCase.updated_at),
  };
};

/**
 * Mapping function لتحويل بيانات Frontend إلى تنسيق API للإنشاء
 * بناءً على CaseCreateSerializer
 * الحقول المسموحة: title, description, priority, is_public, patient_id
 * ملاحظة: لا يمكن إضافة student أو supervisor مباشرة عند الإنشاء
 */
const mapCaseToApiForCreate = (frontendCase) => {
  const apiData = {
    title: frontendCase.title || "",
    description: frontendCase.description || "",
    priority: frontendCase.priority || "medium",
    is_public: frontendCase.is_public !== undefined ? frontendCase.is_public : false,
  };
  
  // إضافة patient_id إذا كان موجوداً (مطلوب حسب التوثيق)
  if (frontendCase.patient_id) {
    apiData.patient_id = frontendCase.patient_id;
  }
  
  console.log("📋 mapCaseToApiForCreate - Input:", frontendCase);
  console.log("📋 mapCaseToApiForCreate - Output:", apiData);
  
  // لا يمكن إضافة student_id أو supervisor_id عند الإنشاء
  // يتم الإسناد لاحقاً عبر طلبات الإسناد
  
  return apiData;
};

/**
 * Mapping function لتحويل بيانات Frontend إلى تنسيق API للتحديث
 * بناءً على CaseUpdateSerializer
 * الحقول المسموحة فقط: title, description, status, priority, is_public
 * ملاحظة: لا يمكن تحديث patient_id, student_id, supervisor_id مباشرة
 * يتم الإسناد عبر طلبات الإسناد وإجراءات المشرف
 */
const mapCaseToApiForUpdate = (frontendCase) => {
  const updateData = {};
  
  if (frontendCase.title !== undefined) updateData.title = frontendCase.title;
  if (frontendCase.description !== undefined) updateData.description = frontendCase.description;
  if (frontendCase.status !== undefined) updateData.status = frontendCase.status;
  if (frontendCase.priority !== undefined) updateData.priority = frontendCase.priority;
  if (frontendCase.is_public !== undefined) updateData.is_public = frontendCase.is_public;
  
  // لا يمكن تحديث patient_id, student_id, supervisor_id مباشرة
  // يتم الإسناد عبر طلبات الإسناد وإجراءات المشرف
  
  return updateData;
};

// Async Thunks
export const fetchCases = createAsyncThunk(
  "cases/fetchCases",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log("📋 Redux - Fetching cases with params:", params);
      const data = await casesApi.fetchCases(params);
      
      console.log("📋 Redux - Received data:", data);
      
      // البيانات تأتي كـ array من Case objects
      if (Array.isArray(data)) {
        const mappedCases = data.map(mapCaseFromApi).filter(c => c !== null);
        console.log("📋 Redux - Mapped cases:", mappedCases.length);
        return mappedCases;
      }
      
      console.warn("📋 Redux - Data is not an array:", typeof data);
      return [];
    } catch (error) {
      console.error("📋 Redux - Error fetching cases:", error);
      console.error("📋 Redux - Error response:", error.response?.data);
      console.error("📋 Redux - Error status:", error.response?.status);
      
      const errorData = error.response?.data;
      let errorMessage = "فشل في جلب الحالات";
      
      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.errors) {
          const errors = errorData.errors;
          if (typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = errors;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("📋 Redux - Final error message:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchCaseById = createAsyncThunk(
  "cases/fetchCaseById",
  async (caseId, { rejectWithValue }) => {
    try {
      const data = await casesApi.fetchCaseById(caseId);
      return mapCaseFromApi(data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * جلب تاريخ الحالة السريرية
 * GET /api/cases/<id>/history/
 */
export const fetchCaseHistory = createAsyncThunk(
  "cases/fetchCaseHistory",
  async (caseId, { rejectWithValue }) => {
    try {
      const data = await casesApi.fetchCaseHistory(caseId);
      return { caseId, history: Array.isArray(data) ? data : [] };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تاريخ الحالة"
      );
    }
  }
);

export const createCase = createAsyncThunk(
  "cases/createCase",
  async (caseData, { rejectWithValue }) => {
    try {
      console.log("📋 Redux - Creating case with data:", caseData);
      const apiData = mapCaseToApiForCreate(caseData);
      console.log("📋 Redux - Mapped API data:", apiData);
      
      const response = await casesApi.createCase(apiData);
      console.log("📋 Redux - API response:", response);
      
      // الاستجابة من API تأتي كـ Case object
      const mappedCase = mapCaseFromApi(response);
      console.log("📋 Redux - Mapped case:", mappedCase);
      
      return mappedCase;
    } catch (error) {
      console.error("📋 Redux - Error creating case:", error);
      console.error("📋 Redux - Error response:", error.response?.data);
      console.error("📋 Redux - Error status:", error.response?.status);
      
      const errorData = error.response?.data;
      let errorMessage = "فشل إنشاء الحالة";
      
      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.errors) {
          const errors = errorData.errors;
          if (typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = errors;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("📋 Redux - Final error message:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCase = createAsyncThunk(
  "cases/updateCase",
  async ({ caseId, ...caseData }, { rejectWithValue }) => {
    try {
      const apiData = mapCaseToApiForUpdate(caseData);
      const response = await casesApi.updateCase(caseId, apiData);
      
      // الاستجابة من API تأتي كـ Case object محدث
      return mapCaseFromApi(response);
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.errors || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteCase = createAsyncThunk(
  "cases/deleteCase",
  async (caseId, { rejectWithValue }) => {
    try {
      await casesApi.deleteCase(caseId);
      return caseId;
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * جلب طلبات الإسناد لحالة محددة
 */
export const fetchAssignmentRequestsAsync = createAsyncThunk(
  "cases/fetchAssignmentRequests",
  async (caseId, { rejectWithValue }) => {
    try {
      const data = await casesApi.fetchAssignmentRequests(caseId);
      return { caseId, requests: Array.isArray(data) ? data : [] };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * إنشاء طلب إسناد
 */
export const createAssignmentRequestAsync = createAsyncThunk(
  "cases/createAssignmentRequest",
  async ({ caseId, message, studentId }, { rejectWithValue }) => {
    try {
      const payload = { message };
      // إذا كان المشرف يحدد طالباً صراحةً
      if (studentId) payload.student_id = studentId;
      const data = await casesApi.requestCaseAssignment(caseId, payload);
      return { caseId, request: data };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.errors || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * تعيين مشرف لحالة سريرية
 * الصلاحيات: university_admin, tech_support, supervisor
 */
export const assignSupervisorToCaseAsync = createAsyncThunk(
  "cases/assignSupervisorToCase",
  async ({ caseId, supervisorId }, { rejectWithValue }) => {
    try {
      const payload = supervisorId ? { supervisor_id: supervisorId } : {};
      const data = await casesApi.assignSupervisorToCase(caseId, payload);
      const mappedCase = mapCaseFromApi(data);
      return { caseId, case: mappedCase };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = 
        errorData?.message || 
        errorData?.detail || 
        errorData?.error ||
        error.message || 
        "فشل في تعيين المشرف";
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * تحديث حالة الحالة السريرية
 * الصلاحيات: supervisor|tech_support|university_admin (scoped)
 * يسمح بتغيير الحالة: accepted, rejected, needs_assignment_approval, assigned, in_progress, completed, closed
 */
export const updateCaseStatusAsync = createAsyncThunk(
  "cases/updateCaseStatus",
  async ({ caseId, status }, { rejectWithValue }) => {
    try {
      const data = await casesApi.updateCaseStatus(caseId, status);
      const mappedCase = mapCaseFromApi(data);
      return { caseId, case: mappedCase };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = 
        errorData?.message || 
        errorData?.detail || 
        errorData?.error ||
        error.message || 
        "فشل في تحديث حالة الحالة";
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * إجراء المشرف (قبول/رفض طلب إسناد)
 */
export const supervisorCaseActionAsync = createAsyncThunk(
  "cases/supervisorCaseAction",
  async ({ caseId, action, studentId, message, userId }, { rejectWithValue }) => {
    try {
      const data = await casesApi.supervisorCaseAction(caseId, {
        action,
        student_id: studentId,
        message,
        user_id: userId,
      });
      return { caseId, caseData: mapCaseFromApi(data) };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.errors || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * ============================================
 * CaseSession Thunks (جلسات الحالة)
 * ============================================
 */

/**
 * جلب جميع جلسات حالة محددة
 */
export const fetchCaseSessionsAsync = createAsyncThunk(
  "cases/fetchCaseSessions",
  async (caseId, { rejectWithValue }) => {
    try {
      const data = await casesApi.fetchCaseSessions(caseId);
      return { caseId, sessions: Array.isArray(data) ? data : [] };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * جلب جلسة محددة
 */
export const fetchCaseSessionByIdAsync = createAsyncThunk(
  "cases/fetchCaseSessionById",
  async ({ caseId, sessionId }, { rejectWithValue }) => {
    try {
      const data = await casesApi.fetchCaseSessionById(caseId, sessionId);
      return { caseId, sessionId, session: data };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * موافقة المشرف على جلسة
 */
export const approveCaseSessionAsync = createAsyncThunk(
  "cases/approveCaseSession",
  async ({ caseId, sessionId, feedback }, { rejectWithValue }) => {
    try {
      const data = await casesApi.approveCaseSession(caseId, sessionId, { feedback });
      return { caseId, sessionId, session: data };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * رفض المشرف لجلسة
 */
export const rejectCaseSessionAsync = createAsyncThunk(
  "cases/rejectCaseSession",
  async ({ caseId, sessionId, feedback, reason }, { rejectWithValue }) => {
    try {
      const data = await casesApi.rejectCaseSession(caseId, sessionId, { feedback, reason });
      return { caseId, sessionId, session: data };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * طلب تعديل من المشرف على جلسة
 */
export const requestCaseSessionModificationAsync = createAsyncThunk(
  "cases/requestCaseSessionModification",
  async ({ caseId, sessionId, feedback, required_modifications }, { rejectWithValue }) => {
    try {
      const data = await casesApi.requestCaseSessionModification(caseId, sessionId, {
        feedback,
        required_modifications,
      });
      return { caseId, sessionId, session: data };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

const clinicalCasesSlice = createSlice({
  name: "clinicalCases",
  initialState: {
    cases: [],
    selectedCase: null,
    assignmentRequests: {}, // { caseId: [requests] }
    caseSessions: {}, // { caseId: [sessions] }
    selectedSession: null,
    loading: false,
    loadingSelected: false,
    loadingSessions: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCase: (state, action) => {
      state.selectedCase = action.payload;
    },
    clearSelectedCase: (state) => {
      state.selectedCase = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCases
      .addCase(fetchCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = action.payload || [];
        state.error = null;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.cases = [];
      })
      // fetchCaseById
      .addCase(fetchCaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.cases.findIndex((c) => c.id === action.payload.id);
          if (index !== -1) {
            state.cases[index] = action.payload;
          } else {
            state.cases.push(action.payload);
          }
        }
        state.error = null;
      })
      .addCase(fetchCaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchCaseHistory
      .addCase(fetchCaseHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseHistory.fulfilled, (state, action) => {
        state.loading = false;
        // حفظ التاريخ في selectedCase إذا كان موجود
        if (state.selectedCase && state.selectedCase.id === action.payload.caseId) {
          state.selectedCase.history = action.payload.history;
        }
        state.error = null;
      })
      .addCase(fetchCaseHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createCase
      .addCase(createCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCase.fulfilled, (state, action) => {
        state.loading = false;
        console.log("📋 Redux - Case created successfully:", action.payload);
        // إضافة الحالة الجديدة إلى القائمة مباشرة
        if (action.payload) {
          // التحقق من عدم وجود الحالة مسبقاً لتجنب التكرار
          const existingIndex = state.cases.findIndex((c) => c.id === action.payload.id);
          if (existingIndex === -1) {
            state.cases.push(action.payload);
          } else {
            // إذا كانت موجودة، نحدثها
            state.cases[existingIndex] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(createCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateCase
      .addCase(updateCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCase.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.cases.findIndex((c) => c.id === action.payload.id);
          if (index !== -1) {
            state.cases[index] = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteCase
      .addCase(deleteCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCase.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = state.cases.filter((c) => c.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchAssignmentRequestsAsync
      .addCase(fetchAssignmentRequestsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentRequestsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { caseId, requests } = action.payload;
        state.assignmentRequests[caseId] = requests;
        state.error = null;
      })
      .addCase(fetchAssignmentRequestsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createAssignmentRequestAsync
      .addCase(createAssignmentRequestAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignmentRequestAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { caseId, request } = action.payload;
        if (!state.assignmentRequests[caseId]) {
          state.assignmentRequests[caseId] = [];
        }
        state.assignmentRequests[caseId].push(request);
        // تحديث الحالة المحددة إذا كانت موجودة
        if (state.selectedCase && state.selectedCase.id === caseId) {
          state.selectedCase = { ...state.selectedCase, assignment_requests: [...(state.selectedCase.assignment_requests || []), request] };
        }
        state.error = null;
      })
      .addCase(createAssignmentRequestAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // supervisorCaseActionAsync
      .addCase(supervisorCaseActionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(supervisorCaseActionAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { caseId, caseData } = action.payload;
        // تحديث الحالة في القائمة
        const index = state.cases.findIndex((c) => c.id === caseId);
        if (index !== -1) {
          state.cases[index] = caseData;
        }
        // تحديث الحالة المحددة
        if (state.selectedCase && state.selectedCase.id === caseId) {
          state.selectedCase = caseData;
        }
        state.error = null;
      })
      .addCase(supervisorCaseActionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // assignSupervisorToCaseAsync
      .addCase(assignSupervisorToCaseAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignSupervisorToCaseAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { caseId, case: caseData } = action.payload;
        // تحديث الحالة في القائمة
        const index = state.cases.findIndex((c) => c.id === caseId);
        if (index !== -1) {
          state.cases[index] = caseData;
        }
        // تحديث الحالة المحددة
        if (state.selectedCase && state.selectedCase.id === caseId) {
          state.selectedCase = caseData;
        }
        state.error = null;
      })
      .addCase(assignSupervisorToCaseAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateCaseStatusAsync
      .addCase(updateCaseStatusAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCaseStatusAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { caseId, case: caseData } = action.payload;
        // تحديث الحالة في القائمة
        const index = state.cases.findIndex((c) => c.id === caseId);
        if (index !== -1) {
          state.cases[index] = caseData;
        }
        // تحديث الحالة المحددة
        if (state.selectedCase && state.selectedCase.id === caseId) {
          state.selectedCase = caseData;
        }
        state.error = null;
      })
      .addCase(updateCaseStatusAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchCaseSessionsAsync
      .addCase(fetchCaseSessionsAsync.pending, (state) => {
        state.loadingSessions = true;
        state.error = null;
      })
      .addCase(fetchCaseSessionsAsync.fulfilled, (state, action) => {
        state.loadingSessions = false;
        const { caseId, sessions } = action.payload;
        state.caseSessions[caseId] = sessions;
        state.error = null;
      })
      .addCase(fetchCaseSessionsAsync.rejected, (state, action) => {
        state.loadingSessions = false;
        state.error = action.payload;
      })
      // fetchCaseSessionByIdAsync
      .addCase(fetchCaseSessionByIdAsync.fulfilled, (state, action) => {
        const { caseId, sessionId, session } = action.payload;
        state.selectedSession = session;
        // تحديث الجلسة في قائمة الجلسات
        if (state.caseSessions[caseId]) {
          const index = state.caseSessions[caseId].findIndex((s) => s.id === sessionId);
          if (index !== -1) {
            state.caseSessions[caseId][index] = session;
          }
        }
      })
      // approveCaseSessionAsync
      .addCase(approveCaseSessionAsync.pending, (state) => {
        state.loadingSessions = true;
        state.error = null;
      })
      .addCase(approveCaseSessionAsync.fulfilled, (state, action) => {
        state.loadingSessions = false;
        const { caseId, sessionId, session } = action.payload;
        // تحديث الجلسة في قائمة الجلسات
        if (state.caseSessions[caseId]) {
          const index = state.caseSessions[caseId].findIndex((s) => s.id === sessionId);
          if (index !== -1) {
            state.caseSessions[caseId][index] = session;
          }
        }
        // تحديث الجلسة المحددة
        if (state.selectedSession && state.selectedSession.id === sessionId) {
          state.selectedSession = session;
        }
        state.error = null;
      })
      .addCase(approveCaseSessionAsync.rejected, (state, action) => {
        state.loadingSessions = false;
        state.error = action.payload;
      })
      // rejectCaseSessionAsync
      .addCase(rejectCaseSessionAsync.pending, (state) => {
        state.loadingSessions = true;
        state.error = null;
      })
      .addCase(rejectCaseSessionAsync.fulfilled, (state, action) => {
        state.loadingSessions = false;
        const { caseId, sessionId, session } = action.payload;
        // تحديث الجلسة في قائمة الجلسات
        if (state.caseSessions[caseId]) {
          const index = state.caseSessions[caseId].findIndex((s) => s.id === sessionId);
          if (index !== -1) {
            state.caseSessions[caseId][index] = session;
          }
        }
        // تحديث الجلسة المحددة
        if (state.selectedSession && state.selectedSession.id === sessionId) {
          state.selectedSession = session;
        }
        state.error = null;
      })
      .addCase(rejectCaseSessionAsync.rejected, (state, action) => {
        state.loadingSessions = false;
        state.error = action.payload;
      })
      // requestCaseSessionModificationAsync
      .addCase(requestCaseSessionModificationAsync.pending, (state) => {
        state.loadingSessions = true;
        state.error = null;
      })
      .addCase(requestCaseSessionModificationAsync.fulfilled, (state, action) => {
        state.loadingSessions = false;
        const { caseId, sessionId, session } = action.payload;
        // تحديث الجلسة في قائمة الجلسات
        if (state.caseSessions[caseId]) {
          const index = state.caseSessions[caseId].findIndex((s) => s.id === sessionId);
          if (index !== -1) {
            state.caseSessions[caseId][index] = session;
          }
        }
        // تحديث الجلسة المحددة
        if (state.selectedSession && state.selectedSession.id === sessionId) {
          state.selectedSession = session;
        }
        state.error = null;
      })
      .addCase(requestCaseSessionModificationAsync.rejected, (state, action) => {
        state.loadingSessions = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedCase, clearSelectedCase } = clinicalCasesSlice.actions;
export default clinicalCasesSlice.reducer;
