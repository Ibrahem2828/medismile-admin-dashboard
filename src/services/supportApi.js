import apiClient from "./api";

/**
 * جلب قائمة طلبات الدعم
 * GET /api/support/tickets/
 * Backend يفلتر تلقائياً حسب university_id من Token (للمسؤولين)
 * @param {Object} params - Query parameters (status, priority, category, etc.)
 * @returns {Promise<Array>} قائمة طلبات الدعم
 */
export const fetchSupportTickets = async (params = {}) => {
  const response = await apiClient.get("/support/tickets/", { params });
  
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
};

/**
 * إنشاء طلب دعم جديد
 */
export const createSupportTicket = async (ticketData) => {
  const response = await apiClient.post("/support/tickets/", ticketData);
  return response.data.data;
};

/**
 * جلب تفاصيل طلب دعم
 */
export const fetchSupportTicketById = async (ticketId) => {
  const response = await apiClient.get(`/support/tickets/${ticketId}/`);
  return response.data.data;
};

/**
 * تحديث طلب دعم (للدعم التقني فقط)
 */
export const updateSupportTicket = async (ticketId, ticketData) => {
  const response = await apiClient.put(`/support/tickets/${ticketId}/`, ticketData);
  return response.data.data;
};

/**
 * تحديث جزئي لطلب دعم
 */
export const patchSupportTicket = async (ticketId, ticketData) => {
  const response = await apiClient.patch(`/support/tickets/${ticketId}/`, ticketData);
  return response.data.data;
};

/**
 * جلب ردود طلب دعم
 */
export const fetchTicketResponses = async (ticketId) => {
  const response = await apiClient.get(`/support/tickets/${ticketId}/responses/`);
  return response.data.data;
};

/**
 * إضافة رد على طلب دعم
 */
export const addTicketResponse = async (ticketId, responseData) => {
  const response = await apiClient.post(`/support/tickets/${ticketId}/responses/`, responseData);
  return response.data.data;
};

/**
 * جلب إحصائيات طلبات الدعم (للدعم التقني فقط)
 */
export const fetchSupportStats = async () => {
  const response = await apiClient.get("/support/stats/");
  return response.data.data;
};















