"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { getUser, isUniversityAdmin } from "@/lib/auth";
import { dashboardCards, quickActions } from "@/lib/roleConfig";
import SharedCards from "./SharedCards";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, Bell } from "lucide-react";

/**
 * Dashboard مخصصة لإدارة الجامعة
 * بدون رسوم بيانية وبدون تكرار روابط الـSidebar
 */
export default function UniversityAdminDashboard() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSupervisors: 0,
    activeCases: 0,
    pendingContent: 0,
    totalEvaluations: 0,
    reportsGenerated: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);

    if (!isUniversityAdmin()) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { fetchUniversityAdminDashboardStats } = await import(
          "@/services/dashboardApi"
        );
        const dashboardData = await fetchUniversityAdminDashboardStats();

        setStats({
          totalStudents: dashboardData.totalStudents,
          totalSupervisors: dashboardData.totalSupervisors,
          activeCases: dashboardData.activeCases,
          pendingContent: dashboardData.pendingContent,
          totalEvaluations: dashboardData.totalEvaluations,
          reportsGenerated: dashboardData.reportsGenerated,
        });

        setNotifications([]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const cardsWithValues = (dashboardCards || []).map((card) => {
    const valueMap = {
      total_students: stats.totalStudents,
      total_supervisors: stats.totalSupervisors,
      active_cases: stats.activeCases,
      pending_content: stats.pendingContent,
      total_evaluations: stats.totalEvaluations,
      reports_generated: stats.reportsGenerated,
    };
    return {
      ...card,
      value: valueMap[card.id] || card.value || 0,
    };
  });

  const Arrow = isRtl ? ArrowUpLeft : ArrowUpRight;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : "text-left"}`}>
      {/* Stats only — navigation stays in Sidebar */}
      <section>
        <SharedCards cards={cardsWithValues} />
      </section>

      {/* Notifications + Quick create actions (not sidebar duplicates) */}
      <section
        className={cx(
          "grid gap-4 lg:grid-cols-2",
          isRtl ? "text-right" : "text-left"
        )}
      >
        <Card className="!rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell size={18} className="text-primary" />
              {t("Home.notifications")}
            </CardTitle>
          </CardHeader>
          <ul className="m-0 list-none space-y-1 p-0">
            {notifications.length > 0 ? (
              notifications.map((note, idx) => (
                <li key={idx}>
                  <Link
                    href={note.href || "#"}
                    className="block rounded-lg px-2 py-2 transition-colors hover:bg-primary-muted"
                  >
                    <p className="m-0 text-sm font-medium text-text">
                      {note.message}
                    </p>
                    <span className="text-caption text-muted">{note.time}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm text-muted">
                {t("Home.noNotifications")}
              </li>
            )}
          </ul>
        </Card>

        {quickActions?.length > 0 && (
          <Card className="!rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">
                {t("Home.quickActions")}
              </CardTitle>
            </CardHeader>
            <ul className="m-0 list-none space-y-1.5 p-0">
              {quickActions.map((action, idx) => {
                const ActionIcon = action.icon;
                const actionName = isRtl
                  ? action.name
                  : action.nameEn || action.name;
                return (
                  <li key={idx}>
                    <Link
                      href={action.href}
                      className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border hover:bg-primary-muted hover:text-primary"
                    >
                      {ActionIcon ? (
                        <ActionIcon size={18} className="shrink-0 text-muted" />
                      ) : null}
                      <span className="flex-1">{actionName}</span>
                      <Arrow size={14} className="text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
