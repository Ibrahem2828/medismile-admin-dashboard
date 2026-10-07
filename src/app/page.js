"use client";

import { useTranslation } from "react-i18next";
import { useRtl } from "../hooks/useRtl";
import { useRole } from "@/hooks/useRole";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import UniversityAdminDashboard from "@/components/dashboard/UniversityAdminDashboard";
import RoleGuard from "@/components/RoleGuard";

/**
 * الصفحة الرئيسية - Dashboard
 *
 * ملاحظة: هذا المشروع خاص فقط بإدارة الجامعة (university_admin)
 */
export default function Home() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const { user } = useRole();

  const userName = user?.first_name || user?.username || t("Home.guest");

  return (
    <RoleGuard>
      <AnimatedWrapper>
        <div
          className={`space-y-6 sm:space-y-8 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          {/* Plain greeting — no card stuck under the top bar */}
          <header className="pt-1">
            <h1 className="m-0 text-h2 font-bold text-text sm:text-h1">
              {t("Home.greeting", { name: userName }) || `مرحباً ${userName}`}
            </h1>
            <p className="mt-1.5 m-0 max-w-2xl text-body-sm text-text-secondary">
              {t("Home.description")}
            </p>
          </header>

          <UniversityAdminDashboard />
        </div>
      </AnimatedWrapper>
    </RoleGuard>
  );
}
