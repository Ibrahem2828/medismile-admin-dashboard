"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getUser, isUniversityAdmin } from "@/lib/auth";
import { menuItems, dashboardCards, quickActions } from "@/lib/roleConfig";

/**
 * Hook مبسط للوصول إلى بيانات المستخدم والقوائم
 * 
 * ملاحظة: هذا المشروع خاص فقط بمسؤول الجامعة (university_admin)
 * تم تبسيط النظام - لا حاجة لنظام صلاحيات معقد
 * 
 * @example
 * const { user, menuItems, dashboardCards, quickActions } = useRole();
 */
export function useRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // محاولة الحصول على user من Redux أولاً
  const reduxUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    // استخدام Redux user إذا كان متاحاً، وإلا من localStorage
    const currentUser = reduxUser || getUser();
    setUser(currentUser);
    setLoading(false);
  }, [reduxUser]);

  // دالة بسيطة للتحقق من الصلاحيات
  // في هذا المشروع المبسط، مسؤول الجامعة لديه جميع الصلاحيات
  const canAccess = (permission) => {
    // إذا كان المستخدم مسؤول جامعة، لديه جميع الصلاحيات
    if (isUniversityAdmin()) {
      return true;
    }
    // غير ذلك، لا يملك صلاحيات
    return false;
  };

  return {
    // User data
    user,
    role: user?.role || null,
    loading,

    // Menu & Navigation
    menuItems,
    dashboardCards,
    quickActions,

    // Helper flags
    isAuthenticated: !!user,
    isUniversityAdmin: isUniversityAdmin(),

    // Permissions
    canAccess,
  };
}

export default useRole;
