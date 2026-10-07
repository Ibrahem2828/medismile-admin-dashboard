"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileText, Heart, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import {
  Badge,
  Card,
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableBody,
  DataTableRow,
  DataTableTd,
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui";
import { useRtl } from "@/hooks/useRtl";
import toast from "react-hot-toast";
import {
  fetchCommunityContentAsync,
  clearError as clearMediContentError,
} from "@/redux/features/mediContent/mediContentSlice";

function getStatusBadge(status) {
  const map = {
    approved: { label: "موافق عليه", variant: "success" },
    pending: { label: "قيد المراجعة", variant: "warning" },
    rejected: { label: "مرفوض", variant: "danger" },
    draft: { label: "مسودة", variant: "default" },
  };
  const info = map[status] || { label: status || "غير محدد", variant: "default" };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

function CommunityContentPageInner() {
  const { i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();

  const { content, loading, error } = useSelector((state) => state.mediContent);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    dispatch(fetchCommunityContentAsync({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearMediContentError());
    }
  }, [error, dispatch]);

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4 sm:p-6" />;
  }

  const directionRtl = isRtl || i18n?.language === "ar";
  const emptyLabel = "لا يوجد محتوى مجتمع حتى الآن";

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen bg-background p-4 sm:p-6 lg:p-8 ${
          directionRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="space-y-1">
            <h1 className="text-h1 text-text">محتوى المجتمع الجامعي</h1>
            <p className="text-body-sm text-text-secondary">
              عرض جميع منشورات المجتمع الخاصة بجامعتك (قراءة فقط لمسؤول الجامعة)
            </p>
          </div>

          {loading && content.length === 0 && <DataTableLoading />}

          {!loading && (
            <>
              <div className="hidden sm:block">
                {content && content.length > 0 ? (
                  <DataTable dir={directionRtl ? "rtl" : "ltr"} minWidth="900px">
                    <DataTableHead>
                      <tr>
                        <DataTableTh>العنوان</DataTableTh>
                        <DataTableTh>الكاتب</DataTableTh>
                        <DataTableTh>النوع</DataTableTh>
                        <DataTableTh>الحالة</DataTableTh>
                        <DataTableTh>الإعجابات</DataTableTh>
                        <DataTableTh>التعليقات</DataTableTh>
                        <DataTableTh>تاريخ الإنشاء</DataTableTh>
                      </tr>
                    </DataTableHead>
                    <DataTableBody>
                      {content.map((item) => (
                        <DataTableRow key={item.id}>
                          <DataTableTd>
                            {item.status === "approved" ? (
                              <Link
                                href={`/community/${item.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {item.title || "-"}
                              </Link>
                            ) : (
                              <span className="font-medium text-text">
                                {item.title || "-"}
                              </span>
                            )}
                          </DataTableTd>
                          <DataTableTd className="text-text-secondary">
                            {item.author_name || "-"}
                          </DataTableTd>
                          <DataTableTd>
                            {item.content_type ? (
                              <Badge variant="primary">{item.content_type}</Badge>
                            ) : (
                              "-"
                            )}
                          </DataTableTd>
                          <DataTableTd>{getStatusBadge(item.status)}</DataTableTd>
                          <DataTableTd className="tabular-nums text-text-secondary">
                            {item.likes_count ?? 0}
                          </DataTableTd>
                          <DataTableTd className="tabular-nums text-text-secondary">
                            {item.comments_count ?? 0}
                          </DataTableTd>
                          <DataTableTd className="whitespace-nowrap tabular-nums text-text-secondary">
                            {formatDate(item.created_at)}
                          </DataTableTd>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                ) : (
                  <DataTableEmpty>
                    <FileText size={40} className="mx-auto mb-3 text-muted" />
                    <p className="text-body-sm text-muted">{emptyLabel}</p>
                  </DataTableEmpty>
                )}
              </div>

              <div className="grid gap-3 sm:hidden">
                {content && content.length > 0 ? (
                  content.map((item) => (
                    <Card key={item.id} className="!p-4">
                      <h3 className="mb-2 text-h3 text-text">
                        {item.status === "approved" ? (
                          <Link
                            href={`/community/${item.id}`}
                            className="hover:text-primary"
                          >
                            {item.title || "-"}
                          </Link>
                        ) : (
                          item.title || "-"
                        )}
                      </h3>
                      <div className="mb-3 space-y-1 text-body-sm text-muted">
                        <p>الكاتب: {item.author_name || "-"}</p>
                        <p>النوع: {item.content_type || "-"}</p>
                      </div>
                      <div className="mb-3">{getStatusBadge(item.status)}</div>
                      <div
                        className={`flex flex-wrap items-center gap-3 text-caption text-muted ${
                          directionRtl ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Heart size={14} className="text-primary" />
                          {item.likes_count ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle size={14} className="text-primary" />
                          {item.comments_count ?? 0}
                        </span>
                        <span className="tabular-nums">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <DataTableEmpty>
                    <FileText size={40} className="mx-auto mb-3 text-muted" />
                    <p className="text-body-sm text-muted">{emptyLabel}</p>
                  </DataTableEmpty>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}

export default function CommunityContentPage() {
  return (
    <RoleGuard>
      <CommunityContentPageInner />
    </RoleGuard>
  );
}
