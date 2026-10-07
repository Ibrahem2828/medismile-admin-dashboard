"use client";

import { useState, useEffect } from "react";
import { Search, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchCases } from "../../redux/features/clinicalCases/clinicalCasesSlice";
import RoleGuard from "@/components/RoleGuard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import {
  Button,
  Input,
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
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 " +
  "disabled:opacity-50";

export default function UniversityCasesPage() {
  return (
    <RoleGuard>
      <UniversityCasesContent />
    </RoleGuard>
  );
}

function UniversityCasesContent() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { cases, loading, error } = useSelector((state) => state.clinicalCases);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    needsSupervisor: false, // فلتر للحالات التي تحتاج مشرف
  });

  // جلب الحالات عند تحميل الصفحة أو تغيير الفلاتر
  // الـ backend يفترض أن يفلتر حسب الجامعة تلقائياً للدور university_admin
  useEffect(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    
    dispatch(fetchCases(params));
  }, [dispatch, filters.status, filters.priority]);

  // Filter cases locally by search term and needs supervisor
  const filteredCases = cases.filter((c) => {
    // فلترة الحالات التي تحتاج مشرف
    if (filters.needsSupervisor) {
      // إذا كان هناك supervisor_id أو supervisor object، لا نعرضه
      if (c.supervisor_id || (c.supervisor && c.supervisor !== null)) {
        return false;
      }
    }
    
    // فلترة البحث
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(searchTerm)) ||
      (c.patient_name && c.patient_name.toLowerCase().includes(searchTerm)) ||
      (c.student_name && c.student_name.toLowerCase().includes(searchTerm)) ||
      (c.supervisor_name && c.supervisor_name.toLowerCase().includes(searchTerm)) ||
      (c.description && c.description.toLowerCase().includes(searchTerm))
    );
  });

  // Helper function لتنسيق الحالة
  const getStatusBadge = (status) => {
    const statusMap = {
      new: { label: "جديدة", variant: "info" },
      accepted: { label: "مقبولة", variant: "success" },
      rejected: { label: "مرفوضة", variant: "danger" },
      needs_assignment_approval: { label: "تحتاج موافقة إسناد", variant: "warning" },
      assigned: { label: "مسندة", variant: "primary" },
      in_progress: { label: "قيد التنفيذ", variant: "info" },
      completed: { label: "مكتملة", variant: "success" },
      closed: { label: "مغلقة", variant: "default" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Helper function للأولوية
  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { label: "منخفضة", variant: "success" },
      medium: { label: "متوسطة", variant: "warning" },
      high: { label: "عالية", variant: "warning" },
      urgent: { label: "عاجلة", variant: "danger" },
    };
    const priorityInfo = priorityMap[priority] || { label: priority, variant: "default" };
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
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

  // تصدير الحالات إلى Excel
  const handleExportExcel = () => {
    if (filteredCases.length === 0) {
      toast.error("لا توجد حالات للتصدير");
      return;
    }

    try {
      // تحضير البيانات للتصدير
      const excelData = filteredCases.map((caseItem) => ({
        "العنوان": caseItem.title || "-",
        "الوصف": caseItem.description || "-",
        "الحالة": 
          caseItem.status === "new" ? "جديدة" :
          caseItem.status === "accepted" ? "مقبولة" :
          caseItem.status === "rejected" ? "مرفوضة" :
          caseItem.status === "needs_assignment_approval" ? "تحتاج موافقة إسناد" :
          caseItem.status === "assigned" ? "مسندة" :
          caseItem.status === "in_progress" ? "قيد التنفيذ" :
          caseItem.status === "completed" ? "مكتملة" :
          caseItem.status === "closed" ? "مغلقة" :
          caseItem.status || "-",
        "الأولوية": 
          caseItem.priority === "low" ? "منخفضة" :
          caseItem.priority === "medium" ? "متوسطة" :
          caseItem.priority === "high" ? "عالية" :
          caseItem.priority === "urgent" ? "عاجلة" :
          caseItem.priority || "-",
        "المريض": caseItem.patient_name || "-",
        "الطالب": caseItem.student_name || "-",
        "المشرف": caseItem.supervisor_name || "-",
        "تاريخ الإنشاء": caseItem.created_at ? formatDate(caseItem.created_at) : "-",
        "تاريخ التحديث": caseItem.updated_at ? formatDate(caseItem.updated_at) : "-",
      }));

      // إنشاء workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الحالات السريرية");

      // تحديد عرض الأعمدة
      const colWidths = [
        { wch: 30 }, // العنوان
        { wch: 40 }, // الوصف
        { wch: 20 }, // الحالة
        { wch: 15 }, // الأولوية
        { wch: 25 }, // المريض
        { wch: 25 }, // الطالب
        { wch: 25 }, // المشرف
        { wch: 20 }, // تاريخ الإنشاء
        { wch: 20 }, // تاريخ التحديث
      ];
      ws["!cols"] = colWidths;

      // تصدير الملف
      const fileName = `الحالات_السريرية_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`تم تصدير ${filteredCases.length} حالة بنجاح`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("فشل في تصدير الحالات إلى Excel");
    }
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6"></div>
    );

  const isRtl = i18n?.language === "ar";
  const emptyMessage =
    cases.length === 0 ? "لا توجد حالات" : "لا توجد حالات تطابق البحث";

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="text-h1 text-text">
                حالات الجامعة السريرية
              </h1>
              <p className="text-body-sm text-text-secondary">
                {filters.needsSupervisor 
                  ? `حالات تحتاج تعيين مشرف (${filteredCases.length})`
                  : `جميع حالات جامعتك (${filteredCases.length})`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filteredCases.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleExportExcel}
                  className="border-success/30 bg-success/15 text-success hover:bg-success/20"
                >
                  <FileSpreadsheet size={18} />
                  تصدير Excel
                </Button>
              )}
              <Button
                variant={filters.needsSupervisor ? "primary" : "outline"}
                onClick={() => setFilters({ ...filters, needsSupervisor: !filters.needsSupervisor })}
                className={
                  filters.needsSupervisor
                    ? "bg-warning hover:opacity-90 border-transparent text-primary-foreground"
                    : undefined
                }
              >
                {filters.needsSupervisor ? "عرض الكل" : "حالات تحتاج مشرف"}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card padding className="!p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
              {/* Search */}
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
                  placeholder="بحث..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className={isRtl ? "pr-10" : "pl-10"}
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className={selectClass}
                >
                  <option value="">جميع الحالات</option>
                  <option value="new">جديدة</option>
                  <option value="accepted">مقبولة</option>
                  <option value="rejected">مرفوضة</option>
                  <option value="needs_assignment_approval">تحتاج موافقة إسناد</option>
                  <option value="assigned">مسندة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className={selectClass}
                >
                  <option value="">جميع الأولويات</option>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>

              {/* Reset Filters */}
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({ status: "", priority: "", search: "", needsSupervisor: false })}
                >
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && cases.length === 0 && <DataTableLoading />}

          {/* Table — desktop/tablet */}
          {!loading && (
            <div className="hidden sm:block">
              {filteredCases && filteredCases.length > 0 ? (
                <DataTable dir={isRtl ? "rtl" : "ltr"} minWidth="700px">
                  <DataTableHead>
                    <tr>
                      <DataTableTh>العنوان</DataTableTh>
                      <DataTableTh>المريض</DataTableTh>
                      <DataTableTh>الطالب</DataTableTh>
                      <DataTableTh>المشرف</DataTableTh>
                      <DataTableTh>الحالة</DataTableTh>
                      <DataTableTh>الأولوية</DataTableTh>
                      <DataTableTh>التاريخ</DataTableTh>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredCases.map((c, idx) => (
                      <DataTableRow
                        as={motion.tr}
                        key={c.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.24) }}
                      >
                        <DataTableTd className="font-medium">
                          {(!c.supervisor_id && !c.supervisor) ? (
                            <a
                              href={`/university-cases/${c.id}`}
                              className="text-primary hover:underline"
                            >
                              {c.title || "-"}
                            </a>
                          ) : (
                            <span className="text-text">{c.title || "-"}</span>
                          )}
                        </DataTableTd>
                        <DataTableTd className="text-text-secondary">
                          {c.patient_name || "-"}
                        </DataTableTd>
                        <DataTableTd className="text-text-secondary">
                          {c.student_name || "-"}
                        </DataTableTd>
                        <DataTableTd className="text-text-secondary">
                          {c.supervisor_name || "-"}
                        </DataTableTd>
                        <DataTableTd>{getStatusBadge(c.status)}</DataTableTd>
                        <DataTableTd>{getPriorityBadge(c.priority)}</DataTableTd>
                        <DataTableTd className="text-text-secondary tabular-nums whitespace-nowrap">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </DataTableTd>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              ) : (
                <DataTableEmpty>{emptyMessage}</DataTableEmpty>
              )}
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && (
            <div className="grid gap-3 sm:hidden">
              {filteredCases && filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="!p-4">
                      <h3 className="mb-2 text-h3 text-text">
                        {(!c.supervisor_id && !c.supervisor) ? (
                          <a
                            href={`/university-cases/${c.id}`}
                            className="text-primary hover:underline"
                          >
                            {c.title || "-"}
                          </a>
                        ) : (
                          c.title || "-"
                        )}
                      </h3>
                      <div className="space-y-1 text-body-sm text-text-secondary">
                        <p>المريض: {c.patient_name || "-"}</p>
                        <p>الطالب: {c.student_name || "-"}</p>
                        <p>المشرف: {c.supervisor_name || "-"}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getStatusBadge(c.status)}
                        {getPriorityBadge(c.priority)}
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <DataTableEmpty>{emptyMessage}</DataTableEmpty>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}
