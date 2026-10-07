"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Eye,
  Trash2,
  X,
  Loader2,
  FileText,
  Calendar,
  User,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  fetchReportsAsync,
  deleteReportAsync,
  fetchReportByIdAsync,
  clearError,
} from "../../redux/features/reports/reportsSlice";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import {
  Button,
  Input,
  Badge,
  Card,
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui";
import toast from "react-hot-toast";
import RoleGuard from "@/components/RoleGuard";
import { useRole } from "@/hooks/useRole";
import { fetchUniversityAdminProfile } from "@/services/universityApi";
import * as XLSX from "xlsx";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

export default function ReportsPage() {
  return (
    <RoleGuard>
      <ReportsContent />
    </RoleGuard>
  );
}

function ReportsContent() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useRole();
  const reportsState = useSelector((state) => state.reports);
  const reports = reportsState?.reports || [];
  const selectedReport = reportsState?.selectedReport;
  const loading = reportsState?.loading || false;
  const loadingSelected = reportsState?.loadingSelected || false;
  const error = reportsState?.error || null;
  const filters = reportsState?.filters || {};

  const [mounted, setMounted] = useState(false);
  const [universityId, setUniversityId] = useState(null);
  useEffect(() => setMounted(true), []);

  // State
  const [showDetails, setShowDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    report_type: "clinical_case",
    target_type: "case",
    target_id: "",
    title: "",
    description: "",
    content: "",
    attachments: "",
  });

  // جلب university_id من user أو Profile
  useEffect(() => {
    const loadUniversityId = async () => {
      if (!user) return;

      // محاولة جلب university_id من user object
      let universityId = user?.university_id || user?.university;
      
      // إذا كان object، نستخرج id
      if (!universityId && user?.university && typeof user.university === 'object') {
        universityId = user.university.id;
      }

      // إذا لم يكن موجوداً، نجرب جلب Profile من API
      if (!universityId && (user?.role === "university_admin" || user?.role === "college_admin")) {
        try {
          const profile = await fetchUniversityAdminProfile();
          
          // استخراج university_id من Profile
          if (profile?.university) {
            if (typeof profile.university === 'object') {
              universityId = profile.university.id || profile.university;
            } else {
              universityId = profile.university;
            }
          } else if (profile?.university_id) {
            universityId = profile.university_id;
          }

          // حفظ في localStorage إذا تم جلبها
          if (universityId) {
            const updatedUser = { ...user, university_id: universityId };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Error fetching university profile:", error);
        }
      }

      if (universityId) {
        setUniversityId(universityId);
      }
    };

    if (user) {
      loadUniversityId();
    }
  }, [user]);

  // جلب التقارير عند تحميل الصفحة
  useEffect(() => {
    if (!user) return; // انتظر حتى يتم تحميل المستخدم
    
    const params = {};
    if (reportTypeFilter !== "all") {
      params.report_type = reportTypeFilter;
    }
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (targetTypeFilter !== "all") {
      params.target_type = targetTypeFilter;
    }
    
    dispatch(fetchReportsAsync(params));
  }, [dispatch, user, reportTypeFilter, statusFilter, targetTypeFilter]);

  // عرض رسائل الخطأ
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // معالجة عرض التفاصيل
  // ⚠️ Backend يتحقق تلقائياً من أن التقرير يخص جامعة المستخدم
  // إذا كان التقرير من جامعة أخرى، يعيد Backend خطأ 403/404
  const handleViewDetails = async (reportId) => {
    try {
      await dispatch(fetchReportByIdAsync(reportId)).unwrap();
      setShowDetails(reportId);
    } catch (error) {
      // معالجة خطأ الوصول لتقرير من جامعة أخرى
      const errorMessage = error?.response?.data?.message || error?.message || error || t("Reports.fetchDetailsError");
      toast.error(errorMessage);
    }
  };

  // إغلاق تفاصيل التقرير
  const handleCloseDetails = () => {
    setShowDetails(null);
  };

  // معالجة حذف تقرير
  const handleDelete = async (reportId) => {
    if (!window.confirm(t("Reports.confirmDelete"))) return;

    try {
      await dispatch(deleteReportAsync(reportId)).unwrap();
      toast.success(t("Reports.deleteSuccess"));
      
      // إعادة جلب التقارير
      const params = {};
      if (reportTypeFilter !== "all") {
        params.report_type = reportTypeFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (targetTypeFilter !== "all") {
        params.target_type = targetTypeFilter;
      }
      dispatch(fetchReportsAsync(params));
    } catch (error) {
      toast.error(error || t("Reports.deleteError"));
    }
  };

  // فلترة التقارير
  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (report.title || "").toLowerCase().includes(searchLower) ||
      (report.description || "").toLowerCase().includes(searchLower) ||
      (report.student_name || "").toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  // Helper function لتنسيق نوع التقرير
  const getReportTypeBadge = (type) => {
    const typeMap = {
      academic: { label: t("Reports.types.academic"), variant: "info" },
      clinical: { label: t("Reports.types.clinical"), variant: "success" },
      progress: { label: t("Reports.types.progress"), variant: "warning" },
      summary: { label: t("Reports.types.summary"), variant: "primary" },
      clinical_case: { label: "حالة سريرية", variant: "success" },
    };
    const typeInfo = typeMap[type] || { label: type, variant: "default" };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

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

  // Helper function لتنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // تصدير التقارير إلى Excel
  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      toast.error("لا توجد تقارير للتصدير");
      return;
    }

    try {
      // تحضير البيانات للتصدير
      const excelData = filteredReports.map((report) => ({
        "العنوان": report.title || "-",
        "الوصف": report.description || "-",
        "نوع التقرير": report.report_type === "clinical_case" ? "حالة سريرية" : report.report_type || "-",
        "الحالة": 
          report.status === "draft" ? "مسودة" :
          report.status === "submitted" ? "مقدمة" :
          report.status === "approved" ? "موافق عليها" :
          report.status === "rejected" ? "مرفوضة" :
          report.status === "locked" ? "مقفلة" :
          report.status || "-",
        "الطالب": report.student_name || "-",
        "المشرف": report.supervisor_name || "-",
        "الجامعة": report.university_name || "-",
        "المؤلف": report.author_name || "-",
        "دور المؤلف": 
          report.author_role === "student" ? "طالب" :
          report.author_role === "supervisor" ? "مشرف" :
          report.author_role === "university_admin" ? "مسؤول جامعة" :
          report.author_role || "-",
        "النتيجة": report.score !== null && report.score !== undefined ? `${report.score}/100` : "-",
        "ملاحظات المراجعة": report.review_notes || "-",
        "الموافق عليه": report.approved_by_name || "-",
        "تاريخ الإنشاء": report.created_at ? formatDate(report.created_at) : "-",
        "تاريخ التقديم": report.submitted_at ? formatDate(report.submitted_at) : "-",
        "تاريخ الموافقة": report.approved_at ? formatDate(report.approved_at) : "-",
        "تاريخ القفل": report.locked_at ? formatDate(report.locked_at) : "-",
      }));

      // إنشاء workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "التقارير");

      // تحديد عرض الأعمدة
      const colWidths = [
        { wch: 25 }, // العنوان
        { wch: 30 }, // الوصف
        { wch: 15 }, // نوع التقرير
        { wch: 12 }, // الحالة
        { wch: 20 }, // الطالب
        { wch: 20 }, // المشرف
        { wch: 25 }, // الجامعة
        { wch: 20 }, // المؤلف
        { wch: 15 }, // دور المؤلف
        { wch: 10 }, // النتيجة
        { wch: 30 }, // ملاحظات المراجعة
        { wch: 20 }, // الموافق عليه
        { wch: 20 }, // تاريخ الإنشاء
        { wch: 20 }, // تاريخ التقديم
        { wch: 20 }, // تاريخ الموافقة
        { wch: 20 }, // تاريخ القفل
      ];
      ws["!cols"] = colWidths;

      // تصدير الملف
      const fileName = `التقارير_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`تم تصدير ${filteredReports.length} تقرير بنجاح`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("فشل في تصدير التقارير إلى Excel");
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4"></div>;
  }

  const isRtl = i18n?.language === "ar";

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen bg-background p-4 sm:p-6 lg:p-8 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="text-h1 text-text">
                {t("Reports.title")}
              </h1>
              <p className="text-body-sm text-text-secondary">
                {filteredReports.length} {t("Reports.total")}
              </p>
            </div>
            {filteredReports.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleExportExcel}
                className="border-success/30 bg-success/15 text-success hover:bg-success/20"
              >
                <FileSpreadsheet size={18} />
                تصدير Excel
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card padding className="!p-4 sm:!p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={labelClass}>
                  {t("actions.search")}
                </label>
                <div className="relative">
                  <Search
                    className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted ${
                      isRtl ? "right-3" : "left-3"
                    }`}
                    size={16}
                    aria-hidden
                  />
                  <Input
                    type="text"
                    placeholder={t("Reports.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isRtl ? "pr-10" : "pl-10"}
                  />
                </div>
              </div>

              {/* Report Type Filter */}
              <div>
                <label className={labelClass}>
                  {t("Reports.type")}
                </label>
                <select
                  value={reportTypeFilter}
                  onChange={(e) => setReportTypeFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t("actions.all")}</option>
                  <option value="academic">{t("Reports.types.academic")}</option>
                  <option value="clinical">{t("Reports.types.clinical")}</option>
                  <option value="progress">{t("Reports.types.progress")}</option>
                  <option value="summary">{t("Reports.types.summary")}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className={labelClass}>
                  {t("Reports.status")}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t("actions.all")}</option>
                  <option value="draft">مسودة</option>
                  <option value="submitted">مقدمة</option>
                  <option value="approved">موافق عليها</option>
                  <option value="rejected">مرفوضة</option>
                  <option value="locked">مقفلة</option>
                </select>
              </div>

              {/* Target Type Filter */}
              <div>
                <label className={labelClass}>نوع الهدف</label>
                <select
                  value={targetTypeFilter}
                  onChange={(e) => setTargetTypeFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t("actions.all")}</option>
                  <option value="case">حالة سريرية</option>
                  <option value="appointment">موعد</option>
                  <option value="session">جلسة</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 px-0 text-danger"
                  onClick={() => dispatch(clearError())}
                  aria-label="Dismiss"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && reports.length === 0 && <DataTableLoading />}

          {/* Reports List */}
          {!loading && (
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <DataTableEmpty>
                  <FileText size={40} className="mx-auto mb-3 text-muted" />
                  <p className="text-body-sm text-muted">{t("Reports.noReports")}</p>
                </DataTableEmpty>
              ) : (
                filteredReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.2) }}
                  >
                    <Card className="!p-4 sm:!p-5 transition-colors hover:bg-primary-muted/20">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className={`mb-2 flex flex-wrap items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                            <h3 className="text-h3 text-text">
                              <Link
                                href={`/reports/${report.id}`}
                                className="hover:text-primary"
                              >
                                {report.title || "-"}
                              </Link>
                            </h3>
                            {getReportTypeBadge(report.report_type)}
                            {report.status ? getStatusBadge(report.status) : null}
                          </div>
                          <p className="mb-3 text-body-sm text-text-secondary">
                            {report.description || "-"}
                          </p>
                          <div className={`mb-2 flex flex-wrap gap-x-4 gap-y-2 text-caption text-muted ${isRtl ? "flex-row-reverse" : ""}`}>
                            {report.student_name && (
                              <span className={`inline-flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                <User size={14} className="text-primary" />
                                <strong className="text-text-secondary">{t("Reports.student")}:</strong> {report.student_name}
                              </span>
                            )}
                            {report.supervisor_name && (
                              <span className={`inline-flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                <User size={14} className="text-primary" />
                                <strong className="text-text-secondary">المشرف:</strong> {report.supervisor_name}
                              </span>
                            )}
                            {report.university_name && (
                              <span className={`inline-flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                <User size={14} className="text-primary" />
                                <strong className="text-text-secondary">الجامعة:</strong> {report.university_name}
                              </span>
                            )}
                            {report.score !== null && report.score !== undefined && (
                              <span className={`inline-flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                <FileText size={14} className="text-primary" />
                                <strong className="text-text-secondary">النتيجة:</strong> {report.score}/100
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                              <Calendar size={14} className="text-primary" />
                              <strong className="text-text-secondary">{t("Reports.date")}:</strong> {formatDate(report.created_at)}
                            </span>
                          </div>
                          {report.file_url && (
                            <a
                              href={report.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-2 inline-flex items-center gap-2 text-caption font-medium text-primary hover:underline ${isRtl ? "flex-row-reverse" : ""}`}
                            >
                              <Download size={14} />
                              {t("Reports.download")}
                            </a>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewDetails(report.id)}
                          >
                            <Eye size={16} />
                            {t("Reports.viewDetails")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(report.id)}
                            className="text-danger hover:bg-danger/10"
                          >
                            <Trash2 size={16} />
                            {t("Reports.delete")}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Details Modal */}
          {showDetails && selectedReport && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl sm:p-6">
                <div className={`mb-6 flex items-center justify-between border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <h2 className="text-h3 text-text">
                    {t("Reports.detailsTitle")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 px-0"
                    onClick={handleCloseDetails}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </Button>
                </div>
                {loadingSelected ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" size={32} />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <FileText className="mt-1 shrink-0 text-primary" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-caption font-semibold text-muted">{t("Reports.titleLabel")}</p>
                          <p className="font-medium text-text">{selectedReport.title || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-caption font-semibold text-muted">{t("Reports.typeLabel")}</p>
                        <div>{getReportTypeBadge(selectedReport.report_type)}</div>
                      </div>
                      {selectedReport.student_name && (
                        <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <User className="mt-1 shrink-0 text-primary" size={18} />
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-caption font-semibold text-muted">{t("Reports.student")}</p>
                            <p className="font-medium text-text">{selectedReport.student_name}</p>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <Calendar className="mt-1 shrink-0 text-primary" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-caption font-semibold text-muted">{t("Reports.date")}</p>
                          <p className="font-medium text-text tabular-nums">{formatDate(selectedReport.created_at)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-caption font-semibold text-muted">{t("Reports.status")}</p>
                        {selectedReport.status ? (
                          getStatusBadge(selectedReport.status)
                        ) : (
                          <Badge variant={selectedReport.is_active ? "success" : "default"}>
                            {selectedReport.is_active ? t("Reports.active") : t("Reports.inactive")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedReport.description && (
                      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <FileText className="mt-1 shrink-0 text-primary" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="mb-2 text-caption font-semibold text-muted">{t("Reports.description")}</p>
                          <p className="rounded-md border border-border bg-background p-4 text-body-sm text-text">
                            {selectedReport.description}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedReport.file_url && (
                      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <Download className="mt-1 shrink-0 text-primary" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="mb-2 text-caption font-semibold text-muted">{t("Reports.fileUrl")}</p>
                          <a
                            href={selectedReport.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all font-medium text-primary hover:underline"
                          >
                            {selectedReport.file_url}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}
