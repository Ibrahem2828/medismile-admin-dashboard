/**
 * Auth Sync Middleware
 * 
 * يزامن Redux state مع localStorage تلقائياً
 * - عند تغيير Redux state → يحدث localStorage
 * - عند تحميل التطبيق → يحدث Redux state من localStorage
 * 
 * هذا يجعل Redux هو Single Source of Truth
 */

import { setUser, clearAuth } from "../redux/features/auth/authSlice";

/**
 * Middleware لمزامنة Redux state مع localStorage
 */
export const authSyncMiddleware = (store) => (next) => (action) => {
  // تنفيذ الـ action أولاً
  const result = next(action);

  // الحصول على state بعد تنفيذ الـ action
  const state = store.getState();
  const { user, tokens, isAuthenticated } = state.auth;

  // مزامنة مع localStorage
  if (typeof window !== "undefined") {
    if (isAuthenticated && user && tokens?.access) {
      // حفظ في localStorage
      try {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("access_token", tokens.access);
        if (tokens.refresh) {
          localStorage.setItem("refresh_token", tokens.refresh);
        }
        
        // إرسال event لتحديث Components
        window.dispatchEvent(new Event("user-login"));
      } catch (error) {
        console.error("Error syncing auth to localStorage:", error);
      }
    } else {
      // تنظيف localStorage
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        
        // إرسال event لتحديث Components
        window.dispatchEvent(new Event("user-logout"));
      } catch (error) {
        console.error("Error clearing auth from localStorage:", error);
      }
    }
  }

  return result;
};

/**
 * تهيئة Redux state من localStorage عند تحميل التطبيق
 * يجب استدعاء هذه الدالة في store configuration
 */
export const initializeAuthFromStorage = (store) => {
  if (typeof window === "undefined") return;

  try {
    const userStr = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (userStr && accessToken) {
      try {
        const user = JSON.parse(userStr);
        const tokens = {
          access: accessToken,
          refresh: refreshToken || null,
        };

        // تحديث Redux state
        store.dispatch(setUser(user));
        // يمكن إضافة action لتحديث tokens أيضاً
        // store.dispatch(setTokens(tokens));
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        // تنظيف localStorage في حالة خطأ
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }
  } catch (error) {
    console.error("Error initializing auth from storage:", error);
  }
};


