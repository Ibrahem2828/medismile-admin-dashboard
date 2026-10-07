import apiClient from "./api";

/**
 * API service للمجتمع (Community)
 * بناءً على التوثيق الكامل لـ Community API
 */

const COMMUNITY_BASE_URL = "/community/";

/**
 * جلب منشورات الجامعة
 * GET /api/community/content/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يرى فقط منشورات جامعته (يتم الفلترة تلقائياً من Backend)
 * 
 * Query Parameters (اختيارية):
 * - type: نوع المحتوى
 * - category: الفئة
 * - featured: محتوى مميز
 * - status: حالة المحتوى
 * - order_by: ترتيب النتائج
 * 
 * يعيد: Array of content objects
 */
export const fetchCommunityContent = async (params = {}) => {
  const response = await apiClient.get(`${COMMUNITY_BASE_URL}content/`, { params });
  
  // الاستجابة قد تأتي بصيغ مختلفة
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  if (response.data?.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  
  return [];
};

/**
 * جلب محتوى محدد
 * GET /api/community/posts/{id}/
 */
export const fetchCommunityContentById = async (id) => {
  const response = await apiClient.get(`${COMMUNITY_BASE_URL}posts/${id}/`);
  // الاستجابة المتوقعة: { status: "success", data: { ...post } }
  return response.data?.data || response.data;
};

/**
 * إنشاء محتوى جديد
 * POST /api/v1/community/
 */
export const createCommunityContent = async (data) => {
  // إذا كان هناك ملف، استخدم FormData
  const formData = new FormData();
  
  if (data.file) {
    formData.append("file", data.file);
  }
  
  // إضافة باقي الحقول
  Object.keys(data).forEach((key) => {
    if (key !== "file" && data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  
  const config = {
    headers: {
      "Content-Type": data.file ? "multipart/form-data" : "application/json",
    },
  };
  
  const response = await apiClient.post(
    COMMUNITY_BASE_URL,
    data.file ? formData : data,
    config
  );
  
  return response.data;
};

/**
 * تحديث محتوى
 * PUT/PATCH /api/v1/community/<id>/
 */
export const updateCommunityContent = async (id, data) => {
  const formData = new FormData();
  
  if (data.file) {
    formData.append("file", data.file);
  }
  
  Object.keys(data).forEach((key) => {
    if (key !== "file" && data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  
  const config = {
    headers: {
      "Content-Type": data.file ? "multipart/form-data" : "application/json",
    },
  };
  
  const response = await apiClient.patch(
    `${COMMUNITY_BASE_URL}${id}/`,
    data.file ? formData : data,
    config
  );
  
  return response.data;
};

/**
 * حذف محتوى (Soft Delete)
 * DELETE /api/community/posts/{id}/
 */
export const deleteCommunityContent = async (id) => {
  const response = await apiClient.delete(`${COMMUNITY_BASE_URL}posts/${id}/`);
  return response.data;
};

/**
 * جلب الموافقات والرفض
 * GET /api/community/approval-logs/
 * 
 * حسب التوثيق:
 * - الصلاحيات: IsAuthenticated
 * - مسؤول الجامعة: يرى فقط موافقات ورفض منشورات جامعته (يتم الفلترة تلقائياً من Backend)
 * 
 * يعيد: Array of approval/rejection objects
 */
export const fetchApprovals = async (params = {}) => {
  try {
    const response = await apiClient.get(`${COMMUNITY_BASE_URL}approval-logs/`, { params });
    
    // الاستجابة قد تأتي بصيغ مختلفة
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    return [];
  } catch (error) {
    // إذا كان الخطأ 500 أو خطأ من الخادم، نعيد مصفوفة فارغة
    if (error?.response?.status === 500 || error?.response?.status >= 500) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Approvals API returned 500, using empty array");
      }
      return [];
    }
    
    // للأخطاء الأخرى، نطبع في development فقط
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching approvals:", error);
    }
    
    // نعيد مصفوفة فارغة بدلاً من رمي الخطأ
    return [];
  }
};

/**
 * @deprecated استخدم fetchApprovals بدلاً منها
 * جلب المنشورات المعلقة (قديم)
 * GET /api/community/moderation/pending/
 */
export const fetchPendingContent = async () => {
  // إعادة توجيه للـ endpoint الجديد
  return fetchApprovals({ status: "pending" });
};

/**
 * الموافقة على منشور
 * POST /api/v1/community/<content_id>/approve/
 */
export const approveContent = async (contentId, userId) => {
  const response = await apiClient.post(
    `${COMMUNITY_BASE_URL}${contentId}/approve/`,
    { user_id: userId }
  );
  return response.data;
};

/**
 * رفض منشور
 * POST /api/v1/community/<content_id>/reject/
 */
export const rejectContent = async (contentId, userId, rejectionReason = null) => {
  const response = await apiClient.post(
    `${COMMUNITY_BASE_URL}${contentId}/reject/`,
    {
      user_id: userId,
      rejection_reason: rejectionReason,
    }
  );
  return response.data;
};

/**
 * جلب تعليقات محتوى
 * GET /api/v1/community/<content_id>/comments/
 */
export const fetchContentComments = async (contentId) => {
  const response = await apiClient.get(
    `${COMMUNITY_BASE_URL}${contentId}/comments/`
  );
  
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  if (response.data?.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  
  return [];
};

/**
 * إضافة تعليق
 * POST /api/v1/community/<content_id>/comments/
 */
export const addComment = async (contentId, data) => {
  const response = await apiClient.post(
    `${COMMUNITY_BASE_URL}${contentId}/comments/`,
    data
  );
  return response.data;
};

/**
 * إعجاب أو إلغاء إعجاب
 * POST /api/v1/community/<content_id>/like/
 */
export const toggleLike = async (contentId, userId) => {
  const response = await apiClient.post(
    `${COMMUNITY_BASE_URL}${contentId}/like/`,
    { user_id: userId }
  );
  return response.data;
};

/**
 * جلب المحتوى الرائج
 * GET /api/v1/community/trending/
 */
export const fetchTrendingContent = async () => {
  const response = await apiClient.get(`${COMMUNITY_BASE_URL}trending/`);
  
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  if (response.data?.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  
  return [];
};















