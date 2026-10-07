import apiClient from "./api";

/**
 * API service للمشرفين (Supervisors)
 * بناءً على التوثيق الكامل لـ API
 */

const SUPERVISORS_BASE_URL = "/accounts/university/supervisors/";

/**
 * جلب جميع المشرفين
 * GET /api/accounts/university/supervisors/
 * يعيد: {status: "success", message: "...", data: [...]}
 */
export const fetchSupervisors = async () => {
  const response = await apiClient.get("/accounts/university/supervisors/");
  
  let supervisorsData = [];
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: [...]}
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    supervisorsData = response.data.data;
  } else if (Array.isArray(response.data)) {
    supervisorsData = response.data;
  }
  
  return supervisorsData;
};

/**
 * جلب تفاصيل مشرف محدد
 * GET /api/accounts/university/supervisors/manage/<user_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * - مسؤول الجامعة: يمكنه عرض تفاصيل مشرفي جامعته
 * 
 * @param {string} userId - ID المشرف
 * يعيد: {status: "success", message: "...", data: {...}}
 */
export const fetchSupervisorById = async (userId) => {
  const response = await apiClient.get(`${SUPERVISORS_BASE_URL}manage/${userId}/`);
  
  return response.data?.data || response.data;
};

/**
 * إنشاء مشرف جديد
 * POST /api/accounts/create/supervisor/
 * يعيد: {status: "success", message: "...", data: {...}}
 * @param {Object} supervisorData - بيانات المشرف الجديد
 * {
 *   email: string (مطلوب),
 *   username: string (مطلوب),
 *   first_name: string (مطلوب),
 *   last_name: string (مطلوب),
 *   university: string (uuid, مطلوب),
 *   university_name: string (مطلوب)
 * }
 */
export const createSupervisor = async (supervisorData) => {
  // تنظيف university ID - إزالة أي : أو رموز غير صالحة
  let universityId = supervisorData.university || supervisorData.university_id;
  
  // إذا كانت القيمة تحتوي على :، نزيلها
  if (universityId && typeof universityId === 'string') {
    universityId = universityId.replace(/^:/, '').trim();
  }
  
  // التحقق من أن university ID موجود وصحيح
  if (!universityId) {
    throw new Error("University ID is required");
  }
  
  // تحويل university_id إلى university إذا كان موجوداً
  const requestData = {
    email: supervisorData.email,
    username: supervisorData.username,
    password: supervisorData.password, // مطلوب حسب API
    password_confirm: supervisorData.password_confirm, // مطلوب حسب API
    first_name: supervisorData.first_name,
    last_name: supervisorData.last_name,
    university: universityId,
    university_name: supervisorData.university_name,
    // الحقول الاختيارية
    ...(supervisorData.department && { department: supervisorData.department }),
    ...(supervisorData.position && { position: supervisorData.position }),
    ...(supervisorData.license_number && { license_number: supervisorData.license_number }),
    ...(supervisorData.phone_number && { phone_number: supervisorData.phone_number }),
    ...(supervisorData.address && { address: supervisorData.address }),
    ...(supervisorData.date_of_birth && { date_of_birth: supervisorData.date_of_birth }),
    ...(supervisorData.gender && { gender: supervisorData.gender }),
  };
  
  // التحقق من أن جميع الحقول المطلوبة موجودة
  if (!requestData.email || !requestData.username || !requestData.password || !requestData.password_confirm || !requestData.first_name || !requestData.last_name || !requestData.university || !requestData.university_name) {
    throw new Error("All required fields must be provided (email, username, password, password_confirm, first_name, last_name, university, university_name)");
  }
  
  // Logging في development mode للتحقق من البيانات
  if (process.env.NODE_ENV === "development") {
    console.log("📝 [createSupervisor] Input supervisorData:", supervisorData);
    console.log("📝 [createSupervisor] Cleaned universityId:", universityId);
    console.log("📝 [createSupervisor] Final requestData:", requestData);
    console.log("📝 [createSupervisor] URL:", "/accounts/create/supervisor/");
    console.log("📝 [createSupervisor] Request will be POST to:", `${apiClient.defaults.baseURL}/accounts/create/supervisor/`);
  }
  
  // التأكد من أن الـ URL لا يحتوي على university ID
  const url = "/accounts/create/supervisor/";
  
  // التأكد من أن requestData.university هو UUID صحيح وليس :1
  if (requestData.university && (requestData.university.startsWith(':') || requestData.university === '1' || requestData.university.length < 10)) {
    console.error("❌ [createSupervisor] Invalid university ID format:", requestData.university);
    throw new Error(`Invalid university ID format: ${requestData.university}. Expected UUID format.`);
  }
  
  const response = await apiClient.post(url, requestData);
  
  if (process.env.NODE_ENV === "development") {
    console.log("✅ [createSupervisor] Response:", response.data);
  }
  
  return response.data?.data || response.data;
};

/**
 * تحديث مشرف
 * PATCH /api/accounts/university/supervisors/manage/<user_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * - مسؤول الجامعة: يمكنه تحديث مشرفي جامعته فقط
 * 
 * @param {string} userId - ID المشرف
 * @param {Object} supervisorData - بيانات المشرف المحدثة
 * يعيد: {status: "success", message: "...", data: {...}}
 */
export const updateSupervisor = async (userId, supervisorData) => {
  const response = await apiClient.patch(`${SUPERVISORS_BASE_URL}manage/${userId}/`, supervisorData);
  
  return response.data?.data || response.data;
};

/**
 * حذف مشرف
 * DELETE /api/accounts/university/supervisors/manage/<user_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * - مسؤول الجامعة: يمكنه حذف مشرفي جامعته فقط
 * 
 * @param {string} userId - ID المشرف
 * يعيد: {status: "success", message: "..."}
 */
export const deleteSupervisor = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required for deletion");
  }
  
  await apiClient.delete(`${SUPERVISORS_BASE_URL}manage/${userId}/`);
  return userId;
};





