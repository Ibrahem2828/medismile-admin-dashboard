"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import PageLoader from "../PageLoader";

/**
 * AuthGuard Component
 * 
 * يحمي الصفحات من الوصول غير المصرح به
 * - يتحقق من المصادقة فقط (ليس الصلاحيات)
 * - يوجه للـ login إذا لم يكن مسجل دخول
 * - يعرض loading state أثناء التحقق
 * 
 * @param {ReactNode} children - المحتوى المراد حمايته
 * @param {boolean} redirectToLogin - إذا كان true، يوجه للـ login (افتراضي: true)
 * @param {string} redirectPath - المسار للتوجيه (افتراضي: "/login")
 * 
 * @example
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 * 
 * @example
 * <AuthGuard redirectToLogin={false} redirectPath="/unauthorized">
 *   <ProtectedPage />
 * </AuthGuard>
 */
export default function AuthGuard({
  children,
  redirectToLogin = true,
  redirectPath = "/login",
}) {
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // الحصول على user من Redux (Single Source of Truth)
  const user = useSelector((state) => state.auth?.user);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const accessToken = useSelector((state) => state.auth?.tokens?.access);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // التحقق من المصادقة
    const authenticated = isAuthenticated && user && accessToken;

    if (!authenticated) {
      // غير مسجل دخول → توجيه
      if (redirectToLogin) {
        router.push(redirectPath);
      } else {
        // إذا كان redirectToLogin = false، نعرض loading فقط
        // (يمكن استخدامه مع ErrorBoundary)
        setChecking(false);
      }
      return;
    }

    // مسجل دخول → نعرض المحتوى
    setChecking(false);
  }, [mounted, isAuthenticated, user, accessToken, redirectToLogin, redirectPath, router]);

  // أثناء التحقق، نعرض loading
  if (!mounted || checking) {
    return <PageLoader loading={true} hasSidebar={false} />;
  }

  // إذا لم يكن مسجل دخول و redirectToLogin = false، نعيد null
  if (!isAuthenticated && !redirectToLogin) {
    return null;
  }

  // مسجل دخول → نعرض المحتوى
  return <>{children}</>;
}


