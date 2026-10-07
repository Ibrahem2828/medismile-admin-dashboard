import apiClient from "./api";

/**
 * API service للتقارير (Reports)
 * بناءً على التوثيق الكامل لـ Reports API
 */

const REPORTS_BASE_URL = "/reports/";

/**
 * جلب قائمة التقارير
 * GET /api/reports/
 * 
 * حسب التوثيق الجديد:
 * - الصلاحيات: student, supervisor, university_admin, patient
 * - Query Parameters (اختيارية):
 *   - status: حالة التقرير (draft, submitted, approved, rejected, locked)
 *   - report_type: نوع التقرير (clinical_case, etc.)
 *   - target_type: نوع الهدف (case, appointment, etc.)
 *   - target_id: معرف الهدف (case_id, appointment_id, etc.)
 * 
 * يعيد: { status: "success", data: [...] }
 */
export const fetchReports = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Query Parameters الجديدة حسب التوثيق
    if (params.status) queryParams.append("status", params.status);
    if (params.report_type) queryParams.append("report_type", params.report_type);
    if (params.target_type) queryParams.append("target_type", params.target_type);
    if (params.target_id) queryParams.append("target_id", params.target_id);
    
    // Query Parameters القديمة (للتوافق)
    if (params.student_id) queryParams.append("student_id", params.student_id);
    if (params.is_active !== undefined) queryParams.append("is_active", params.is_active);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${REPORTS_BASE_URL}?${queryString}` : REPORTS_BASE_URL;
    
    const response = await apiClient.get(url);
    
    // الاستجابة تأتي بصيغة { status: "success", data: [...] }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // للتوافق مع النظام القديم
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.warn("Unexpected reports API response format:", response.data);
    }
    return [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching reports:", error);
    }
    throw error;
  }
};

/**
 * جلب تقرير محدد
 * GET /api/reports/{id}/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + Bearer Token (role = university_admin)
 * - مسؤول الجامعة: يمكنه عرض تقرير واحد فقط إذا كان التقرير تابعًا لجامعته
 *   ⚠️ مهم: Backend يتحقق تلقائياً من أن التقرير يخص جامعته من Token
 *   ⚠️ إذا حاول المستخدم الوصول لتقرير من جامعة أخرى، يعيد Backend خطأ 403/404
 * 
 * @param {string} id - ID التقرير (UUID)
 * @returns {Promise<Object>} Report object
 * @throws {Error} إذا كان التقرير لا يخص جامعة المستخدم أو غير موجود
 */
export const fetchReportById = async (id) => {
  try {
    const response = await apiClient.get(`${REPORTS_BASE_URL}${id}/`);
    
    // الاستجابة قد تأتي بصيغة {data: {...}}
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching report by ID:", error);
    }
    throw error;
  }
};

/**
 * إنشاء تقرير جديد (Draft)
 * POST /api/reports/
 * 
 * حسب التوثيق الجديد:
 * - الصلاحيات: student, supervisor, university_admin
 * - Request: { report_type, target_type, target_id, title, description, content, attachments }
 * - Response: { status: "success", data: { id, status: "draft", ... } }
 */
export const createReport = async (data) => {
  try {
    const response = await apiClient.post(REPORTS_BASE_URL, data);
    
    // الاستجابة تأتي بصيغة { status: "success", data: {...} }
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating report:", error);
    }
    throw error;
  }
};

/**
 * تحديث تقرير (Draft/Rejected فقط)
 * PATCH /api/reports/{id}/
 * 
 * حسب التوثيق الجديد:
 * - الصلاحيات: student, supervisor, university_admin
 * - فقط التقارير بحالة draft أو rejected يمكن تحديثها
 * - Request: { title, content, description, ... }
 * - Response: { status: "success", data: { id, status: "draft", ... } }
 */
export const updateReport = async (id, data) => {
  try {
    const response = await apiClient.patch(`${REPORTS_BASE_URL}${id}/`, data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating report:", error);
    }
    throw error;
  }
};

/**
 * تقديم تقرير (Submit)
 * POST /api/reports/{id}/submit/
 * 
 * حسب التوثيق الجديد:
 * - الصلاحيات: student, supervisor, university_admin
 * - Response: { status: "success", data: { id, status: "submitted" } }
 */
export const submitReport = async (id) => {
  try {
    const response = await apiClient.post(`${REPORTS_BASE_URL}${id}/submit/`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error submitting report:", error);
    }
    throw error;
  }
};

/**
 * تصدير تقرير (Export)
 * POST /api/reports/{id}/export/
 * 
 * حسب التوثيق الجديد:
 * - الصلاحيات: university_admin فقط
 * - Request: { format: "pdf" }
 * - Response: { status: "success", data: { file_url: "/media/exports/report_<uuid>.pdf" } }
 */
export const exportReport = async (id, format = "pdf") => {
  try {
    const response = await apiClient.post(`${REPORTS_BASE_URL}${id}/export/`, { format });
    
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error exporting report:", error);
    }
    throw error;
  }
};

/**
 * حذف تقرير (Soft Delete)
 * DELETE /api/reports/<report_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - يتم إخفاء التقرير (is_active = False) بدلاً من الحذف الفعلي
 */
export const deleteReport = async (id) => {
  try {
    await apiClient.delete(`${REPORTS_BASE_URL}${id}/`);
    return id;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting report:", error);
    }
    throw error;
  }
};

/**
 * جلب تقارير طالب محدد
 * GET /api/reports/student/<student_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 */
export const fetchStudentReports = async (studentId) => {
  try {
    const response = await apiClient.get(
      `${REPORTS_BASE_URL}student/${studentId}/`
    );
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching student reports:", error);
    }
    throw error;
  }
};

/**
 * جلب تقارير جامعة محددة
 * GET /api/reports/university/<university_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 */
export const fetchUniversityReports = async (universityId) => {
  try {
    const response = await apiClient.get(
      `${REPORTS_BASE_URL}university/${universityId}/`
    );
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching university reports:", error);
    }
    throw error;
  }
};















