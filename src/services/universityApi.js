import apiClient from "./api";
// 🔕 الإشعارات معلقة مؤقتاً
// import { createNotification } from "./notificationsApi";
import { fetchAppointments } from "./appointmentsApi";

/**
 * جلب الملف الشخصي لمسؤول الجامعة
 * GET /api/accounts/me/university-admin/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * يعيد: بيانات الملف الشخصي الكاملة
 */
export const fetchUniversityAdminProfile = async () => {
  const response = await apiClient.get("/accounts/me/university-admin/");
  return response.data?.data || response.data;
};

// جلب تفاصيل الجامعة الحالية
export const fetchUniversityDetails = async (universityId) => {
  const response = await apiClient.get(`/universities/${universityId}/`);
  return response.data?.data || response.data;
};

// تحديث بيانات الجامعة
export const updateUniversityDetails = async (universityId, payload) => {
  const response = await apiClient.patch(
    `/universities/${universityId}/update/`,
    payload
  );
  return response.data?.data || response.data;
};

// الكليات
/**
 * جلب الكليات
 * GET /api/universities/faculties/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const fetchFaculties = async (universityId) => {
  const response = await apiClient.get(
    `/universities/faculties/`,
    { params: { university: universityId } }
  );
  return response.data?.data || response.data;
};

/**
 * إنشاء كلية
 * POST /api/universities/faculties/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * الحقول:
 * - university: (uuid) - معرف الجامعة
 * - name: (string) - اسم الكلية
 * - description: (string) - الوصف
 * - is_active: (boolean) - نشط/غير نشط
 */
export const createFaculty = async (payload) => {
  const response = await apiClient.post(
    `/universities/faculties/`,
    payload
  );
  return response.data?.data || response.data;
};

/**
 * جلب كلية
 * GET /api/universities/faculties/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const fetchFaculty = async (facultyId) => {
  const response = await apiClient.get(
    `/universities/faculties/${facultyId}/`
  );
  return response.data?.data || response.data;
};

/**
 * تحديث كلية
 * PATCH /api/universities/faculties/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const updateFaculty = async (facultyId, payload) => {
  const response = await apiClient.patch(
    `/universities/faculties/${facultyId}/`,
    payload
  );
  return response.data?.data || response.data;
};

/**
 * حذف/تعطيل كلية
 * DELETE /api/universities/faculties/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * ملاحظة: Soft Delete (تعطيل فقط)
 */
export const deleteFaculty = async (facultyId) => {
  const response = await apiClient.delete(
    `/universities/faculties/${facultyId}/`
  );
  return response.data?.data || response.data;
};

// البرامج الأكاديمية
/**
 * جلب البرامج الأكاديمية للجامعة
 * GET /api/universities/programs/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * Query params: ?university=<university_id> أو يتم التعرف تلقائياً من Token
 */
export const fetchPrograms = async (universityId) => {
  const response = await apiClient.get(
    `/universities/programs/`,
    { params: { university: universityId } }
  );
  return response.data?.data || response.data;
};

/**
 * إنشاء برنامج أكاديمي
 * POST /api/universities/programs/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * الحقول المطلوبة:
 * - university: (id) - معرف الجامعة
 * - name: (string) - اسم البرنامج
 * - code: (string) - كود البرنامج
 */
export const createProgram = async (payload) => {
  const response = await apiClient.post(
    `/universities/programs/`,
    payload
  );
  return response.data?.data || response.data;
};

/**
 * تحديث برنامج أكاديمي
 * PATCH /api/universities/<university_id>/programs/<program_id>/update/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const updateProgram = async (universityId, programId, payload) => {
  const response = await apiClient.patch(
    `/universities/${universityId}/programs/${programId}/update/`,
    payload
  );
  return response.data?.data || response.data;
};

/**
 * حذف/تعطيل برنامج أكاديمي
 * DELETE /api/universities/<university_id>/programs/<program_id>/delete/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * ملاحظة: Soft Delete (تعطيل فقط)
 */
export const deleteProgram = async (universityId, programId) => {
  const response = await apiClient.delete(
    `/universities/${universityId}/programs/${programId}/delete/`
  );
  return response.data?.data || response.data;
};

