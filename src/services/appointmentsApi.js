import apiClient from "./api";
// 🔕 الإشعارات معلقة مؤقتاً
// import { createNotification } from "./notificationsApi";

/**
 * API service للمواعيد (Appointments)
 * بناءً على Views من Backend
 */

const APPOINTMENTS_BASE_URL = "/appointments/";

/**
 * جلب جميع المواعيد
 * GET /api/appointments/
 * الصلاحيات: IsAuthenticated
 * 
 * ملاحظات:
 * - مسؤول الجامعة (university_admin): يجلب جميع المواعيد ضمن جامعته تلقائياً
 *   (Backend يفلتر حسب university_id من Token)
 * - المشرف (supervisor): يجلب مواعيده فقط
 * 
 * Query Parameters (اختيارية):
 * - status: حالة الموعد (scheduled, confirmed, completed, cancelled, etc.)
 * - patient_id: معرف المريض
 * - user_id: معرف المستخدم (المشرف)
 * - case_id: معرف الحالة السريرية
 * 
 * يعيد: Array of appointments أو {status: "success", message: "...", data: [...]}
 */
export const fetchAppointments = async (params = {}) => {
  try {
    const response = await apiClient.get(APPOINTMENTS_BASE_URL, { params });
    
    // الاستجابة قد تأتي بصيغ مختلفة:
    // 1. {status: "success", message: "...", data: [...]}
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // 2. Array مباشر
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // 3. {results: [...]} (pagination)
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.warn("Unexpected appointments API response format:", response.data);
    }
    return [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching appointments:", error);
    }
    throw error;
  }
};

/**
 * جلب تفاصيل موعد محدد
 * GET /api/appointments/<appointment_id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يمكنه عرض تفاصيل مواعيد جامعته
 */
export const fetchAppointmentById = async (appointmentId) => {
  try {
    const response = await apiClient.get(`${APPOINTMENTS_BASE_URL}${appointmentId}/`);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching appointment by ID:", error);
    }
    throw error;
  }
};

/**
 * 🔕 الإشعارات معلقة مؤقتاً
 * إنشاء إشعار عند إنشاء موعد جديد
 * @param {Object} params - { appointment, recipientId, senderId? }
 */
// export const createAppointmentNotification = async ({ appointment, recipientId, senderId = null }) => {
//   try {
//     if (!appointment || !recipientId) {
//       if (process.env.NODE_ENV === "development") {
//         console.warn("⚠️ Missing parameters for appointment notification");
//       }
//       return null;
//     }

//     const notification = await createNotification({
//       notification_type: "appointment_request",
//       priority: "high",
//       recipient_id: recipientId,
//       sender_id: senderId,
//       appointment_id: appointment.id,
//       title: "موعد جديد",
//       message: `تم إنشاء موعد جديد في ${appointment.date || "تاريخ غير محدد"}`,
//     });

//     return notification;
//   } catch (error) {
//     if (process.env.NODE_ENV === "development") {
//       console.error("❌ Error creating appointment notification:", error);
//     }
//     // لا نرمي الخطأ حتى لا نؤثر على عملية إنشاء الموعد
//     return null;
//   }
// };

























