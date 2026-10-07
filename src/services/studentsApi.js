import apiClient from "./api";

/**
 * API service للطلاب (Students)
 * بناءً على التوثيق الكامل لـ API
 */

const STUDENTS_BASE_URL = "/accounts/university/students/";

/**
 * جلب جميع الطلاب
 * GET /api/accounts/university/students/
 * يعيد: [{...}, {...}]
 */
export const fetchStudents = async () => {
  const response = await apiClient.get("/accounts/university/students/");
  
  let studentsData = [];
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: [...]}
  if (response.data && response.data.data && Array.isArray(response.data.data)) {
    studentsData = response.data.data;
  } else if (Array.isArray(response.data)) {
    // في حالة كانت البيانات مباشرة بدون غلاف
    studentsData = response.data;
  }
  
  return studentsData;
};

/**
 * جلب تفاصيل طالب محدد
 * GET /api/accounts/university/students/manage/<user_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * - مسؤول الجامعة: يمكنه عرض تفاصيل طلاب جامعته
 * 
 * @param {string} userId - ID الطالب
 * يعيد: {status: "success", message: "...", data: {...}}
 */
export const fetchStudentById = async (userId) => {
  const response = await apiClient.get(`${STUDENTS_BASE_URL}manage/${userId}/`);
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: {...}}
  return response.data?.data || response.data;
};

/**
 * تحديث بيانات طالب
 * PATCH /api/accounts/university/students/manage/<user_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * - مسؤول الجامعة: يمكنه تحديث طلاب جامعته فقط
 * 
 * @param {string} userId - ID الطالب
 * @param {Object} studentData - بيانات الطالب المحدثة
 * {
 *   phone_number?: string,
 *   address?: string,
 *   date_of_birth?: string (YYYY-MM-DD),
 *   gender?: string (male/female),
 *   profile_picture?: string,
 *   university?: string (uuid),
 *   student_id?: string,
 *   year_of_study?: number (1-5),
 *   specialization?: string
 * }
 * يعيد: {status: "success", message: "...", data: {...}}
 */
export const updateStudent = async (userId, studentData) => {
  const response = await apiClient.patch(`${STUDENTS_BASE_URL}manage/${userId}/`, studentData);
  
  // الاستجابة تأتي بصيغة {status: "success", message: "...", data: {...}}
  return response.data?.data || response.data;
};

/**
 * إنشاء طالب جديد
 * POST /api/accounts/create/student/
 * يعيد: {status: "success", message: "...", data: {...}}
 * @param {Object} studentData - بيانات الطالب الجديد
 * {
 *   email: string (مطلوب),
 *   username: string (مطلوب),
 *   first_name: string (اختياري، يمكن أن يكون فارغاً ""),
 *   last_name: string (اختياري، يمكن أن يكون فارغاً ""),
 *   university: string (uuid, مطلوب),
 *   university_name: string (مطلوب)
 * }
 */
export const createStudent = async (studentData) => {
  // الحصول على university ID من البيانات المرسلة
  let universityId = studentData.university || studentData.university_id;
  
  // تنظيف university ID (إزالة مسافات فقط)
  if (universityId && typeof universityId === 'string') {
    universityId = universityId.trim();
  }
  
  // التحقق من أن university ID موجود
  if (!universityId) {
    throw new Error("University ID is required");
  }
  
  // التحقق من أن university ID هو UUID صحيح
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(universityId)) {
    console.error("❌ [createStudent] Invalid university ID format (not a valid UUID):", universityId);
    throw new Error(`Invalid university ID format: ${universityId}. Expected UUID format (e.g., 38dc2e66-0c46-447b-b855-646f32f6c8d7).`);
  }
  
  // تحويل university_id إلى university إذا كان موجوداً
  const requestData = {
    email: studentData.email,
    username: studentData.username,
    password: studentData.password, // مطلوب حسب API
    password_confirm: studentData.password_confirm, // مطلوب حسب API
    first_name: studentData.first_name || "", // السماح بالقيم الفارغة
    last_name: studentData.last_name || "", // السماح بالقيم الفارغة
    university: universityId,
    university_name: studentData.university_name,
    // الحقول الاختيارية
    ...(studentData.student_id && { student_id: studentData.student_id }),
    ...(studentData.year_of_study && { year_of_study: parseInt(studentData.year_of_study) || null }),
    ...(studentData.specialization && { specialization: studentData.specialization }),
    ...(studentData.phone_number && { phone_number: studentData.phone_number }),
    ...(studentData.address && { address: studentData.address }),
    ...(studentData.date_of_birth && { date_of_birth: studentData.date_of_birth }),
    ...(studentData.gender && { gender: studentData.gender }),
  };
  
  // التحقق من أن جميع الحقول المطلوبة موجودة
  // first_name و last_name يمكن أن تكونا فارغتين حسب API
  if (!requestData.email || !requestData.username || !requestData.password || !requestData.password_confirm || !requestData.university || !requestData.university_name) {
    throw new Error("All required fields must be provided (email, username, password, password_confirm, university, university_name)");
  }
  
  // Logging في development mode للتحقق من البيانات
  if (process.env.NODE_ENV === "development") {
    console.log("📝 [createStudent] Input studentData:", studentData);
    console.log("📝 [createStudent] Cleaned universityId:", universityId);
    console.log("📝 [createStudent] Final requestData:", requestData);
    console.log("📝 [createStudent] URL:", "/accounts/create/student/");
    console.log("📝 [createStudent] Request will be POST to:", `${apiClient.defaults.baseURL}/accounts/create/student/`);
  }
  
  // التأكد من أن الـ URL لا يحتوي على university ID
  const url = "/accounts/create/student/";
  
  // التحقق النهائي من أن requestData.university هو UUID صحيح
  if (requestData.university) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestData.university)) {
      console.error("❌ [createStudent] Invalid university ID format in final check:", requestData.university);
      throw new Error(`Invalid university ID format: ${requestData.university}. Expected UUID format (e.g., 38dc2e66-0c46-447b-b855-646f32f6c8d7).`);
    }
  }
  
  const response = await apiClient.post(url, requestData);
  
  if (process.env.NODE_ENV === "development") {
    console.log("✅ [createStudent] Response:", response.data);
  }
  
  return response.data?.data || response.data;
};

/**
 * حذف طالب
 * DELETE /api/accounts/university/students/manage/<user_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * - مسؤول الجامعة: يمكنه حذف طلاب جامعته فقط
 * 
 * @param {string} userId - ID الطالب
 * يعيد: {status: "success", message: "..."}
 */
export const deleteStudent = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required for deletion");
  }
  
  await apiClient.delete(`${STUDENTS_BASE_URL}manage/${userId}/`);
  return userId;
};


