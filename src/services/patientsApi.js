import apiClient from "./api";

/**
 * API service للمرضى (Patients)
 * بناءً على Views من Backend
 */

const PATIENTS_BASE_URL = "/accounts/patients/";

/**
 * جلب جميع المرضى
 * GET /api/v1/accounts/patients/
 * يعيد: {status: "success", message: "...", data: [...]}
 */
export const fetchPatients = async () => {
  const response = await apiClient.get(PATIENTS_BASE_URL);
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: [...]}
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  return [];
};

/**
 * جلب تفاصيل مريض محدد
 * GET /api/v1/accounts/patients/{user_id}/
 * يعيد: {status: "success", message: "...", data: {...}}
 */
export const fetchPatientById = async (userId) => {
  const response = await apiClient.get(`${PATIENTS_BASE_URL}${userId}/`);
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: {...}}
  return response.data?.data || response.data;
};

/**
 * إنشاء مريض جديد
 * POST /api/v1/accounts/patients/create/
 * يعيد: {status: "success", message: "...", data: {...}}
 * @param {Object} patientData - بيانات المريض حسب PatientCreateSerializer
 * {
 *   username: string,
 *   email: string,
 *   password: string,
 *   password_confirm: string,
 *   first_name: string,
 *   last_name: string
 * }
 */
export const createPatient = async (patientData) => {
  const response = await apiClient.post(`${PATIENTS_BASE_URL}create/`, patientData);
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: {...}}
  // data يحتوي على PatientDetailSerializer
  return response.data?.data || response.data;
};

/**
 * تحديث بيانات مريض
 * PATCH /api/v1/accounts/patients/{user_id}/update/
 * يعيد: {status: "success", message: "...", data: {...}}
 * @param {string} userId - ID المريض
 * @param {Object} patientData - بيانات المريض المحدثة حسب PatientUpdateSerializer
 * {
 *   phone_number?: string,
 *   address?: string,
 *   date_of_birth?: string (YYYY-MM-DD),
 *   gender?: string (male/female),
 *   profile_picture?: string,
 *   medical_history?: string,
 *   allergies?: string,
 *   medications?: string,
 *   emergency_contact_name?: string,
 *   emergency_contact_phone?: string
 * }
 */
export const updatePatient = async (userId, patientData) => {
  const response = await apiClient.patch(`${PATIENTS_BASE_URL}${userId}/update/`, patientData);
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: {...}}
  // data يحتوي على PatientDetailSerializer
  return response.data?.data || response.data;
};

/**
 * حذف مريض
 * DELETE /api/v1/accounts/patients/{user_id}/delete/
 * يعيد: {status: "success", message: "..."}
 * @param {string} userId - ID المريض
 */
export const deletePatient = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required for deletion");
  }
  
  await apiClient.delete(`${PATIENTS_BASE_URL}${userId}/delete/`);
  return userId;
};
