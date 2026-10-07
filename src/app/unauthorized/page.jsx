"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import Link from "next/link";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import { Button, Card } from "@/components/ui";

/**
 * صفحة Unauthorized
 * تظهر عندما يحاول المستخدم الوصول إلى صفحة أو مورد ليس لديه صلاحية للوصول إليه
 */
export default function UnauthorizedPage() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AnimatedWrapper>
      <div
        className={`flex min-h-screen items-center justify-center bg-background p-6 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <Card className="w-full max-w-md !p-6 text-center sm:!p-8">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-danger/15 p-6">
              <ShieldX className="h-16 w-16 text-danger" />
            </div>
          </div>

          <h1 className="mb-4 text-h1 text-text">{t("Unauthorized.title")}</h1>

          <p className="mb-6 text-body-sm text-text-secondary">
            {t("Unauthorized.description")}
            <br />
            {t("Unauthorized.contactSupport")}
          </p>

          <p className="mb-8 text-caption text-muted">
            {t("Unauthorized.autoRedirect")}
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => router.push("/")}>
              <Home size={20} />
              {t("Unauthorized.homeButton")}
            </Button>

            <Button variant="secondary" onClick={() => router.back()}>
              <ArrowLeft size={20} />
              {t("Unauthorized.backButton")}
            </Button>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <Link
              href="/support"
              className="text-body-sm text-primary hover:underline"
            >
              {t("Unauthorized.contactSupportLink")}
            </Link>
          </div>
        </Card>
      </div>
    </AnimatedWrapper>
  );
}
