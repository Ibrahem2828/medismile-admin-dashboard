import apiClient from "./api";

/**
 * API service للحالات السريرية (Clinical Cases)
 * يتوافق مع Django REST Framework endpoints
 */

const CASES_BASE_URL = "/cases/";

/**
 * جلب جميع الحالات السريرية
 * GET /api/cases/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - الفلترة حسب الدور:
 *   - مسؤول الجامعة: جميع حالات جامعته (يتم الفلترة تلقائياً من Backend حسب university_id من Token)
 *   - المشرف: حالاته المسندة إليه
 *   - الطالب: حالاته المسندة إليه
 * - Query Parameters: status, priority, is_public
 * 
 * ملاحظة: Backend يفلتر تلقائياً حسب university_id من Token، لذا لا حاجة لإرسال university_id في params
 * 
 * @param {Object} params - Query parameters: { status, priority, is_public }
 * @returns {Promise<Array>} Array of Case objects
 */
export const fetchCases = async (params = {}) => {
  try {
    console.log("📋 Fetching cases with params:", params);
    console.log("📋 API Base URL:", apiClient.defaults.baseURL);
    console.log("📋 Full URL:", `${apiClient.defaults.baseURL}${CASES_BASE_URL}`);
    
    const response = await apiClient.get(CASES_BASE_URL, { params });
    
    console.log("📋 Cases API Response:", response.data);
    console.log("📋 Response status:", response.status);
    
    // الاستجابة قد تأتي بصيغة {status: "success", message: "...", data: [...]}
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log("📋 Found cases in data.data:", response.data.data.length);
      return response.data.data;
    }
    
    // أو مباشرة كـ array
    if (Array.isArray(response.data)) {
      console.log("📋 Found cases as direct array:", response.data.length);
      return response.data;
    }
    
    // أو في results (pagination)
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log("📋 Found cases in results:", response.data.results.length);
      return response.data.results;
    }
    
    console.warn("📋 No cases found in response");
    return [];
  } catch (error) {
    console.error("📋 Error fetching cases:", error);
    console.error("📋 Error response:", error.response?.data);
    console.error("📋 Error status:", error.response?.status);
    throw error;
  }
};

/**
 * جلب حالة سريرية محددة بالتفصيل
 * GET /api/cases/<id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يمكنه عرض تفاصيل حالات جامعته
 * - يتضمن: history, assignment_requests, sessions
 * 
 * @param {string} caseId - UUID للحالة
 * يعيد: Case object أو {status: "success", data: {...}}
 */
export const fetchCaseById = async (caseId) => {
  try {
    const response = await apiClient.get(`${CASES_BASE_URL}${caseId}/`);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching case by ID:", error);
    throw error;
  }
};

/**
 * جلب تاريخ الحالة السريرية
 * GET /api/cases/<id>/history/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يمكنه عرض تاريخ حالات جامعته
 * 
 * @param {string} caseId - UUID للحالة
 * يعيد: Array of history entries أو {status: "success", data: [...]}
 */
export const fetchCaseHistory = async (caseId) => {
  try {
    const response = await apiClient.get(`${CASES_BASE_URL}${caseId}/history/`);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: [...]}
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // أو مباشرة كـ array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // أو في results (pagination)
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching case history:", error);
    throw error;
  }
};

/**
 * إنشاء حالة سريرية جديدة
 * POST /api/cases/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يمكنه إنشاء حالات ضمن جامعته
 * 
 * الحقول المطلوبة:
 * - title: string (مطلوب)
 * - description: string (مطلوب)
 * 
 * الحقول الاختيارية:
 * - priority: string (low, medium, high)
 * - is_public: boolean
 * - patient_id: string (UUID)
 * 
 * @param {Object} caseData - بيانات الحالة { title, description, priority?, is_public?, patient_id? }
 * يعيد: Case object أو {status: "success", data: {...}}
 */
