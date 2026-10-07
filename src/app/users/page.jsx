"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import RoleGuard from "@/components/RoleGuard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import { Button, Card, CardContent } from "@/components/ui";
import Link from "next/link";
import { GraduationCap, UserCheck, ArrowLeft, ArrowRight } from "lucide-react";

/**
 * صفحة إدارة المستخدمين الرئيسية
 * متاحة فقط لمسؤول الجامعة
 */
export default function UsersPage() {
  return (
    <RoleGuard>
      <UsersContent />
    </RoleGuard>
  );
}

function UsersContent() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const router = useRouter();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const tabs = [
    {
      id: "students",
      name: t("Users.students"),
      icon: GraduationCap,
      href: "/users/students",
      description: t("Users.manageStudents"),
    },
    {
      id: "supervisors",
      name: t("Users.supervisors"),
      icon: UserCheck,
      href: "/users/supervisors",
      description: t("Users.manageSupervisors"),
    },
  ];

  return (
    <AnimatedWrapper>
      <div className={`space-y-8 p-6 sm:p-8 ${isRtl ? "text-right" : "text-left"}`}>
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-h1 text-text">{t("Users.title")}</h1>
          <p className="text-body-sm text-text-secondary">{t("Users.description")}</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;

            return (
              <Link key={tab.id} href={tab.href} className="group block">
                <Card
                  elevated
                  className="h-full border-border transition-colors duration-200 group-hover:border-primary/40 group-hover:bg-surface-elevated"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary-muted p-3.5 text-primary transition-colors group-hover:bg-primary/15">
                      <TabIcon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h2 className="text-h3 text-text">{tab.name}</h2>
                        <ArrowIcon
                          className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary"
                          aria-hidden
                        />
                      </div>
                      <CardContent className="p-0">{tab.description}</CardContent>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="border-border bg-primary-muted/40">
          <h2 className="mb-4 text-h3 text-text">{t("Users.quickActions")}</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push("/users/students?action=create")}
              className="inline-flex"
            >
              <GraduationCap size={18} />
              {t("Users.addStudent")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/users/supervisors?action=create")}
              className="inline-flex"
            >
              <UserCheck size={18} />
              {t("Users.addSupervisor")}
            </Button>
          </div>
        </Card>
      </div>
    </AnimatedWrapper>
  );
}
