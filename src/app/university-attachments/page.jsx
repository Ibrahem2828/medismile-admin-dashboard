"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Image, Video, File } from "lucide-react";
import { useRtl } from "@/hooks/useRtl";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchAttachmentsAsync, fetchAttachmentByIdAsync, clearSelectedAttachment } from "../../redux/features/attachments/attachmentsSlice";
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
import toast from "react-hot-toast";
import Link from "next/link";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

export default function UniversityAttachmentsPage() {
  return (
    <RoleGuard allowedRoles={["university_admin"]}>
      <UniversityAttachmentsContent />
    </RoleGuard>
  );
}

function UniversityAttachmentsContent() {
  const isRtl = useRtl();
  const dispatch = useDispatch();
  const { attachments, selectedAttachment, loading, loadingSelected, error } = useSelector((state) => state.attachments);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // State للفلترة والبحث
  const [searchTerm, setSearchTerm] = useState("");
  const [fileCategoryFilter, setFileCategoryFilter] = useState("all");
  const [attachmentTypeFilter, setAttachmentTypeFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [showDetails, setShowDetails] = useState(null);

  // جلب المرفقات عند تحميل الصفحة
  useEffect(() => {
    const params = {};
    if (fileCategoryFilter !== "all") {
      params.file_category = fileCategoryFilter;
    }
    if (attachmentTypeFilter !== "all") {
      params.attachment_type = attachmentTypeFilter;
    }
    dispatch(fetchAttachmentsAsync(params));
  }, [dispatch, fileCategoryFilter, attachmentTypeFilter]);

  // معالجة عرض التفاصيل
  const handleViewDetails = async (attachmentId) => {
    try {
      await dispatch(fetchAttachmentByIdAsync(attachmentId)).unwrap();
      setShowDetails(attachmentId);
    } catch (error) {
      toast.error(error || "فشل في جلب تفاصيل المرفق");
    }
  };

  // إغلاق تفاصيل المرفق
  const handleCloseDetails = () => {
    setShowDetails(null);
    dispatch(clearSelectedAttachment());
  };

  // Helper function للحصول على أيقونة نوع الملف
  const getFileIcon = (fileCategory, mimeType) => {
    if (fileCategory === "image" || mimeType?.startsWith("image/")) {
      return <Image className="h-4 w-4 text-primary" aria-hidden />;
    }
    if (fileCategory === "video" || mimeType?.startsWith("video/")) {
      return <Video className="h-4 w-4 text-info" aria-hidden />;
    }
    return <File className="h-4 w-4 text-muted" aria-hidden />;
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

  // فلترة المرفقات
  const filteredAttachments = attachments.filter((att) => {
    // فلترة البحث
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (att.original_filename || "").toLowerCase().includes(searchLower) ||
      (att.case_title || "").toLowerCase().includes(searchLower) ||
      (att.uploaded_by_name || "").toLowerCase().includes(searchLower);

    // فلترة التاريخ
    let matchesDate = true;
    if (att.created_at) {
      const attDate = new Date(att.created_at);
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        fromDate.setHours(0, 0, 0, 0);
        if (attDate < fromDate) matchesDate = false;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        if (attDate > toDate) matchesDate = false;
      }
    } else if (dateFromFilter || dateToFilter) {
      matchesDate = false;
    }

    return matchesSearch && matchesDate;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6"></div>
    );
  }

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen p-6 sm:p-8 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-[1400px] space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-h1 text-text">المرفقات</h1>
            <p className="text-body-sm text-text-secondary">
              {filteredAttachments.length} مرفق
            </p>
          </div>

          {/* Filters */}
          <Card padding className="!p-4 sm:!p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:items-end">
              {/* Search */}
              <div className="sm:col-span-2 xl:col-span-2">
                <label className={labelClass}>بحث</label>
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
                    placeholder="ابحث عن مرفق..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isRtl ? "pr-10" : "pl-10"}
                  />
                </div>
              </div>

              {/* File Category Filter */}
              <div>
                <label className={labelClass}>نوع الملف</label>
                <select
                  value={fileCategoryFilter}
                  onChange={(e) => setFileCategoryFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">الكل</option>
                  <option value="image">صورة</option>
                  <option value="document">وثيقة</option>
                  <option value="video">فيديو</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              {/* Attachment Type Filter */}
              <div>
                <label className={labelClass}>نوع المرفق</label>
                <select
                  value={attachmentTypeFilter}
                  onChange={(e) => setAttachmentTypeFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">الكل</option>
                  <option value="before_image">صورة قبل</option>
                  <option value="after_image">صورة بعد</option>
                  <option value="report">تقرير</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              {/* Date From Filter */}
              <div>
                <label className={labelClass}>من تاريخ</label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className={labelClass}>إلى تاريخ</label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>

              {/* Reset Filters */}
              <div className="sm:col-span-2 xl:col-span-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFileCategoryFilter("all");
                    setAttachmentTypeFilter("all");
                    setDateFromFilter("");
                    setDateToFilter("");
                  }}
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
          {loading && attachments.length === 0 && <DataTableLoading />}

          {/* Table */}
          {!loading && (
            <div className="hidden sm:block">
              {filteredAttachments && filteredAttachments.length > 0 ? (
                <DataTable dir={isRtl ? "rtl" : "ltr"} minWidth="1000px">
                  <DataTableHead>
                    <tr>
                      <DataTableTh>الملف</DataTableTh>
                      <DataTableTh>النوع</DataTableTh>
                      <DataTableTh>الحجم</DataTableTh>
                      <DataTableTh>الحالة المرتبطة</DataTableTh>
                      <DataTableTh>الطالب</DataTableTh>
                      <DataTableTh>التاريخ</DataTableTh>
                      <DataTableTh className={isRtl ? "text-right" : "text-left"}>
                        الإجراءات
                      </DataTableTh>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredAttachments.map((att, idx) => (
                      <DataTableRow
                        as={motion.tr}
                        key={att.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.24) }}
                      >
                        <DataTableTd className="font-medium">
                          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                            {getFileIcon(att.file_category, att.mime_type)}
                            <span className="text-text">{att.original_filename || "-"}</span>
                          </div>
                        </DataTableTd>
                        <DataTableTd>{getAttachmentTypeBadge(att.attachment_type)}</DataTableTd>
                        <DataTableTd className="text-text-secondary tabular-nums whitespace-nowrap">
                          {att.file_size_formatted || "-"}
                        </DataTableTd>
                        <DataTableTd>
                          {att.case_title ? (
                            <Link
                              href={`/university-cases/${att.case_id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {att.case_title}
                            </Link>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </DataTableTd>
                        <DataTableTd className="text-text-secondary">
                          {att.uploaded_by_name || "-"}
                        </DataTableTd>
                        <DataTableTd className="text-text-secondary tabular-nums whitespace-nowrap">
                          {att.created_at
                            ? new Date(att.created_at).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </DataTableTd>
                        <DataTableTd>
                          <div className={`flex items-center gap-1 ${isRtl ? "justify-start" : "justify-end"}`}>
                            <Link href={`/university-attachments/${att.id}`}>
                              <Button size="sm" variant="secondary">
                                <Eye size={16} />
                                عرض
                              </Button>
                            </Link>
                          </div>
                        </DataTableTd>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              ) : (
                <DataTableEmpty>لا توجد مرفقات</DataTableEmpty>
              )}
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && (
            <div className="grid gap-3 sm:hidden">
              {filteredAttachments && filteredAttachments.length > 0 ? (
                filteredAttachments.map((att) => (
                  <motion.div
                    key={att.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="!p-4">
                      <div className="mb-3 flex items-center gap-2">
                        {getFileIcon(att.file_category, att.mime_type)}
                        <h3 className="text-h3 text-text">
                          {att.original_filename || "-"}
                        </h3>
                      </div>
                      <div className="mb-4 space-y-2 text-body-sm text-text-secondary">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-text">النوع:</span>
                          {getAttachmentTypeBadge(att.attachment_type)}
                        </div>
                        <p>
                          <span className="font-medium text-text">الحجم:</span>{" "}
                          {att.file_size_formatted || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-text">الحالة:</span>{" "}
                          {att.case_title || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-text">الطالب:</span>{" "}
                          {att.uploaded_by_name || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-text">التاريخ:</span>{" "}
                          {att.created_at
                            ? new Date(att.created_at).toLocaleDateString("ar-SA")
                            : "-"}
                        </p>
                      </div>
                      <Link href={`/university-attachments/${att.id}`} className="block">
                        <Button className="w-full">
                          <Eye size={16} />
                          عرض التفاصيل
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <DataTableEmpty>لا توجد مرفقات</DataTableEmpty>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}
