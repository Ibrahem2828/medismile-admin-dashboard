"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import { Button, Badge, Card } from "@/components/ui";
import { useRtl } from "@/hooks/useRtl";
import toast from "react-hot-toast";
import {
  fetchCommunityContentByIdAsync,
  deleteCommunityContentAsync,
  clearError as clearMediContentError,
  clearSelectedContent,
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

function CommunityContentDetailsInner() {
  const { id } = useParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();

  const { selectedContent, loadingSelected, loading, error } = useSelector(
    (state) => state.mediContent
  );

  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchCommunityContentByIdAsync(id));
    }
    return () => {
      dispatch(clearSelectedContent());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearMediContentError());
    }
  }, [error, dispatch]);

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا المحتوى من المجتمع؟"
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await dispatch(deleteCommunityContentAsync(id)).unwrap();
      toast.success("تم حذف المحتوى بنجاح");
      router.push("/community");
    } catch (err) {
      toast.error(err?.message || "فشل في حذف المحتوى");
    } finally {
      setDeleting(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4 sm:p-6" />;
  }

  const directionRtl = isRtl || i18n?.language === "ar";
  const content = selectedContent;
  const isLoading = loadingSelected || (!content && loading);

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
          directionRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 ${
              directionRtl ? "flex-row-reverse" : ""
            }`}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/community")}
              className={`px-0 text-primary hover:bg-transparent hover:text-primary-hover ${
                directionRtl ? "flex-row-reverse" : ""
              }`}
            >
              <ArrowLeft size={18} />
              {directionRtl ? "رجوع إلى قائمة المحتوى" : "Back to community list"}
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || isLoading || !content}
              loading={deleting}
            >
              {!deleting ? <Trash2 size={16} /> : null}
              حذف المحتوى
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-8 w-8 animate-spin text-primary" size={32} />
            </div>
          )}

          {!isLoading && !content && (
            <Card className="!p-6 text-center">
              <p className="text-body-sm text-muted">
                المحتوى غير موجود أو تم حذفه.
              </p>
            </Card>
          )}

          {!isLoading && content && (
            <Card padding={false} className="overflow-hidden">
              <div className="border-b border-border p-6 sm:p-8">
                <h1 className="mb-3 text-h1 text-text">
                  {content.title || "بدون عنوان"}
                </h1>
                <div className="mb-3 space-y-1 text-body-sm text-muted">
                  <p>الكاتب: {content.author_name || "-"}</p>
                  {content.university_name && (
                    <p>الجامعة: {content.university_name}</p>
                  )}
                  {content.approved_by_name && (
                    <p>تمت الموافقة بواسطة: {content.approved_by_name}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.content_type && (
                    <Badge variant="primary">النوع: {content.content_type}</Badge>
                  )}
                  {content.category && (
                    <Badge variant="success">الفئة: {content.category}</Badge>
                  )}
                  {content.status && getStatusBadge(content.status)}
                  {typeof content.is_featured === "boolean" &&
                    content.is_featured && (
                      <Badge variant="warning">مميز</Badge>
                    )}
                  {typeof content.is_public === "boolean" &&
                    content.is_public && (
                      <Badge variant="info">مرئي للمرضى (عام)</Badge>
                    )}
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-8">
                {content.description && (
                  <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-text">
                    {content.description}
                  </p>
                )}

                {content.tags && (
                  <p className="text-body-sm text-muted">
                    الوسوم: {content.tags}
                  </p>
                )}

                {content.url && (
                  <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-body-sm text-primary hover:underline"
                  >
                    فتح الرابط الخارجي
                  </a>
                )}

                {content.file_url && (
                  <a
                    href={content.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-body-sm text-primary hover:underline"
                  >
                    عرض / تحميل الملف المرفق
                  </a>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-5 text-caption text-muted">
                  {content.created_at && (
                    <span>
                      تم الإنشاء:{" "}
                      {new Date(content.created_at).toLocaleString("ar-SA")}
                    </span>
                  )}
                  {content.approved_at && (
                    <span>
                      تاريخ الموافقة:{" "}
                      {new Date(content.approved_at).toLocaleString("ar-SA")}
                    </span>
                  )}
                  {content.updated_at && (
                    <span>
                      آخر تحديث:{" "}
                      {new Date(content.updated_at).toLocaleString("ar-SA")}
                    </span>
                  )}
                  <span>الإعجابات: {content.likes_count ?? 0}</span>
                  <span>التعليقات: {content.comments_count ?? 0}</span>
                  {content.view_count !== undefined && (
                    <span>المشاهدات: {content.view_count ?? 0}</span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}

export default function CommunityContentDetailsPage() {
  return (
    <RoleGuard>
      <CommunityContentDetailsInner />
    </RoleGuard>
  );
}