export const createCase = async (caseData) => {
  try {
    console.log("📋 Creating case with data:", caseData);
    console.log("📋 API Base URL:", apiClient.defaults.baseURL);
    console.log("📋 Full URL:", `${apiClient.defaults.baseURL}${CASES_BASE_URL}`);
    
    const response = await apiClient.post(CASES_BASE_URL, caseData);
    
    console.log("📋 Create case API Response:", response.data);
    console.log("📋 Response status:", response.status);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
    if (response.data && response.data.data) {
      console.log("📋 Found case in data.data");
      return response.data.data;
    }
    
    // أو مباشرة كـ Case object
    if (response.data && response.data.id) {
      console.log("📋 Found case as direct object");
      return response.data;
    }
    
    console.warn("📋 Unexpected response format:", response.data);
    return response.data;
  } catch (error) {
    console.error("📋 Error creating case:", error);
    console.error("📋 Error response:", error.response?.data);
    console.error("📋 Error status:", error.response?.status);
    throw error;
  }
};

/**
 * تحديث حالة سريرية
 * PATCH /api/v1/cases/<uuid:pk>/
 * @param {string} caseId - UUID للحالة
 * @param {Object} caseData - بيانات الحالة المحدثة { title, description, status, priority, is_public }
 * يعيد: Case object محدث أو {status: "success", data: {...}}
 */
