"use client";

/**
 * دوال المصادقة والتحقق من المستخدم
 * 
 * ملاحظة: هذا المشروع خاص فقط بمسؤول الجامعة (university_admin)
 * تم تبسيط النظام - لا حاجة لنظام صلاحيات معقد
 */

/**
 * الحصول على بيانات المستخدم من localStorage
 * @returns {Object|null}
 */
export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * الحصول على Access Token من localStorage
 * @returns {string|null}
 */
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

/**
 * الحصول على Refresh Token من localStorage
 * @returns {string|null}
 */
export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

/**
 * التحقق من أن المستخدم مسجل دخول
 * @returns {boolean}
 */
export function isAuthenticated() {
  const user = getUser();
  const token = getAccessToken();
  return !!(user && token);
}

/**
 * التحقق من أن المستخدم هو مسؤول جامعة
 * @returns {boolean}
 */
export function isUniversityAdmin() {
  const user = getUser();
  if (!user) return false;
  
  // دعم college_admin كمرادف لـ university_admin
  return user.role === "university_admin" || user.role === "college_admin";
}

/**
 * مسح بيانات المصادقة من localStorage
 */
export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/**
 * حفظ بيانات المستخدم في localStorage
 * @param {Object} user - بيانات المستخدم
 * @param {string} accessToken - Access Token
 * @param {string} refreshToken - Refresh Token
 */
export function setAuth(user, accessToken, refreshToken) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("access_token", accessToken);
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }
}
