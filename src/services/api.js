import axios from "axios";

// Base URL للـ API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.medismile.xn--mgbaab0cxheq.tech/api";

// إنشاء axios instance مع الإعدادات الافتراضية
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// إضافة interceptor لإضافة Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة interceptor للتعامل مع الأخطاء وتجديد الـ token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // إذا كان الخطأ 401 ولم نكن قد حاولنا refresh من قبل
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // إذا كان هناك refresh قيد التنفيذ، نضيف الطلب إلى قائمة الانتظار
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // لا يوجد refresh token، ننظف ونوجه للـ login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("user-logout"));
        processQueue(error, null);
        isRefreshing = false;
        
        // إعادة توجيه للـ login إذا كنا في المتصفح
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        // تحديث header للطلب الأصلي
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // معالجة قائمة الانتظار
        processQueue(null, access);
        isRefreshing = false;

        // إعادة الطلب الأصلي
        return apiClient(originalRequest);
      } catch (refreshError) {
        // فشل refresh، ننظف ونوجه للـ login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("user-logout"));
        processQueue(refreshError, null);
        isRefreshing = false;

        // إعادة توجيه للـ login إذا كنا في المتصفح
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // معالجة أخطاء 403 (ممنوع)
    if (error.response?.status === 403) {
      console.error("Forbidden - You don't have permission to access this resource");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
