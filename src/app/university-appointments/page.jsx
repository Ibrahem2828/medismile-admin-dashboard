"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, X, Calendar, Clock, User, FileText, MapPin, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchAppointmentsAsync, fetchAppointmentByIdAsync, clearSelectedAppointment } from "../../redux/features/appointments/appointmentsSlice";
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

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

function UniversityAppointmentsContent() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();
  const { appointments, selectedAppointment, loading, loadingSelected, error } = useSelector((state) => state.appointments);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // State للفلترة والبحث
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [participantFilter, setParticipantFilter] = useState("all");
  const [showDetails, setShowDetails] = useState(null);

  // جلب المواعيد عند تحميل الصفحة
  // الـ backend يفترض أن يفلتر حسب الجامعة تلقائياً للدور university_admin
  useEffect(() => {
    const params = {};
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    dispatch(fetchAppointmentsAsync(params));
  }, [dispatch, statusFilter]);

  // معالجة عرض التفاصيل
  const handleViewDetails = async (appointmentId) => {
    try {
      await dispatch(fetchAppointmentByIdAsync(appointmentId)).unwrap();
      setShowDetails(appointmentId);
    } catch (error) {
      toast.error(error || "فشل في جلب تفاصيل الموعد");
    }
  };

  // إغلاق تفاصيل الموعد
  const handleCloseDetails = () => {
    setShowDetails(null);
    dispatch(clearSelectedAppointment());
  };

  // Helper function لتنسيق حالة الموعد
  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: "مجدول", variant: "info" },
      rescheduled: { label: "أعيد جدولته", variant: "warning" },
      completed: { label: "مكتمل", variant: "success" },
      cancelled: { label: "ملغي", variant: "danger" },
      no_show: { label: "عدم الحضور", variant: "warning" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // فلترة المواعيد
  const filteredAppointments = appointments.filter((apt) => {
    // فلترة البحث
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (apt.patient_name || "").toLowerCase().includes(searchLower) ||
      (apt.student_name || "").toLowerCase().includes(searchLower) ||
      (apt.supervisor_name || "").toLowerCase().includes(searchLower) ||
      (apt.case_title || "").toLowerCase().includes(searchLower) ||
      (apt.notes || "").toLowerCase().includes(searchLower) ||
      (apt.title || "").toLowerCase().includes(searchLower);

    // فلترة الحالة
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

    // فلترة التاريخ
    const appointmentDate = apt.appointment_date || apt.start_datetime || apt.scheduled_at;
    let matchesDate = true;
    if (appointmentDate) {
      const aptDate = new Date(appointmentDate);
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        fromDate.setHours(0, 0, 0, 0);
        if (aptDate < fromDate) matchesDate = false;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        if (aptDate > toDate) matchesDate = false;
      }
    } else if (dateFromFilter || dateToFilter) {
      matchesDate = false; // إذا كان الموعد بدون تاريخ وكان هناك فلتر تاريخ
    }

    // فلترة المشارك
    let matchesParticipant = true;
    if (participantFilter !== "all") {
      if (participantFilter === "patient" && !apt.patient_name) matchesParticipant = false;
      if (participantFilter === "student" && !apt.student_name) matchesParticipant = false;
      if (participantFilter === "supervisor" && !apt.supervisor_name) matchesParticipant = false;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesParticipant;
  });

  if (!mounted)
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6"></div>
    );

  const emptyLabel = t("Appointments.noAppointments") || "لا توجد مواعيد";

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
            <h1 className="text-h1 text-text">
              {t("Appointments.title") || "مواعيد الجامعة"}
            </h1>
            <p className="text-body-sm text-text-secondary">
              {filteredAppointments.length} موعد
            </p>
          </div>

          {/* Filters */}
          <Card padding className="!p-4 sm:!p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:items-end">
              {/* Search */}
              <div className="sm:col-span-2 xl:col-span-2">
                <label className={labelClass}>
                  {t("actions.search") || "بحث"}
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
                    placeholder={t("Appointments.searchPlaceholder") || "ابحث عن موعد..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isRtl ? "pr-10" : "pl-10"}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className={labelClass}>
                  {t("Appointments.status") || "الحالة"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t("actions.all") || "الكل"}</option>
                  <option value="scheduled">{t("Appointments.statuses.scheduled") || "مجدول"}</option>
                  <option value="rescheduled">{t("Appointments.statuses.rescheduled") || "أعيد جدولته"}</option>
                  <option value="completed">{t("Appointments.statuses.completed") || "مكتمل"}</option>
                  <option value="cancelled">{t("Appointments.statuses.cancelled") || "ملغي"}</option>
                  <option value="no_show">{t("Appointments.statuses.no_show") || "عدم الحضور"}</option>
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

              {/* Participant Filter */}
              <div>
                <label className={labelClass}>المشارك</label>
                <select
                  value={participantFilter}
                  onChange={(e) => setParticipantFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">الكل</option>
                  <option value="patient">مريض</option>
                  <option value="student">طالب</option>
                  <option value="supervisor">مشرف</option>
                </select>
              </div>

              {/* Reset Filters */}
              <div className="sm:col-span-2 xl:col-span-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFromFilter("");
                    setDateToFilter("");
                    setParticipantFilter("all");
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
          {loading && appointments.length === 0 && <DataTableLoading />}

          {/* Table */}
          {!loading && (
            <div className="hidden sm:block">
              {filteredAppointments && filteredAppointments.length > 0 ? (
                <DataTable dir={isRtl ? "rtl" : "ltr"} minWidth="1000px">
                  <DataTableHead>
                    <tr>
                      <DataTableTh>{t("Appointments.patient") || "المريض"}</DataTableTh>
                      <DataTableTh>{t("Appointments.student") || "الطالب"}</DataTableTh>
                      <DataTableTh>{t("Appointments.supervisor") || "المشرف"}</DataTableTh>
                      <DataTableTh>{t("Appointments.case") || "الحالة المرتبطة"}</DataTableTh>
                      <DataTableTh>{t("Appointments.date") || "التاريخ والوقت"}</DataTableTh>
                      <DataTableTh>{t("Appointments.location") || "الموقع"}</DataTableTh>
                      <DataTableTh>{t("Appointments.status") || "الحالة"}</DataTableTh>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredAppointments.map((apt, idx) => {
                      const patientEmail = apt.patient?.email || null;
                      const studentEmail = apt.student?.email || null;
                      const supervisorEmail = apt.supervisor?.email || null;
                      const dateValue = apt.appointment_date || apt.start_datetime || apt.scheduled_at;

                      return (
                        <DataTableRow
                          as={motion.tr}
                          key={apt.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.24) }}
                          className="cursor-pointer"
                          onClick={() => handleViewDetails(apt.id)}
                        >
                          <DataTableTd>
                            <div className="font-medium text-text">{apt.patient_name || "-"}</div>
                            {patientEmail && (
                              <div className="mt-0.5 text-caption text-muted">{patientEmail}</div>
                            )}
                          </DataTableTd>
                          <DataTableTd>
                            <div className="font-medium text-text">{apt.student_name || "-"}</div>
                            {studentEmail && (
                              <div className="mt-0.5 text-caption text-muted">{studentEmail}</div>
                            )}
                          </DataTableTd>
                          <DataTableTd>
                            <div className="font-medium text-text">{apt.supervisor_name || "-"}</div>
                            {supervisorEmail && (
                              <div className="mt-0.5 text-caption text-muted">{supervisorEmail}</div>
                            )}
                          </DataTableTd>
                          <DataTableTd className="text-text-secondary">
                            {apt.case_title || "-"}
                          </DataTableTd>
                          <DataTableTd className="text-text-secondary tabular-nums whitespace-nowrap">
                            {dateValue
                              ? new Date(dateValue).toLocaleString("ar-SA", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </DataTableTd>
                          <DataTableTd className="text-text-secondary">
                            {apt.location || "-"}
                          </DataTableTd>
                          <DataTableTd>{getStatusBadge(apt.status)}</DataTableTd>
                        </DataTableRow>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              ) : (
                <DataTableEmpty>{emptyLabel}</DataTableEmpty>
              )}
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && (
            <div className="grid gap-3 sm:hidden">
              {filteredAppointments && filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className="!p-4 cursor-pointer transition-colors hover:bg-primary-muted/30"
                      onClick={() => handleViewDetails(apt.id)}
                    >
                      <h3 className="mb-3 text-h3 text-text">
                        موعد - {apt.patient_name || "-"}
                      </h3>
                      <div className="mb-3 space-y-1.5 text-body-sm text-text-secondary">
                        <p>
                          <span className="font-medium text-text">الطالب:</span> {apt.student_name || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-text">المشرف:</span> {apt.supervisor_name || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-text">الحالة:</span> {apt.case_title || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-text">التاريخ:</span>{" "}
                          {apt.appointment_date || apt.start_datetime
                            ? new Date(apt.appointment_date || apt.start_datetime).toLocaleDateString("ar-SA")
                            : "-"}
                        </p>
                      </div>
                      <div className="mb-2">{getStatusBadge(apt.status)}</div>
                      {apt.location && (
                        <p className="text-caption text-muted">
                          <span className="font-medium">الموقع:</span> {apt.location}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))
              ) : (
                <DataTableEmpty>{emptyLabel}</DataTableEmpty>
              )}
            </div>
          )}

          {/* Details Modal */}
          {showDetails && selectedAppointment && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl sm:p-6">
                <div className={`mb-6 flex items-center justify-between border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <h2 className="text-h3 text-text">
                    {t("Appointments.viewDetails") || "تفاصيل الموعد"}
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
                      <DetailItem
                        icon={User}
                        label={t("Appointments.patient") || "المريض"}
                        value={selectedAppointment.patient_name || "-"}
                        isRtl={isRtl}
                      />
                      <DetailItem
                        icon={User}
                        label={t("Appointments.student") || "الطالب"}
                        value={selectedAppointment.student_name || "-"}
                        isRtl={isRtl}
                      />
                      <DetailItem
                        icon={FileText}
                        label={t("Appointments.case") || "الحالة"}
                        value={selectedAppointment.case_title || "-"}
                        isRtl={isRtl}
                      />
                      <DetailItem
                        icon={Calendar}
                        label={t("Appointments.date") || "التاريخ"}
                        value={
                          selectedAppointment.appointment_date || selectedAppointment.start_datetime
                            ? new Date(
                                selectedAppointment.appointment_date ||
                                  selectedAppointment.start_datetime
                              ).toLocaleString("ar-SA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"
                        }
                        isRtl={isRtl}
                      />
                      {selectedAppointment.duration_minutes && (
                        <DetailItem
                          icon={Clock}
                          label={t("Appointments.duration") || "المدة"}
                          value={`${selectedAppointment.duration_minutes} ${t("Appointments.minutes") || "دقيقة"}`}
                          isRtl={isRtl}
                        />
                      )}
                      <div>
                        <p className="mb-2 text-caption font-semibold text-muted">
                          {t("Appointments.status") || "الحالة"}
                        </p>
                        <div>{getStatusBadge(selectedAppointment.status)}</div>
                      </div>
                      {selectedAppointment.location && (
                        <DetailItem
                          icon={MapPin}
                          label={t("Appointments.location") || "الموقع"}
                          value={selectedAppointment.location}
                          isRtl={isRtl}
                        />
                      )}
                    </div>
                    {selectedAppointment.notes && (
                      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <MessageSquare className="mt-1 shrink-0 text-primary" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="mb-2 text-caption font-semibold text-muted">
                            {t("Appointments.notes") || "ملاحظات"}
                          </p>
                          <p className="rounded-md border border-border bg-background p-4 text-body-sm text-text">
                            {selectedAppointment.notes}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedAppointment.description && (
                      <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <MessageSquare className="mt-1 shrink-0 text-primary" size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="mb-2 text-caption font-semibold text-muted">
                            {t("Appointments.description") || "الوصف"}
                          </p>
                          <p className="rounded-md border border-border bg-background p-4 text-body-sm text-text">
                            {selectedAppointment.description}
                          </p>
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

function DetailItem({ icon: Icon, label, value, isRtl }) {
  return (
    <div className={`flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
      <Icon className="mt-1 shrink-0 text-primary" size={18} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-caption font-semibold text-muted">{label}</p>
        <p className="font-medium text-text">{value}</p>
      </div>
    </div>
  );
}

export default function UniversityAppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["university_admin"]}>
      <UniversityAppointmentsContent />
    </RoleGuard>
  );
}
