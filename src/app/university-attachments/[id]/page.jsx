"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, FileText, Download, Image, Video, File, User, Eye, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import { Button, Badge, Card } from "@/components/ui";
import { useRtl } from "@/hooks/useRtl";
import toast from "react-hot-toast";
import {
  fetchAttachmentByIdAsync,
  clearError,
  clearSelectedAttachment,
} from "@/redux/features/attachments/attachmentsSlice";
import Link from "next/link";

function AttachmentDetailsInner() {
  const { id } = useParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();

  const attachmentsState = useSelector((state) => state.attachments);
  const attachment = attachmentsState?.selectedAttachment || null;
  const loading = attachmentsState?.loadingSelected || false;
  const error = attachmentsState?.error || null;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // جلب تفاصيل المرفق عند فتح الصفحة
  useEffect(() => {
    if (id) {
      dispatch(fetchAttachmentByIdAsync(id));
    }
    // تنظيف المرفق المحدد عند الخروج
    return () => {
      dispatch(clearSelectedAttachment());
    };
  }, [dispatch, id]);

  // عرض رسائل الخطأ إن وجدت
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Helper function للحصول على أيقونة نوع الملف
  const getFileIcon = (fileCategory, mimeType) => {
    if (fileCategory === "image" || mimeType?.startsWith("image/")) {
      return <Image className="h-7 w-7 text-primary" aria-hidden />;
    }
    if (fileCategory === "video" || mimeType?.startsWith("video/")) {
      return <Video className="h-7 w-7 text-info" aria-hidden />;
    }
    return <File className="h-7 w-7 text-muted" aria-hidden />;
  };

  // Helper function لتنسيق نوع المرفق
  const getAttachmentTypeBadge = (type) => {
    const typeMap = {
      before_image: { label: "صورة قبل", variant: "info" },
      after_image: { label: "صورة بعد", variant: "success" },
      report: { label: "تقرير", variant: "warning" },
      other: { label: "أخرى", variant: "default" },
    };
    const typeInfo = typeMap[type] || { label: type, variant: "default" };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  // Helper function لتنسيق نوع الملف
  const getFileCategoryBadge = (category) => {
    const categoryMap = {
      image: { label: "صورة", variant: "primary" },
      document: { label: "وثيقة", variant: "info" },
      video: { label: "فيديو", variant: "warning" },
      other: { label: "أخرى", variant: "default" },
    };
    const categoryInfo = categoryMap[category] || { label: category, variant: "default" };
    return <Badge variant={categoryInfo.variant}>{categoryInfo.label}</Badge>;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6" />
    );
  }

  const directionRtl = isRtl || i18n?.language === "ar";

  if (loading && !attachment) {
    return (
      <AnimatedWrapper>
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${directionRtl ? "text-right" : "text-left"}`}>
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" size={32} />
          </div>
        </div>
      </AnimatedWrapper>
    );
  }

  if (error && !attachment) {
    return (
      <AnimatedWrapper>
        <div className={`min-h-screen space-y-4 p-4 sm:p-6 lg:p-8 ${directionRtl ? "text-right" : "text-left"}`}>
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger">
            <span>{error}</span>
          </div>
          <Button onClick={() => router.push("/university-attachments")}>
            العودة
          </Button>
        </div>
      </AnimatedWrapper>
    );
  }

  if (!attachment) {
    return (
      <AnimatedWrapper>
        <div className={`min-h-screen space-y-4 p-4 sm:p-6 lg:p-8 ${directionRtl ? "text-right" : "text-left"}`}>
          <p className="text-body-sm text-muted">المرفق غير موجود</p>
          <Button onClick={() => router.push("/university-attachments")}>
            العودة
          </Button>
        </div>
      </AnimatedWrapper>
    );
  }

  const isImage = attachment.file_category === "image" || attachment.mime_type?.startsWith("image/");

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
          directionRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.push("/university-attachments")}
            className={`px-0 text-primary hover:bg-transparent hover:text-primary-hover ${
              directionRtl ? "flex-row-reverse" : ""
            }`}
          >
            <ArrowLeft size={18} />
            العودة إلى المرفقات
          </Button>

          {/* Content Card */}
          <Card padding={false} className="overflow-hidden">
            {/* Header Section */}
            <div className="border-b border-border p-6 sm:p-8">
              <div className="mb-3 flex items-start gap-3">
                <div className="rounded-lg bg-primary-muted p-2.5">
                  {getFileIcon(attachment.file_category, attachment.mime_type)}
                </div>
                <h1 className="text-h1 text-text">
                  {attachment.original_filename || "مرفق بدون اسم"}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {getAttachmentTypeBadge(attachment.attachment_type)}
                {getFileCategoryBadge(attachment.file_category)}
                {attachment.is_visible_to_patient && (
                  <Badge variant="success">مرئي للمريض</Badge>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* File Preview (for images) */}
              {isImage && attachment.file_url && (
                <div>
                  <h3 className="mb-3 text-caption font-semibold text-muted">
                    معاينة الصورة
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={attachment.file_url}
                      alt={attachment.original_filename || "صورة"}
                      className="max-h-96 w-full bg-background object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden items-center justify-center bg-background p-8 text-muted">
                      <p>لا يمكن عرض الصورة</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-1.5 text-caption font-semibold text-muted">
                    اسم الملف
                  </h3>
                  <p className="text-body-sm text-text">
                    {attachment.original_filename || "-"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-caption font-semibold text-muted">
                    حجم الملف
                  </h3>
                  <p className="text-body-sm text-text tabular-nums">
                    {attachment.file_size_formatted || "-"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-caption font-semibold text-muted">
                    نوع الملف
                  </h3>
                  <p className="text-body-sm text-text">
                    {attachment.mime_type || "-"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1.5 text-caption font-semibold text-muted">
                    تاريخ الرفع
                  </h3>
                  <p className="text-body-sm text-text tabular-nums">
                    {attachment.created_at
                      ? new Date(attachment.created_at).toLocaleString("ar-SA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Related Info */}
              <div className="grid grid-cols-1 gap-4 border-t border-border pt-6 md:grid-cols-2">
                {attachment.case_title && (
                  <div>
                    <h3 className="mb-1.5 flex items-center gap-2 text-caption font-semibold text-muted">
                      <FileText size={16} className="text-primary" />
                      الحالة المرتبطة
                    </h3>
                    <Link
                      href={`/university-cases/${attachment.case_id}`}
                      className="inline-flex items-center gap-2 text-body-sm text-primary hover:underline"
                    >
                      {attachment.case_title}
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
                {attachment.uploaded_by_name && (
                  <div>
                    <h3 className="mb-1.5 flex items-center gap-2 text-caption font-semibold text-muted">
                      <User size={16} className="text-primary" />
                      الطالب الذي رفع الملف
                    </h3>
                    <p className="text-body-sm text-text">
                      {attachment.uploaded_by_name}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {attachment.file_url && (
                <div className="border-t border-border pt-6">
                  <div className={`flex flex-wrap gap-3 ${directionRtl ? "flex-row-reverse" : ""}`}>
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button>
                        <Eye size={18} />
                        معاينة
                      </Button>
                    </a>
                    <a
                      href={attachment.file_url}
                      download={attachment.original_filename}
                    >
                      <Button
                        variant="secondary"
                        className="border-success/30 bg-success/15 text-success hover:bg-success/20"
                      >
                        <Download size={18} />
                        تحميل
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AnimatedWrapper>
  );
}

export default function AttachmentDetailsPage() {
  return (
    <RoleGuard allowedRoles={["university_admin"]}>
      <AttachmentDetailsInner />
    </RoleGuard>
  );
}
