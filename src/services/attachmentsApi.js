import apiClient from "./api";

/**
 * API service للمرفقات (Attachments)
 * بناءً على API Documentation v2.0.0
 */

const ATTACHMENTS_BASE_URL = "/attachments/";

/**
 * جلب جميع المرفقات
 * GET /api/attachments/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يجلب جميع المرفقات ضمن جامعته تلقائياً
 *   (Backend يفلتر حسب university_id من Token)
 * 
 * Query Parameters (اختيارية):
 * - file_category: image, document, video, other
 * - attachment_type: before_image, after_image, report, other
 * - case_id: معرف الحالة السريرية
 * - appointment_id: معرف الموعد
 * - is_visible_to_patient: boolean
 * 
 * يعيد: Array of attachments أو {status: "success", data: [...]}
 */
export const fetchAttachments = async (params = {}) => {
  try {
    const response = await apiClient.get(ATTACHMENTS_BASE_URL, { params });
    
    // الاستجابة قد تأتي بصيغ مختلفة:
    // 1. {status: "success", data: [...]}
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // 2. Array مباشر
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // 3. {results: [...]} (pagination)
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.warn("Unexpected attachments API response format:", response.data);
    }
    return [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching attachments:", error);
    }
    throw error;
  }
};

/**
 * جلب تفاصيل مرفق محدد
 * GET /api/attachments/<id>/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يمكنه عرض تفاصيل مرفقات جامعته
 * 
 * @param {string} attachmentId - UUID للمرفق
 * يعيد: Attachment object
 */
export const fetchAttachmentById = async (attachmentId) => {
  try {
    const response = await apiClient.get(`${ATTACHMENTS_BASE_URL}${attachmentId}/`);
    
    // الاستجابة قد تأتي بصيغة {status: "success", data: {...}}
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching attachment by ID:", error);
    }
    throw error;
  }
};

