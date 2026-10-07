"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download, Send, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import { Button, Badge, Card } from "@/components/ui";
import { useRtl } from "@/hooks/useRtl";
import toast from "react-hot-toast";
import {
  fetchReportByIdAsync,
  submitReportAsync,
  exportReportAsync,
  clearError,
  clearSelectedReport,
} from "@/redux/features/reports/reportsSlice";
import apiClient from "@/services/api";

function ReportDetailsInner() {
  const { id } = useParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();

  const reportsState = useSelector((state) => state.reports);
  const report = reportsState?.selectedReport || null;
  const loading = reportsState?.loading || false;
  const loadingSelected = reportsState?.loadingSelected || false;
  const error = reportsState?.error || null;

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);

  // جلب معلومات المستخدم
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // جلب تفاصيل التقرير عند فتح الصفحة
  useEffect(() => {
    if (id) {
      dispatch(fetchReportByIdAsync(id));
    }
    // تنظيف التقرير المحدد عند الخروج
    return () => {
      dispatch(clearSelectedReport());
    };
  }, [dispatch, id]);

  // عرض رسائل الخطأ إن وجدت
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async () => {
    if (!id) return;
    
    const confirmed = window.confirm(
      "هل أنت متأكد من تقديم هذا التقرير؟ لن يمكن تعديله بعد التقديم."
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await dispatch(submitReportAsync(id)).unwrap();
      toast.success("تم تقديم التقرير بنجاح");
      // إعادة جلب التقرير المحدث
      dispatch(fetchReportByIdAsync(id));
    } catch (err) {
      toast.error(err?.message || "فشل في تقديم التقرير");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (format = "pdf") => {
    if (!id) return;

    try {
      if (format === "pdf") {
        setExporting(true);
      } else {
        setExportingExcel(true);
      }

      // استدعاء API التصدير للحصول على file_url
      const result = await dispatch(exportReportAsync({ id, format })).unwrap();
      
      // الحصول على file_url من الاستجابة
      let fileUrl = result?.file_url || result?.data?.file_url;
      
      if (!fileUrl) {
        console.error("Export result:", result); // للتصحيح
        toast.error("لم يتم الحصول على رابط الملف من الـ API");
        return;
      }

      console.log("File URL from API:", fileUrl); // للتصحيح

      // بناء URL كامل للملف
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.medismile.xn--mgbaab0cxheq.tech/api";
      let fullFileUrl = fileUrl;
      
      if (fileUrl.startsWith("/")) {
        // إذا كان المسار نسبي، نضيف base URL (بدون /api/)
        const baseUrl = apiBaseUrl.replace(/\/api$/, "");
        fullFileUrl = `${baseUrl}${fileUrl}`;
      }

      console.log("Full file URL:", fullFileUrl); // للتصحيح

      // جلب الملف الفعلي من الرابط
      const accessToken = localStorage.getItem("access_token");
      const fileResponse = await fetch(fullFileUrl, {
        method: "GET",
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (!fileResponse.ok) {
        console.error("File response status:", fileResponse.status, fileResponse.statusText);
        throw new Error(`فشل في تحميل الملف: ${fileResponse.status}`);
      }

      // التحقق من نوع المحتوى
      const contentType = fileResponse.headers.get("content-type");
      console.log("Content-Type:", contentType); // للتصحيح

      // إذا كان المحتوى JSON، فهناك مشكلة
      if (contentType && contentType.includes("application/json")) {
        const jsonData = await fileResponse.json();
        console.error("Received JSON instead of file:", jsonData);
        throw new Error("الخادم أعاد JSON بدلاً من الملف. يرجى التحقق من رابط الملف.");
      }

      // تحويل الاستجابة إلى blob (ملف)
      const blob = await fileResponse.blob();
      console.log("Blob type:", blob.type, "Size:", blob.size); // للتصحيح

      // إنشاء رابط تحميل
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      
      // اسم الملف مع الامتداد الصحيح
      const fileExtension = format === "pdf" ? "pdf" : "xlsx";
      const fileName = `تقرير_${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      link.download = fileName;
      
      // تحميل الملف
      document.body.appendChild(link);
      link.click();
      
      // تنظيف
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success("تم تحميل الملف بنجاح");
    } catch (err) {
      console.error("Export error:", err);
      const errorMessage = err?.message || err || `فشل في تصدير التقرير إلى ${format === "pdf" ? "PDF" : "Excel"}`;
      toast.error(errorMessage);
    } finally {
      setExporting(false);
      setExportingExcel(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6" />
    );
  }

  const directionRtl = isRtl || i18n?.language === "ar";

  const getStatusBadge = (status) => {
    const map = {
      draft: { label: "مسودة", variant: "warning" },
      submitted: { label: "مقدمة", variant: "info" },
      approved: { label: "موافق عليها", variant: "success" },
      rejected: { label: "مرفوضة", variant: "danger" },
      locked: { label: "مقفلة", variant: "default" },
    };
    const info = map[status] || { label: status, variant: "default" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  if (loadingSelected && !report) {
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

  if (error && !report) {
    return (
      <AnimatedWrapper>
        <div className={`min-h-screen space-y-4 p-4 sm:p-6 lg:p-8 ${directionRtl ? "text-right" : "text-left"}`}>
          <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button onClick={() => router.push("/reports")}>العودة</Button>
        </div>
      </AnimatedWrapper>
    );
  }

  if (!report) {
    return (
      <AnimatedWrapper>
        <div className={`min-h-screen space-y-4 p-4 sm:p-6 lg:p-8 ${directionRtl ? "text-right" : "text-left"}`}>
          <p className="text-body-sm text-muted">التقرير غير موجود</p>
          <Button onClick={() => router.push("/reports")}>العودة</Button>
        </div>
      </AnimatedWrapper>
    );
  }

  const canSubmit = (user?.role === "university_admin" || user?.role === "supervisor" || user?.role === "student") && 
                    report.status === "draft";
  const canExport = user?.role === "university_admin";
  const canUpdate = (user?.role === "university_admin" || user?.role === "supervisor" || user?.role === "student") && 
                    (report.status === "draft" || report.status === "rejected");

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <AnimatedWrapper>
      <div
        className={`p-4 sm:p-6 lg:p-8 min-h-screen ${
          directionRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/reports")}
            className={`px-0 text-primary hover:bg-transparent hover:text-primary-hover ${
              directionRtl ? "flex-row-reverse" : ""
            }`}
          >
            <ArrowLeft size={18} />
            العودة إلى التقارير
          </Button>

          {/* Content Card */}
          <Card padding={false} className="overflow-hidden">
            {/* Header Section */}
            <div className="border-b border-border p-6 sm:p-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h1 className="mb-3 text-h1 text-text">
                    {report.title || "بدون عنوان"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {report.student_name && (
                      <span className="text-body-sm text-muted">
                        الطالب: {report.student_name}
                      </span>
                    )}
                    {report.report_type && (
                      <Badge variant="primary">{report.report_type}</Badge>
                    )}
                  </div>
                </div>
                {/* Status Badge */}
                {report.status ? getStatusBadge(report.status) : null}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* Description */}
              {report.description && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    الوصف
                  </h3>
                  <p className="whitespace-pre-wrap text-body-sm text-text">
                    {report.description}
                  </p>
                </div>
              )}

              {/* Content (JSON) */}
              {report.content && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    المحتوى
                  </h3>
                  <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 text-caption text-text">
                    {JSON.stringify(report.content, null, 2)}
                  </pre>
                </div>
              )}

              {/* Target Info */}
              {report.target_type && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    الهدف
                  </h3>
                  <p className="text-body-sm text-text">
                    {report.target_type === "case" ? "حالة سريرية" : 
                     report.target_type === "appointment" ? "موعد" : 
                     report.target_type === "session" ? "جلسة" : 
                     report.target_type}
                  </p>
                </div>
              )}

              {/* Author Info */}
              {report.author_name && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    المؤلف
                  </h3>
                  <p className="text-body-sm text-text">
                    {report.author_name}
                    {report.author_role && (
                      <span className="text-sm text-muted mr-2">
                        ({report.author_role === "student" ? "طالب" : 
                          report.author_role === "supervisor" ? "مشرف" : 
                          report.author_role === "university_admin" ? "مسؤول جامعة" : 
                          report.author_role})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Supervisor Info */}
              {report.supervisor_name && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    المشرف
                  </h3>
                  <p className="text-body-sm text-text">
                    {report.supervisor_name}
                  </p>
                </div>
              )}

              {/* University Info */}
              {report.university_name && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    الجامعة
                  </h3>
                  <p className="text-body-sm text-text">
                    {report.university_name}
                  </p>
                </div>
              )}

              {/* Score */}
              {report.score !== null && report.score !== undefined && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    النتيجة
                  </h3>
                  <p className="text-body-sm text-text">
                    {report.score}/100
                  </p>
                </div>
              )}

              {/* Feedback */}
              {report.feedback && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    الملاحظات
                  </h3>
                  <p className="text-body-sm text-text whitespace-pre-wrap">
                    {report.feedback}
                  </p>
                </div>
              )}

              {/* Review Info */}
              {report.approved_by_name && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    الموافق عليه
                  </h3>
                  <p className="text-body-sm text-text">
                    {report.approved_by_name}
                  </p>
                  {report.approved_at && (
                    <p className="mt-1 text-sm text-muted">
                      تاريخ الموافقة: {formatDate(report.approved_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Review Notes */}
              {report.review_notes && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    ملاحظات المراجعة
                  </h3>
                  <p className="text-body-sm text-text whitespace-pre-wrap">
                    {report.review_notes}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.created_at && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold text-muted">
                      تاريخ الإنشاء
                    </h3>
                    <p className="text-body-sm text-text">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                )}
                {report.submitted_at && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold text-muted">
                      تاريخ التقديم
                    </h3>
                    <p className="text-body-sm text-text">
                      {formatDate(report.submitted_at)}
                    </p>
                  </div>
                )}
                {report.approved_at && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold text-muted">
                      تاريخ الموافقة
                    </h3>
                    <p className="text-body-sm text-text">
                      {formatDate(report.approved_at)}
                    </p>
                  </div>
                )}
                {report.locked_at && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold text-muted">
                      تاريخ القفل
                    </h3>
                    <p className="text-body-sm text-text">
                      {formatDate(report.locked_at)}
                    </p>
                  </div>
                )}
                {report.rejected_at && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold text-muted">
                      تاريخ الرفض
                    </h3>
                    <p className="text-body-sm text-text">
                      {formatDate(report.rejected_at)}
                    </p>
                  </div>
                )}
                {report.updated_at && (
                  <div>
                    <h3 className="mb-2 text-caption font-semibold text-muted">
                      آخر تحديث
                    </h3>
                    <p className="text-body-sm text-text">
                      {formatDate(report.updated_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {report.attachments && report.attachments.length > 0 && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    المرفقات
                  </h3>
                  <div className="space-y-2">
                    {report.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-body-sm text-primary hover:underline"
                      >
                        {attachment.type || `مرفق ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}


              {/* Actions */}
              {(canSubmit || canExport) && (
                <div className="border-t border-border pt-6">
                  <div className={`flex flex-wrap gap-3 ${directionRtl ? "flex-row-reverse" : ""}`}>
                    {canSubmit && (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || exporting || exportingExcel}
                        loading={submitting}
                      >
                        {!submitting ? <Send size={18} /> : null}
                        تقديم التقرير
                      </Button>
                    )}
                    {canExport && (
                      <>
                        <Button
                          variant="danger"
                          onClick={() => handleExport("pdf")}
                          disabled={submitting || exporting || exportingExcel}
                          loading={exporting}
                        >
                          {!exporting ? <Download size={18} /> : null}
                          تصدير PDF
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleExport("excel")}
                          disabled={submitting || exporting || exportingExcel}
                          loading={exportingExcel}
                          className="border-success/30 bg-success/15 text-success hover:bg-success/20"
                        >
                          {!exportingExcel ? <FileSpreadsheet size={18} /> : null}
                          تصدير Excel
                        </Button>
                      </>
                    )}
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

export default function ReportDetailsPage() {
  return (
    <RoleGuard>
      <ReportDetailsInner />
    </RoleGuard>
  );
}