export const updateCase = async (caseId, caseData) => {
  const response = await apiClient.patch(`${CASES_BASE_URL}${caseId}/`, caseData);
  
  // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * حذف حالة سريرية
 * DELETE /api/v1/cases/<uuid:pk>/
 * @param {string} caseId - UUID للحالة
 */
export const deleteCase = async (caseId) => {
  await apiClient.delete(`${CASES_BASE_URL}${caseId}/`);
  return caseId;
};

/**
 * جلب طلبات الإسناد لحالة محددة
 * GET /api/v1/cases/<case_id>/assignment-requests/
 * @param {string} caseId - UUID للحالة
 */
export const fetchAssignmentRequests = async (caseId) => {
  const response = await apiClient.get(`${CASES_BASE_URL}${caseId}/assignment-requests/`);
  
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

/**
 * إنشاء طلب إسناد لحالة
 * POST /api/v1/cases/<case_id>/assignment-requests/
 * @param {string} caseId - UUID للحالة
 * @param {Object} requestData - { message?: string, student_id?: string }
 * ملاحظة: حسب CaseAssignmentRequestCreateSerializer، الحقول: case, message, student_id
 */
export const createAssignmentRequest = async (caseId, requestData = {}) => {
  // إضافة case_id إلى البيانات المرسلة
  const payload = {
    case: caseId,
    ...requestData,
  };
  
  const response = await apiClient.post(`${CASES_BASE_URL}${caseId}/assignment-requests/`, payload);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * طلب إسناد بديل (Function View)
 * POST /api/v1/cases/<case_id>/request-assign/
 * @param {string} caseId - UUID للحالة
 * @param {Object} requestData - { message?: string }
 */
export const requestCaseAssignment = async (caseId, requestData = {}) => {
  // حسب CaseAssignmentRequestCreateSerializer، الحقول: case, message, student_id
  // إضافة case_id إلى البيانات المرسلة
  const payload = {
    case: caseId,
    ...requestData,
  };
  
  const response = await apiClient.post(`${CASES_BASE_URL}${caseId}/request-assign/`, payload);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * جلب تفاصيل طلب إسناد
 * GET /api/v1/cases/assignment-requests/<request_id>/
 * @param {string} requestId - UUID لطلب الإسناد
 */
export const fetchAssignmentRequestById = async (requestId) => {
  const response = await apiClient.get(`${CASES_BASE_URL}assignment-requests/${requestId}/`);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * تحديث طلب إسناد
 * PUT/PATCH /api/v1/cases/assignment-requests/<request_id>/
 * @param {string} requestId - UUID لطلب الإسناد
 * @param {Object} requestData - { status?: string, message?: string }
 */
export const updateAssignmentRequest = async (requestId, requestData) => {
  // حسب CaseAssignmentRequestUpdateSerializer، الحقول: status, supervisor_response
  const response = await apiClient.patch(`${CASES_BASE_URL}assignment-requests/${requestId}/`, requestData);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * تعيين مشرف لحالة سريرية
 * PATCH /api/cases/{case_id}/assign-supervisor/
 * الصلاحيات: Bearer (supervisor / tech_support / university_admin per permissions)
 * @param {string} caseId - UUID للحالة
 * @param {Object} assignData - { supervisor_id?: string (optional if requester is supervisor) }
 * @returns {Promise<Object>} Case object محدث
 */
export const assignSupervisorToCase = async (caseId, assignData = {}) => {
  try {
    console.log("📋 Assigning supervisor to case:", caseId, assignData);
    
    const response = await apiClient.patch(
      `${CASES_BASE_URL}${caseId}/assign-supervisor/`,
      assignData
    );
    
    console.log("📋 Assign supervisor response:", response.data);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // أو مباشرة كـ Case object
    return response.data;
  } catch (error) {
    console.error("📋 Error assigning supervisor to case:", error);
    console.error("📋 Error response:", error.response?.data);
    throw error;
  }
};

/**
 * إجراء المشرف (قبول/رفض طلب إسناد)
 * POST /api/v1/cases/<case_id>/supervisor-action/
 * @param {string} caseId - UUID للحالة
 * @param {Object} actionData - { action: "accept" | "reject", student_id: string, message?: string, user_id?: string }
 */
export const supervisorCaseAction = async (caseId, actionData) => {
  const response = await apiClient.post(`${CASES_BASE_URL}${caseId}/supervisor-action/`, actionData);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * ============================================
 * CaseSession APIs (جلسات الحالة)
 * ============================================
 */

/**
 * جلب جميع جلسات حالة محددة
 * GET /api/v1/cases/<case_id>/sessions/
 * @param {string} caseId - UUID للحالة
 */
export const fetchCaseSessions = async (caseId) => {
  const response = await apiClient.get(`${CASES_BASE_URL}${caseId}/sessions/`);
  
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  if (response.data && response.data.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  
  return [];
};

/**
 * جلب جلسة محددة
 * GET /api/v1/cases/<case_id>/sessions/<session_id>/
 * @param {string} caseId - UUID للحالة
 * @param {string} sessionId - UUID للجلسة
 */
export const fetchCaseSessionById = async (caseId, sessionId) => {
  const response = await apiClient.get(`${CASES_BASE_URL}${caseId}/sessions/${sessionId}/`);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * موافقة المشرف على جلسة
 * POST /api/v1/cases/<case_id>/sessions/<session_id>/approve/
 * @param {string} caseId - UUID للحالة
 * @param {string} sessionId - UUID للجلسة
 * @param {Object} data - { feedback?: string }
 */
export const approveCaseSession = async (caseId, sessionId, data = {}) => {
  const response = await apiClient.post(`${CASES_BASE_URL}${caseId}/sessions/${sessionId}/approve/`, data);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * رفض المشرف لجلسة
 * POST /api/v1/cases/<case_id>/sessions/<session_id>/reject/
 * @param {string} caseId - UUID للحالة
 * @param {string} sessionId - UUID للجلسة
 * @param {Object} data - { feedback?: string, reason?: string }
 */
export const rejectCaseSession = async (caseId, sessionId, data = {}) => {
  const response = await apiClient.post(`${CASES_BASE_URL}${caseId}/sessions/${sessionId}/reject/`, data);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * طلب تعديل من المشرف على جلسة
 * POST /api/v1/cases/<case_id>/sessions/<session_id>/request-modification/
 * @param {string} caseId - UUID للحالة
 * @param {string} sessionId - UUID للجلسة
 * @param {Object} data - { feedback: string, required_modifications?: string }
 */
export const requestCaseSessionModification = async (caseId, sessionId, data = {}) => {
  const response = await apiClient.post(`${CASES_BASE_URL}${caseId}/sessions/${sessionId}/request-modification/`, data);
  
  if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * تحديث حالة الحالة السريرية
 * PATCH /api/cases/<id>/status/
 * 
 * حسب التوثيق:
 * - الصلاحيات: supervisor|tech_support|university_admin (scoped)
 * - يسمح بتغيير الحالة: accepted, rejected, needs_assignment_approval, assigned, in_progress, completed, closed
 * 
 * @param {string} caseId - UUID للحالة
 * @param {string} status - الحالة الجديدة (accepted|rejected|needs_assignment_approval|assigned|in_progress|completed|closed)
 * @returns {Promise<Object>} Case object محدث
 */
export const updateCaseStatus = async (caseId, status) => {
  try {
    console.log("📋 Updating case status:", caseId, status);
    
    const response = await apiClient.patch(
      `${CASES_BASE_URL}${caseId}/status/`,
      { status }
    );
    
    console.log("📋 Update case status response:", response.data);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // أو مباشرة كـ Case object
    return response.data;
  } catch (error) {
    console.error("📋 Error updating case status:", error);
    console.error("📋 Error response:", error.response?.data);
    throw error;
  }
};

