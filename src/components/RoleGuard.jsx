"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, getAccessToken, isUniversityAdmin } from "@/lib/auth";

/**
 * RoleGuard Component - مبسط
 * 
 * يحمي الصفحات - يتحقق فقط من تسجيل الدخول وأن المستخدم هو مسؤول جامعة
 * 
 * ملاحظة: هذا المشروع خاص فقط بمسؤول الجامعة (university_admin)
 * تم تبسيط النظام - لا حاجة لنظام صلاحيات معقد
 * 
 * @example
 * <RoleGuard>
 *   <ProtectedContent />
 * </RoleGuard>
 */
export default function RoleGuard({ children, redirectToLogin = true, redirectPath = "/unauthorized" }) {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = getUser();
    const token = getAccessToken();

    // غير مسجل دخول → توجيه لصفحة تسجيل الدخول
    if (!storedUser || !token) {
      if (redirectToLogin) {
        router.push("/login");
      } else {
        router.push(redirectPath);
      }
      return;
    }

    // التحقق من أن المستخدم هو مسؤول جامعة
    if (!isUniversityAdmin()) {
      router.push(redirectPath);
      return;
    }

    // كل شيء صحيح، نعرض المحتوى
    setReady(true);
    setChecking(false);
  }, [redirectToLogin, redirectPath, router]);

  // أثناء التحقق، نعرض loading
  if (checking || !ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
