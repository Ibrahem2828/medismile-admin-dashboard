import apiClient from "./api";

/**
 * API service للتقييمات (Evaluations)
 * بناءً على التوثيق الكامل لـ API
 */

const EVALUATIONS_BASE_URL = "/evaluations/";

/**
 * جلب جميع التقييمات
 * GET /api/evaluations/
 * 
 * Query Parameters (حسب التوثيق الجديد):
 * - status: حالة التقييم (created, adjusted, finalized)
 * - target_type: نوع الهدف (appointment, case, student, supervisor)
 * - evaluator_role: دور المقيم (patient, student, supervisor, university_admin)
 * - student_id: فلترة حسب الطالب الذي تم تقييمه
 * - target_id: فلترة حسب الهدف (appointment_id, case_id, etc.)
 * 
 * الاستجابة: { status: "success", data: [...] }
 */
export const fetchEvaluations = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Query Parameters الجديدة حسب التوثيق
  if (params.status) {
    queryParams.append("status", params.status);
  }
  if (params.target_type) {
    queryParams.append("target_type", params.target_type);
  }
  if (params.evaluator_role) {
    queryParams.append("evaluator_role", params.evaluator_role);
  }
  if (params.student_id) {
    queryParams.append("student_id", params.student_id);
  }
  if (params.target_id) {
    queryParams.append("target_id", params.target_id);
  }
  
  // Query Parameters القديمة (للتوافق)
  if (params.evaluator_type) {
    queryParams.append("evaluator_type", params.evaluator_type);
  }
  if (params.patient_id) {
    queryParams.append("patient_id", params.patient_id);
  }
  if (params.appointment_id) {
    queryParams.append("appointment_id", params.appointment_id);
  }
  
  const queryString = queryParams.toString();
  const url = queryString ? `${EVALUATIONS_BASE_URL}?${queryString}` : EVALUATIONS_BASE_URL;
  
  const response = await apiClient.get(url);
  
  // الاستجابة تأتي بصيغة { status: "success", data: [...] }
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  // أو كمصفوفة مباشرة (للتوافق مع النظام القديم)
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

/**
 * جلب تفاصيل تقييم محدد
 * GET /api/evaluations/<id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يمكنه عرض تقييمات طلاب جامعته فقط
 *   (Backend يتحقق تلقائياً من أن التقييم يخص جامعته)
 * 
 * @param {string} evaluationId - ID التقييم
 * يعيد: Evaluation object
 */
export const fetchEvaluationById = async (evaluationId) => {
  try {
    const response = await apiClient.get(`${EVALUATIONS_BASE_URL}${evaluationId}/`);
    
    // الاستجابة قد تأتي بصيغة {data: {...}}
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching evaluation by ID:", error);
    }
    throw error;
  }
};

/**
 * إنشاء تقييم جديد (النظام الجديد حسب التوثيق)
 * POST /api/v1/evaluations/
 * @param {Object} evaluationData - بيانات التقييم
 * {
 *   student_id: string (uuid, required),
 *   target_type: string (required) - "case" | "session" | "appointment",
 *   case_id?: string (uuid, required if target_type === "case"),
 *   session_id?: string (uuid, required if target_type === "session"),
 *   appointment_id?: string (uuid, required if target_type === "appointment"),
 *   score: number (0-100, required),
 *   rubric?: object (JSON),
 *   comment?: string (nullable)
 * }
 */
export const createEvaluation = async (evaluationData) => {
  const response = await apiClient.post(EVALUATIONS_BASE_URL, evaluationData);
  return response.data?.data || response.data;
};

/**
 * تحديث تقييم (فقط المسودات)
 * PATCH /api/v1/evaluations/<evaluation_id>/
 */
export const updateEvaluation = async (evaluationId, evaluationData) => {
  const response = await apiClient.patch(`${EVALUATIONS_BASE_URL}${evaluationId}/`, evaluationData);
  return response.data?.data || response.data;
};

/**
 * جلب تقييم الطالب العام (Student Rating)
 * GET /api/evaluations/students/{id}/rating/
 * 
 * حسب التوثيق:
 * - الصلاحيات: patient, student, supervisor, university_admin
 * - Response: { status: "success", data: { student_id, final_rating, total_evaluations, components: {...} } }
 */
export const fetchStudentRating = async (studentId) => {
  try {
    const response = await apiClient.get(
      `${EVALUATIONS_BASE_URL}students/${studentId}/rating/`
    );
    
    // الاستجابة تأتي بصيغة { status: "success", data: {...} }
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching student rating:", error);
    }
    throw error;
  }
};

/**
 * جلب إحصائيات التقييمات لطالب محدد (قديم - للتوافق)
 * GET /api/evaluations/students/<student_id>/statistics/
 * 
 * @deprecated استخدم fetchStudentRating بدلاً منها
 */
export const fetchStudentStatistics = async (studentId) => {
  try {
    const response = await apiClient.get(
      `${EVALUATIONS_BASE_URL}students/${studentId}/statistics/`
    );
    
    // الاستجابة قد تأتي بصيغة {data: {...}}
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching student statistics:", error);
    }
    throw error;
  }
};

/**
 * @deprecated استخدم fetchStudentStatistics بدلاً منها
 * جلب متوسط تقييمات طالب معين (قديم)
 * GET /api/v1/evaluations/students/<uuid:student_id>/average-ratings/
 */
export const fetchStudentAverageRatings = async (studentId) => {
  // إعادة توجيه للـ endpoint الجديد
  return fetchStudentStatistics(studentId);
};

/**
 * تقديم تقييم (Submit) - نقل من draft إلى submitted
 * POST /api/v1/evaluations/<evaluation_id>/submit/
 */
export const submitEvaluation = async (evaluationId) => {
  const response = await apiClient.post(`${EVALUATIONS_BASE_URL}${evaluationId}/submit/`);
  return response.data?.data || response.data;
};

/**
 * تعديل التقييم (Adjust) - لمسؤول الجامعة والمشرف
 * PATCH /api/evaluations/{id}/adjust/
 * 
 * Request: { new_score: 90, reason: "Adjusted after review" }
 * Response: { status: "success", data: { id, status: "adjusted" } }
 */
export const adjustEvaluation = async (evaluationId, adjustmentData) => {
  const response = await apiClient.patch(
    `${EVALUATIONS_BASE_URL}${evaluationId}/adjust/`,
    adjustmentData
  );
  return response.data?.data || response.data;
};

/**
 * إقرار التقييم (Finalize) - لمسؤول الجامعة فقط
 * POST /api/evaluations/{id}/finalize/
 * 
 * Response: { status: "success", data: { id, status: "finalized" } }
 */
export const finalizeEvaluation = async (evaluationId) => {
  const response = await apiClient.post(`${EVALUATIONS_BASE_URL}${evaluationId}/finalize/`);
  return response.data?.data || response.data;
};





















