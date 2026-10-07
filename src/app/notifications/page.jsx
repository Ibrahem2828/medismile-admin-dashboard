"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  Bell,
  Loader2,
  Eye,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  fetchNotificationsAsync,
  fetchNotificationByIdAsync,
  updateNotificationAsync,
  createNotificationAsync,
  clearError,
  setFilters,
  clearFilters,
} from "../../redux/features/notifications/notificationsSlice";
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

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text " +
  "placeholder:text-muted focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

export default function NotificationsPage() {
  return (
    <RoleGuard>
      <NotificationsContent />
    </RoleGuard>
  );
}

function NotificationsContent() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const notificationsState = useSelector((state) => state.notifications);
  const notifications = notificationsState?.notifications || [];
  const selectedNotification = notificationsState?.selectedNotification;
  const loading = notificationsState?.loading || false;
  const loadingSelected = notificationsState?.loadingSelected || false;
  const error = notificationsState?.error || null;
  const pagination = notificationsState?.pagination || { count: 0, next: null, previous: null };
  const filters = notificationsState?.filters || {};

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showDetails, setShowDetails] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState({
    notification_type: "system_alert",
    priority: "normal",
    title: "",
    message: "",
    recipient_id: "",
    target_type: "",
    target_id: "",
    appointment_id: "",
    proposed_changes: "",
  });

  const isRtl = i18n?.language === "ar";

  // جلب الإشعارات عند تحميل الصفحة
  useEffect(() => {
    const params = {
      page: currentPage,
      page_size: pageSize,
    };
    
    if (filters.is_read !== null) {
      params.is_read = filters.is_read;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    
    dispatch(fetchNotificationsAsync(params));
    // استخدام القيم الفردية بدلاً من الكائن لتجنب الحلقة التكرارية
  }, [dispatch, currentPage, pageSize, filters.is_read, filters.status]);

  // عرض رسائل الخطأ
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // معالجة عرض التفاصيل
  const handleViewDetails = async (notificationId) => {
    try {
      await dispatch(fetchNotificationByIdAsync(notificationId)).unwrap();
      setShowDetails(notificationId);
    } catch (error) {
      toast.error(error || t("Notifications.fetchError") || "فشل في جلب تفاصيل الإشعار");
    }
  };

  // معالجة تحديث حالة القراءة
  const handleToggleRead = async (notificationId, isRead) => {
    try {
      await dispatch(updateNotificationAsync({
        id: notificationId,
        is_read: !isRead,
      })).unwrap();
      toast.success(t("Notifications.updateSuccess") || "تم تحديث الإشعار بنجاح");
      
      // إعادة جلب الإشعارات
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (filters.is_read !== null) params.is_read = filters.is_read;
      if (filters.status) params.status = filters.status;
      dispatch(fetchNotificationsAsync(params));
    } catch (error) {
      toast.error(error || t("Notifications.updateError") || "فشل في تحديث الإشعار");
    }
  };

  // معالجة إنشاء إشعار
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        notification_type: formData.notification_type,
        priority: formData.priority,
        title: formData.title,
        message: formData.message,
      };
      
      if (formData.recipient_id) {
        submitData.recipient_id = formData.recipient_id;
      }
      if (formData.target_type && formData.target_id) {
        submitData.target_type = formData.target_type;
        submitData.target_id = formData.target_id;
      }
      if (formData.appointment_id) {
        submitData.appointment_id = formData.appointment_id;
      }
      if (formData.proposed_changes) {
        try {
          submitData.proposed_changes = JSON.parse(formData.proposed_changes);
        } catch {
          // إذا لم يكن JSON صحيح، نرسله كـ string
          submitData.proposed_changes = formData.proposed_changes;
        }
      }
      
      await dispatch(createNotificationAsync(submitData)).unwrap();
      toast.success(t("Notifications.createSuccess") || "تم إنشاء الإشعار بنجاح");
      setShowForm(false);
      setFormData({
        notification_type: "system_alert",
        priority: "normal",
        title: "",
        message: "",
        recipient_id: "",
        target_type: "",
        target_id: "",
        appointment_id: "",
        proposed_changes: "",
      });
      
      // إعادة جلب الإشعارات
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (filters.is_read !== null) params.is_read = filters.is_read;
      if (filters.status) params.status = filters.status;
      dispatch(fetchNotificationsAsync(params));
    } catch (error) {
      toast.error(error || t("Notifications.createError") || "فشل في إنشاء الإشعار");
    }
  };

  // تنسيق التاريخ
  const formatDateTime = (dateString) => {
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

  // دالة للحصول على variant الأولوية
  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "normal":
        return "info";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  // دالة للحصول على أيقونة الأولوية
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle size={14} />;
      case "high":
        return <AlertCircle size={14} />;
      case "normal":
        return <Info size={14} />;
      case "low":
        return <Bell size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  // الأنواع المسموحة للإشعارات (للمسؤول الجامعة - إدارية/نظامية فقط)
  const adminNotificationTypes = [
    { value: "system_alert", label: "Notifications.types.system_alert" },
    { value: "backup_status", label: "Notifications.types.backup_status" },
    { value: "security_event", label: "Notifications.types.security_event" },
  ];

  // حساب عدد الصفحات
  const totalPages = Math.ceil(pagination.count / pageSize);

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4"></div>;
  }

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
                {t("Notifications.title")}
              </h1>
              <p className="text-body-sm text-text-secondary">
                {t("Notifications.description")}
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="shrink-0 self-start sm:self-auto"
            >
              <PlusCircle size={18} />
              {t("Notifications.createNotification")}
            </Button>
          </div>

          {/* Filters */}
          <Card padding className="!p-4 sm:!p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>
                  {t("Notifications.table.read")}
                </label>
                <select
                  value={filters.is_read === null ? "all" : filters.is_read ? "read" : "unread"}
                  onChange={(e) => {
                    const value = e.target.value === "all" ? null : e.target.value === "read";
                    dispatch(setFilters({ is_read: value }));
                    setCurrentPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="all">{t("actions.all")}</option>
                  <option value="read">{t("Notifications.read")}</option>
                  <option value="unread">{t("Notifications.unread")}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  {t("Notifications.table.status")}
                </label>
                <select
                  value={filters.status || "all"}
                  onChange={(e) => {
                    const value = e.target.value === "all" ? null : e.target.value;
                    dispatch(setFilters({ status: value }));
                    setCurrentPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="all">{t("actions.all")}</option>
                  <option value="pending">{t("Notifications.pending")}</option>
                  <option value="accepted">{t("Notifications.accepted")}</option>
                  <option value="rejected">{t("Notifications.rejected")}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {loading && notifications.length === 0 && <DataTableLoading />}

          {/* Notifications List */}
          {!loading && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <DataTableEmpty>
                  <Bell size={40} className="mx-auto mb-3 text-muted" />
                  <p className="text-body-sm text-muted">
                    {t("Notifications.noNotifications")}
                  </p>
                </DataTableEmpty>
              ) : (
                <>
                  {notifications.map((notification, idx) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.2) }}
                    >
                      <Card
                        className={`!p-4 sm:!p-5 transition-colors ${
                          notification.is_read
                            ? "border-border"
                            : "border-primary/50 bg-primary-muted/20"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className={`mb-2 flex items-start gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                              {!notification.is_read && (
                                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className={`mb-2 flex flex-wrap items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                                  <h3 className="text-h3 text-text">
                                    {notification.title || "-"}
                                  </h3>
                                  {notification.priority && (
                                    <Badge variant={getPriorityVariant(notification.priority)}>
                                      {getPriorityIcon(notification.priority)}
                                      {t(`Notifications.priority.${notification.priority}`) || notification.priority}
                                    </Badge>
                                  )}
                                  {notification.notification_type && (
                                    <Badge variant="default">
                                      {t(`Notifications.types.${notification.notification_type}`) || notification.notification_type}
                                    </Badge>
                                  )}
                                </div>
                                <p className="mb-2 text-body-sm text-text-secondary">
                                  {notification.message || "-"}
                                </p>
                                <div className={`flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted ${isRtl ? "flex-row-reverse" : ""}`}>
                                  <span>
                                    <strong className="text-text-secondary">{t("Notifications.table.date")}:</strong>{" "}
                                    {formatDateTime(notification.created_at)}
                                  </span>
                                  {notification.sender_name && (
                                    <span>
                                      <strong className="text-text-secondary">{t("Notifications.table.sender")}:</strong>{" "}
                                      {notification.sender_name}
                                    </span>
                                  )}
                                  {notification.target_type && notification.target_object_id && (
                                    <span>
                                      <strong className="text-text-secondary">
                                        {t(`Notifications.targetType.${notification.target_type}`) || notification.target_type}:
                                      </strong>{" "}
                                      <span className="text-primary">
                                        {notification.target_object_id.substring(0, 8)}...
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewDetails(notification.id)}
                            >
                              <Eye size={16} />
                              {t("Notifications.viewDetails")}
                            </Button>
                            <Button
                              size="sm"
                              variant={notification.is_read ? "outline" : "ghost"}
                              onClick={() => handleToggleRead(notification.id, notification.is_read)}
                              className={
                                !notification.is_read
                                  ? "bg-info/10 text-info hover:bg-info/15"
                                  : undefined
                              }
                            >
                              <CheckCircle size={16} />
                              {notification.is_read ? t("Notifications.markAsUnread") : t("Notifications.markAsRead")}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={!pagination.previous || currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                        {t("actions.previous") || "السابق"}
                      </Button>
                      <span className="px-3 py-2 text-body-sm text-text-secondary tabular-nums">
                        {t("actions.page") || "صفحة"} {currentPage} {t("actions.of") || "من"} {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={!pagination.next || currentPage === totalPages}
                      >
                        {t("actions.next") || "التالي"}
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Details Modal */}
          {showDetails && selectedNotification && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl sm:p-6">
                <div className={`mb-6 flex items-center justify-between border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <h2 className="text-h3 text-text">
                    {t("Notifications.viewDetails")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 px-0"
                    onClick={() => setShowDetails(null)}
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
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 text-caption font-semibold text-muted">
                        {t("Notifications.table.title")}
                      </p>
                      <p className="font-medium text-text">{selectedNotification.title || "-"}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-caption font-semibold text-muted">
                        {t("Notifications.table.message")}
                      </p>
                      <p className="text-body-sm text-text">{selectedNotification.message || "-"}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-caption font-semibold text-muted">
                        {t("Notifications.table.date")}
                      </p>
                      <p className="text-body-sm text-text tabular-nums">{formatDateTime(selectedNotification.created_at)}</p>
                    </div>
                    {selectedNotification.sender_name && (
                      <div>
                        <p className="mb-1 text-caption font-semibold text-muted">
                          {t("Notifications.table.sender")}
                        </p>
                        <p className="text-body-sm text-text">{selectedNotification.sender_name}</p>
                      </div>
                    )}
                    {selectedNotification.notification_type && (
                      <div>
                        <p className="mb-1 text-caption font-semibold text-muted">
                          {t("Notifications.table.type")}
                        </p>
                        <Badge variant="default">
                          {t(`Notifications.types.${selectedNotification.notification_type}`) || selectedNotification.notification_type}
                        </Badge>
                      </div>
                    )}
                    {selectedNotification.priority && (
                      <div>
                        <p className="mb-1 text-caption font-semibold text-muted">
                          {t("Notifications.priorityLabel")}
                        </p>
                        <Badge variant={getPriorityVariant(selectedNotification.priority)}>
                          {getPriorityIcon(selectedNotification.priority)}
                          {t(`Notifications.priority.${selectedNotification.priority}`) || selectedNotification.priority}
                        </Badge>
                      </div>
                    )}
                    {selectedNotification.target_type && selectedNotification.target_object_id && (
                      <div>
                        <p className="mb-1 text-caption font-semibold text-muted">
                          {t("Notifications.targetObject")}
                        </p>
                        <p className="text-body-sm text-text">
                          <strong>
                            {t(`Notifications.targetType.${selectedNotification.target_type}`) || selectedNotification.target_type}:
                          </strong>{" "}
                          {selectedNotification.target_object_id}
                        </p>
                      </div>
                    )}
                    {selectedNotification.appointment_id && (
                      <div>
                        <p className="mb-1 text-caption font-semibold text-muted">
                          {t("Notifications.table.appointment")}
                        </p>
                        <p className="text-body-sm text-text">{selectedNotification.appointment_id}</p>
                      </div>
                    )}
                    {selectedNotification.proposed_changes && (
                      <div>
                        <p className="mb-1 text-caption font-semibold text-muted">
                          {t("Notifications.form.proposedChanges")}
                        </p>
                        <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 text-caption text-text">
                          {typeof selectedNotification.proposed_changes === "object" 
                            ? JSON.stringify(selectedNotification.proposed_changes, null, 2)
                            : selectedNotification.proposed_changes}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Notification Modal */}
          {showForm && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl sm:p-6">
                <div className={`mb-6 flex items-center justify-between border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <h2 className="text-h3 text-text">
                    {t("Notifications.createTitle")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 px-0"
                    onClick={() => setShowForm(false)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      {t("Notifications.form.notificationType")} <span className="text-danger">*</span>
                    </label>
                    <select
                      value={formData.notification_type}
                      onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                      required
                      className={selectClass}
                    >
                      {adminNotificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {t(type.label)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("Notifications.priorityLabel")}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className={selectClass}
                    >
                      <option value="low">{t("Notifications.priority.low")}</option>
                      <option value="normal">{t("Notifications.priority.normal")}</option>
                      <option value="high">{t("Notifications.priority.high")}</option>
                      <option value="critical">{t("Notifications.priority.critical")}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("Notifications.form.title")} <span className="text-danger">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("Notifications.form.message")} <span className="text-danger">*</span>
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={4}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("Notifications.form.targetType")}
                    </label>
                    <select
                      value={formData.target_type}
                      onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">{t("actions.all")} - {t("Notifications.form.selectTargetType")}</option>
                      <option value="report">{t("Notifications.targetType.report")}</option>
                      <option value="case">{t("Notifications.targetType.case")}</option>
                      <option value="appointment">{t("Notifications.targetType.appointment")}</option>
                      <option value="evaluation">{t("Notifications.targetType.evaluation")}</option>
                      <option value="message">{t("Notifications.targetType.message")}</option>
                    </select>
                  </div>
                  {formData.target_type && (
                    <div>
                      <label className={labelClass}>
                        {t("Notifications.form.targetId")}
                      </label>
                      <Input
                        type="text"
                        value={formData.target_id}
                        onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                        placeholder={t("Notifications.form.targetIdPlaceholder")}
                      />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>
                      {t("Notifications.form.proposedChanges")}
                    </label>
                    <textarea
                      value={formData.proposed_changes}
                      onChange={(e) => setFormData({ ...formData, proposed_changes: e.target.value })}
                      placeholder={t("Notifications.form.proposedChangesPlaceholder")}
                      rows={3}
                      className={`${fieldClass} resize-none font-mono text-caption`}
                    />
                    <p className="mt-1 text-caption text-muted">
                      {t("Notifications.form.proposedChangesHint")}
                    </p>
                  </div>
                  <div className={`flex gap-3 border-t border-border pt-4 ${isRtl ? "flex-row-reverse justify-start" : "justify-end"}`}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      {t("actions.cancel")}
                    </Button>
                    <Button type="submit">
                      {t("actions.save")}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}
