import apiClient from "./api";

/**
 * API service للمواد الدراسية (Subjects/Courses)
 * يتوافق مع Django REST Framework endpoints
 */

const SUBJECTS_BASE_URL = "/subjects/";

/**
 * جلب جميع المواد الدراسية
 * GET /api/v1/subjects/
 * @param {Object} params - Query parameters: { university_id, supervisor_id, student_id }
 * يعيد: Array of Subject objects
 */
export const fetchSubjects = async (params = {}) => {
  try {
    const response = await apiClient.get(SUBJECTS_BASE_URL, { params });
    
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
    // إذا كان endpoint غير موجود (404)، نعيد قائمة فارغة بدلاً من throw error
    if (error.response?.status === 404) {
      console.warn("📚 Subjects API endpoint not found (404) - Returning empty array. Please add the endpoint in Backend.");
      return [];
    }
    console.error("📚 Error fetching subjects:", error);
    throw error;
  }
};

/**
 * جلب مادة دراسية محددة
 * GET /api/v1/subjects/<id>/
 */
export const fetchSubjectById = async (subjectId) => {
  try {
    const response = await apiClient.get(`${SUBJECTS_BASE_URL}${subjectId}/`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error fetching subject:", error);
    throw error;
  }
};

/**
 * إنشاء مادة دراسية جديدة
 * POST /api/v1/subjects/
 * @param {Object} subjectData - بيانات المادة
 * {
 *   name: string,
 *   code: string,
 *   description?: string,
 *   university_id: number
 * }
 */
export const createSubject = async (subjectData) => {
  try {
    const response = await apiClient.post(SUBJECTS_BASE_URL, subjectData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error creating subject:", error);
    throw error;
  }
};

/**
 * تحديث مادة دراسية
 * PATCH /api/v1/subjects/<id>/
 */
export const updateSubject = async (subjectId, subjectData) => {
  try {
    const response = await apiClient.patch(`${SUBJECTS_BASE_URL}${subjectId}/`, subjectData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error updating subject:", error);
    throw error;
  }
};

/**
 * حذف مادة دراسية
 * DELETE /api/v1/subjects/<id>/
 */
export const deleteSubject = async (subjectId) => {
  try {
    await apiClient.delete(`${SUBJECTS_BASE_URL}${subjectId}/`);
    return { success: true };
  } catch (error) {
    console.error("📚 Error deleting subject:", error);
    throw error;
  }
};

/**
 * تعيين مشرف لمادة دراسية
 * POST /api/v1/subjects/<subject_id>/assign-supervisor/
 * @param {number} subjectId - ID المادة
 * @param {number} supervisorId - ID المشرف
 */
export const assignSupervisor = async (subjectId, supervisorId) => {
  try {
    const response = await apiClient.post(
      `${SUBJECTS_BASE_URL}${subjectId}/assign-supervisor/`,
      { supervisor_id: supervisorId }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error assigning supervisor:", error);
    throw error;
  }
};

/**
 * إزالة مشرف من مادة دراسية
 * POST /api/v1/subjects/<subject_id>/remove-supervisor/
 */
export const removeSupervisor = async (subjectId, supervisorId) => {
  try {
    const response = await apiClient.post(
      `${SUBJECTS_BASE_URL}${subjectId}/remove-supervisor/`,
      { supervisor_id: supervisorId }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error removing supervisor:", error);
    throw error;
  }
};

/**
 * تسجيل طالب في مادة دراسية
 * POST /api/v1/subjects/<subject_id>/enroll-student/
 * @param {number} subjectId - ID المادة
 * @param {number} studentId - ID الطالب
 */
export const enrollStudent = async (subjectId, studentId) => {
  try {
    const response = await apiClient.post(
      `${SUBJECTS_BASE_URL}${subjectId}/enroll-student/`,
      { student_id: studentId }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error enrolling student:", error);
    throw error;
  }
};

/**
 * إلغاء تسجيل طالب من مادة دراسية
 * POST /api/v1/subjects/<subject_id>/unenroll-student/
 */
export const unenrollStudent = async (subjectId, studentId) => {
  try {
    const response = await apiClient.post(
      `${SUBJECTS_BASE_URL}${subjectId}/unenroll-student/`,
      { student_id: studentId }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 Error unenrolling student:", error);
    throw error;
  }
};