// السنوات الأكاديمية
/**
 * جلب السنوات الأكاديمية للجامعة
 * GET /api/universities/academic-years/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * Query params: ?university=<university_id> أو يتم التعرف تلقائياً من Token
 */
const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.results)) return payload.data.results;
  return [];
};

export const fetchAcademicYears = async (universityId) => {
  const response = await apiClient.get(
    `/universities/academic-years/`,
    { params: { university: universityId } }
  );
  const body = response.data?.data ?? response.data;
  return unwrapList(body).length ? unwrapList(body) : unwrapList(response.data);
};

/**
 * إنشاء سنة أكاديمية تابعة لجامعة
 * POST /api/universities/academic-years/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * الحقول المطلوبة:
 * - university: (id) - معرف الجامعة
 * - name: (string) - اسم السنة الأكاديمية
 * - start_date: (string) - تاريخ البدء
 * - end_date: (string) - تاريخ الانتهاء
 */
export const createAcademicYear = async (payload) => {
  const response = await apiClient.post(
    `/universities/academic-years/`,
    payload
  );
  const body = response.data?.data ?? response.data;
  if (body?.academic_year && typeof body.academic_year === "object") {
    return body.academic_year;
  }
  return body;
};

/**
 * جلب سنة أكاديمية
 * GET /api/universities/academic-years/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const fetchAcademicYear = async (yearId) => {
  const response = await apiClient.get(
    `/universities/academic-years/${yearId}/`
  );
  return response.data?.data || response.data;
};

/**
 * تحديث سنة أكاديمية
 * PATCH /api/universities/academic-years/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const updateAcademicYear = async (yearId, payload) => {
  const response = await apiClient.patch(
    `/universities/academic-years/${yearId}/`,
    payload
  );
  return response.data?.data || response.data;
};

/**
 * حذف/تعطيل سنة أكاديمية
 * DELETE /api/universities/academic-years/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * ملاحظة: Soft Delete (تعطيل فقط)
 */
export const deleteAcademicYear = async (yearId) => {
  const response = await apiClient.delete(
    `/universities/academic-years/${yearId}/`
  );
  return response.data?.data || response.data;
};

// ============================================
// المقررات (Courses)
// ============================================

/**
 * جلب المقررات للجامعة
 * GET /api/universities/courses/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * Query params: ?university=<university_id> أو يتم التعرف تلقائياً من Token
 */
export const fetchCourses = async (universityId) => {
  const response = await apiClient.get(
    `/universities/courses/`,
    { params: { university: universityId } }
  );
  return response.data?.data || response.data;
};

/**
 * إنشاء مقرر
 * POST /api/universities/courses/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * الحقول المطلوبة:
 * - name: (string) - اسم المقرر
 * - code: (string) - كود المقرر
 * - academic_year: (uuid or null) - السنة الأكاديمية
 * - program: (uuid or null) - البرنامج
 * - supervisor: (uuid or null) - المشرف (role = supervisor)
 * - students: (array of uuids) - الطلاب (role = student)
 * - description: (string) - الوصف
 * - credits: (number) - عدد الساعات المعتمدة
 * - is_active: (boolean) - نشط/غير نشط
 */
