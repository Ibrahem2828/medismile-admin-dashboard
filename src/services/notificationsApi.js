import apiClient from "./api";

/**
 * API service للإشعارات (Notifications)
 * مسؤول الجامعة يمكنه:
 * - عرض إشعارات الجامعة فقط
 * - عرض تفاصيل إشعار
 * - تحديث حالة/قراءة إشعار
 * - إنشاء إشعار (فقط للإشعارات الإدارية الداخلية)
 */

const NOTIFICATIONS_BASE_URL = "/notifications/";

/**
 * جلب جميع الإشعارات (إشعارات الجامعة فقط)
 * GET /notifications/
 * 
 * Query Parameters (اختيارية):
 * - page: رقم الصفحة (للـ pagination)
 * - page_size: حجم الصفحة (للـ pagination)
 * - is_read: حالة القراءة (true/false)
 * - status: حالة الإشعار
 * 
 * يعيد: { count, next, previous, results: [...] }
 */
export const fetchNotifications = async (params = {}) => {
  try {
    const response = await apiClient.get(NOTIFICATIONS_BASE_URL, { params });
    
    // Pagination format: { count, next, previous, results: [...] }
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return {
        count: response.data.count || response.data.results.length,
        next: response.data.next || null,
        previous: response.data.previous || null,
        results: response.data.results,
      };
    }
    
    // Direct array format
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      };
    }
    
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * جلب إشعار محدد
 * GET /notifications/{id}/
 * 
 * يعيد: Notification object
 */
export const fetchNotificationById = async (id) => {
  try {
    const response = await apiClient.get(`${NOTIFICATIONS_BASE_URL}${id}/`);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching notification:", error);
    throw error;
  }
};

/**
 * تحديث إشعار (حالة/قراءة)
 * PATCH /notifications/{id}/
 * 
 * Body: {
 *   is_read?: boolean,
 *   status?: string (pending|accepted|rejected|info),
 *   response_message?: string
 * }
 * 
 * يعيد: Notification object محدث
 */
export const updateNotification = async (id, updateData) => {
  try {
    const response = await apiClient.patch(`${NOTIFICATIONS_BASE_URL}${id}/`, updateData);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error updating notification:", error);
    throw error;
  }
};

/**
 * إنشاء إشعار جديد (فقط للإشعارات الإدارية الداخلية)
 * POST /notifications/
 * 
 * Body: {
 *   notification_type: string (مطلوب - أحد الأنواع المحددة),
 *   priority?: "low" | "normal" | "high" | "critical" (افتراضي: "normal"),
 *   recipient_id?: string (uuid - اختياري - إذا لم يتم تحديده، يرسل لجميع أعضاء الجامعة),
 *   sender_id?: string (uuid - اختياري),
 *   appointment_id?: string (uuid - اختياري),
 *   target_type?: string (case|report|message|appointment|evaluation - اختياري),
 *   target_id?: string (uuid - اختياري - للربط بكائنات أخرى),
 *   title: string (مطلوب),
 *   message: string (مطلوب),
 *   proposed_changes?: object (لطلبات التعديل/الإلغاء),
 *   payload?: object (بيانات إضافية للواجهة)
 * }
 * 
 * يعيد: Notification object
 */
export const createNotification = async (notificationData) => {
  try {
    const response = await apiClient.post(NOTIFICATIONS_BASE_URL, notificationData);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};