export const createCourse = async (payload) => {
  try {
    console.log("📚 createCourse - البيانات المرسلة:", JSON.stringify(payload, null, 2));
    console.log("📚 createCourse - URL:", `/universities/courses/`);
    
    const response = await apiClient.post(
      `/universities/courses/`,
      payload
    );
    
    console.log("📚 createCourse - الاستجابة:", response.data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("📚 createCourse - خطأ:", error);
    console.error("📚 createCourse - تفاصيل الخطأ:", error?.response?.data);
    console.error("📚 createCourse - Status:", error?.response?.status);
    throw error;
  }
};

/**
 * جلب مقرر
 * GET /api/universities/courses/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const fetchCourse = async (courseId) => {
  const response = await apiClient.get(
    `/universities/courses/${courseId}/`
  );
  return response.data?.data || response.data;
};

/**
 * تحديث مقرر
 * PATCH /api/universities/courses/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 */
export const updateCourse = async (courseId, payload) => {
  const response = await apiClient.patch(
    `/universities/courses/${courseId}/`,
    payload
  );
  return response.data?.data || response.data;
};

/**
 * حذف/تعطيل مقرر
 * DELETE /api/universities/courses/<uuid>/
 * الصلاحيات: IsAuthenticated + IsUniversityAdmin
 * ملاحظة: Soft Delete (تعطيل فقط)
 */
export const deleteCourse = async (courseId) => {
  const response = await apiClient.delete(
    `/universities/courses/${courseId}/`
  );
  return response.data?.data || response.data;
};

// ============================================
// 🔕 الإشعارات معلقة مؤقتاً
// دوال مساعدة لربط الإشعارات مع الجامعة
// ============================================

/**
 * إنشاء إشعار عند إنشاء برنامج أكاديمي جديد
 * @param {Object} params - { program, universityId, userId }
 */
// export const createProgramNotification = async ({ program, universityId, userId }) => {
//   try {
//     if (!program || !universityId || !userId) {
//       if (process.env.NODE_ENV === "development") {
//         console.warn("⚠️ Missing parameters for program notification");
//       }
//       return null;
//     }

//     const notification = await createNotification({
//       notification_type: "program_created",
//       priority: "medium",
//       recipient_id: userId, // مسؤول الجامعة نفسه (أو يمكن إرسالها لمشرفين)
//       target_type: "program",
//       target_id: program.id,
//       title: "تم إنشاء برنامج أكاديمي جديد",
//       message: `تم إنشاء البرنامج الأكاديمي "${program.name}" (${program.code}) بنجاح`,
//     });

//     return notification;
//   } catch (error) {
//     if (process.env.NODE_ENV === "development") {
//       console.error("❌ Error creating program notification:", error);
//     }
//     // لا نرمي الخطأ حتى لا نؤثر على عملية إنشاء البرنامج
//     return null;
//   }
// };

/**
 * إنشاء إشعار عند إنشاء سنة أكاديمية جديدة
 * @param {Object} params - { academicYear, universityId, userId }
 */
// export const createAcademicYearNotification = async ({ academicYear, universityId, userId }) => {
//   try {
//     if (!academicYear || !universityId || !userId) {
//       if (process.env.NODE_ENV === "development") {
//         console.warn("⚠️ Missing parameters for academic year notification");
//       }
//       return null;
//     }

//     const notification = await createNotification({
//       notification_type: "academic_year_created",
//       priority: "high",
//       recipient_id: userId, // مسؤول الجامعة
//       target_type: "academic_year",
//       target_id: academicYear.id,
//       title: "تم إنشاء سنة أكاديمية جديدة",
//       message: `تم إنشاء السنة الأكاديمية "${academicYear.name}" من ${academicYear.start_date} إلى ${academicYear.end_date}`,
//     });

//     return notification;
//   } catch (error) {
//     if (process.env.NODE_ENV === "development") {
//       console.error("❌ Error creating academic year notification:", error);
//     }
//     // لا نرمي الخطأ حتى لا نؤثر على عملية إنشاء السنة الأكاديمية
//     return null;
//   }
// };

// ============================================
// دوال مساعدة لجلب المواعيد المتعلقة بالجامعة
// ============================================

/**
 * جلب المواعيد لمسؤول الجامعة (ضمن جامعته)
 * GET /api/appointments/
 * 
 * ملاحظات:
 * - Backend يفلتر تلقائياً حسب university_id من Token
 * - مسؤول الجامعة يرى جميع المواعيد ضمن جامعته
 * 
 * @param {Object} params - Query parameters (status, patient_id, case_id, etc.)
 * @returns {Promise<Array>} قائمة المواعيد
 */
export const fetchUniversityAppointments = async (params = {}) => {
  try {
    // استخدام fetchAppointments من appointmentsApi
    // Backend سيفلتر تلقائياً حسب university_id من Token
    const appointments = await fetchAppointments(params);
    return appointments;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Error fetching university appointments:", error);
    }
    throw error;
  }
};



