"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { useDispatch, useSelector } from "react-redux";
import {
  Mail,
  Phone,
  MessageCircle,
  Send,
  HelpCircle,
  FileText,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import {
  Button,
  Input,
  Badge,
  Card,
  CardTitle,
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui";
import { motion } from "framer-motion";
import { createTicketAsync, fetchTicketsAsync, clearError } from "@/redux/features/support/supportSlice";
import toast from "react-hot-toast";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text " +
  "placeholder:text-muted focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

export default function SupportPage() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();
  const { loading, error: supportError, tickets } = useSelector((state) => state.support);
  
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical",
    priority: "medium",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
  }, []);

  useEffect(() => {
    if (supportError) {
      setError(supportError);
      dispatch(clearError());
    }
  }, [supportError, dispatch]);

  // جلب التذاكر عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchTicketsAsync());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // التحقق من الحقول المطلوبة
    if (!formData.subject || !formData.description) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const result = await dispatch(
        createTicketAsync({
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          ...(formData.category && { category: formData.category }), // اختياري
        })
      ).unwrap();

      if (result) {
        toast.success("تم إرسال طلبك بنجاح! سنتواصل معك قريباً.");
        setSubmitted(true);
        setFormData({
          subject: "",
          category: "technical",
          priority: "medium",
          description: "",
        });
        
        // إعادة جلب التذاكر بعد إنشاء تذكرة جديدة
        dispatch(fetchTicketsAsync());
        
        // إخفاء رسالة النجاح بعد 5 ثوان
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (err) {
      const errorMessage = err || "فشل إرسال الطلب";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const supportChannels = [
    {
      icon: MessageCircle,
      title: t("support.whatsapp") || "واتساب",
      description: t("support.whatsappDesc") || "تواصل معنا مباشرة عبر واتساب",
      contact: "+966 50 123 4567",
      link: "https://wa.me/966501234567",
      tone: "success",
    },
    {
      icon: Mail,
      title: t("support.email") || "البريد الإلكتروني",
      description: t("support.emailDesc") || "أرسل بريد إلكتروني إلى فريق الدعم",
      contact: "support@medismile.com",
      link: "mailto:support@medismile.com",
      tone: "primary",
    },
    {
      icon: Phone,
      title: t("support.phone") || "الهاتف",
      description: t("support.phoneDesc") || "اتصل بنا مباشرة",
      contact: "+966 11 123 4567",
      link: "tel:+966111234567",
      tone: "info",
    },
  ];

  const channelToneClass = {
    success: "border-success/30 bg-success text-primary-foreground hover:opacity-90",
    primary: "border-primary/30 bg-primary text-primary-foreground hover:bg-primary-hover",
    info: "border-info/30 bg-info text-primary-foreground hover:opacity-90",
  };

  const categories = [
    { value: "technical", label: t("support.categories.technical") || "مشكلة تقنية" },
    { value: "account", label: t("support.categories.account") || "مشكلة في الحساب" },
    { value: "feature", label: t("support.categories.feature") || "طلب ميزة جديدة" },
    { value: "bug", label: t("support.categories.bug") || "بلاغ عن خطأ" },
    { value: "other", label: t("support.categories.other") || "أخرى" },
  ];

  const priorities = [
    { value: "low", label: t("support.priorities.low") || "منخفضة", variant: "success" },
    { value: "medium", label: t("support.priorities.medium") || "متوسطة", variant: "warning" },
    { value: "high", label: t("support.priorities.high") || "عالية", variant: "warning" },
    { value: "urgent", label: t("support.priorities.urgent") || "عاجلة", variant: "danger" },
  ];

  const getPriorityVariant = (priority) => {
    if (priority === "urgent") return "danger";
    if (priority === "high") return "warning";
    if (priority === "medium") return "warning";
    return "success";
  };

  const getStatusLabel = (status) => {
    if (status === "open") return "مفتوح";
    if (status === "in_progress") return "قيد المعالجة";
    if (status === "resolved") return "محلول";
    if (status === "closed") return "مغلق";
    return status || "غير محدد";
  };

  const getStatusVariant = (status) => {
    if (status === "resolved") return "success";
    if (status === "closed") return "default";
    if (status === "in_progress") return "info";
    return "primary";
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-body-sm text-muted">{t("loading") || "جاري التحميل..."}</div>
      </div>
    );
  }

  return (
    <AnimatedWrapper>
      <div className={`min-h-screen p-6 sm:p-8 ${isRtl ? "text-right" : "text-left"}`}>
        <div className="mx-auto max-w-6xl space-y-6">
          {/* العنوان الرئيسي */}
          <div className="space-y-1 text-center">
            <h1 className="text-h1 text-text">
              {t("support.title") || "الدعم التقني"}
            </h1>
            <p className="text-body-sm text-text-secondary">
              {t("support.subtitle") || "نحن هنا لمساعدتك في أي وقت"}
            </p>
          </div>

          {/* قنوات التواصل */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <motion.a
                  key={index}
                  href={channel.link}
                  target={channel.link.startsWith("http") ? "_blank" : undefined}
                  rel={channel.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`rounded-lg border p-5 shadow-sm transition-opacity ${channelToneClass[channel.tone]}`}
                >
                  <div className={`mb-3 flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <Icon size={22} aria-hidden />
                    <h3 className="text-h3">{channel.title}</h3>
                  </div>
                  <p className="mb-3 text-body-sm opacity-90">{channel.description}</p>
                  <p className="text-body-sm font-semibold">{channel.contact}</p>
                </motion.a>
              );
            })}
          </div>

          {/* نموذج طلب الدعم */}
          <Card>
            <div className={`mb-5 flex items-center gap-3 border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="rounded-md bg-primary-muted p-2 text-primary">
                <HelpCircle size={20} aria-hidden />
              </div>
              <CardTitle className="m-0">
                {t("support.formTitle") || "إرسال طلب دعم"}
              </CardTitle>
            </div>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-5 flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                <CheckCircle className="shrink-0 text-success" size={18} />
                <p className="text-body-sm font-medium text-success">
                  {t("support.successMessage") || "تم إرسال طلبك بنجاح! سنتواصل معك قريباً."}
                </p>
              </motion.div>
            )}

            {(error || supportError) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3"
              >
                <p className="text-body-sm font-medium text-danger">
                  {error || supportError}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    {t("support.form.subject") || "الموضوع"} *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t("support.form.subjectPlaceholder") || "أدخل موضوع الطلب"}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("support.form.category") || "الفئة"} *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={selectClass}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`${labelClass} mb-2.5`}>
                  {t("support.form.priority") || "الأولوية"} *
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {priorities.map((priority) => {
                    const active = formData.priority === priority.value;
                    return (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: priority.value })}
                        className={`rounded-md border px-3 py-2.5 text-caption font-semibold transition-colors ${
                          active
                            ? "border-primary bg-primary-muted text-primary"
                            : "border-border bg-surface text-text-secondary hover:border-primary/40 hover:bg-primary-muted/40"
                        }`}
                      >
                        {priority.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  {t("support.form.description") || "الوصف"} *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("support.form.descriptionPlaceholder") || "اكتب تفاصيل طلبك هنا..."}
                  rows={6}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {user && (
                <div className="rounded-md border border-border bg-background px-4 py-3">
                  <p className="text-body-sm text-text-secondary">
                    <strong className="font-semibold text-text">
                      {t("support.form.userInfo") || "معلومات المستخدم:"}
                    </strong>{" "}
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email}
                    {" - "}
                    {user.email}
                  </p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <Button type="submit" loading={loading}>
                  {!loading ? <Send size={18} /> : null}
                  {loading
                    ? t("support.form.sending") || "جاري الإرسال..."
                    : t("support.form.submit") || "إرسال الطلب"}
                </Button>
              </div>
            </form>
          </Card>

          {/* قائمة طلبات الدعم */}
          <Card>
            <div className={`mb-5 flex items-center justify-between gap-3 border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className="rounded-md bg-primary-muted p-2 text-primary">
                  <FileText size={20} aria-hidden />
                </div>
                <CardTitle className="m-0">
                  {t("support.tickets.title") || "طلبات الدعم"}
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => dispatch(fetchTicketsAsync())}
              >
                <RefreshCw size={16} />
                {t("support.tickets.refresh") || "تحديث"}
              </Button>
            </div>

            {loading && (!tickets || tickets.length === 0) ? (
              <DataTableLoading />
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.2) }}
                    className="rounded-md border border-border bg-background p-4 transition-colors hover:bg-primary-muted/30"
                  >
                    <div className={`mb-2 flex items-start justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <h3 className="flex-1 font-medium text-text">
                        {ticket.subject || "بدون موضوع"}
                      </h3>
                      <Badge variant={getPriorityVariant(ticket.priority)}>
                        {ticket.priority === "urgent"
                          ? "عاجل"
                          : ticket.priority === "high"
                          ? "عالية"
                          : ticket.priority === "medium"
                          ? "متوسطة"
                          : "منخفضة"}
                      </Badge>
                    </div>
                    <p className="mb-3 line-clamp-2 text-body-sm text-text-secondary">
                      {ticket.description || ticket.body || "لا يوجد وصف"}
                    </p>
                    <div className={`flex flex-wrap items-center gap-2 text-caption text-muted ${isRtl ? "flex-row-reverse" : ""}`}>
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                      {ticket.created_at && (
                        <span className="tabular-nums">
                          {new Date(ticket.created_at).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                      {ticket.category && (
                        <Badge variant="primary">{ticket.category}</Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <DataTableEmpty>
                <FileText className="mx-auto mb-3 text-muted" size={40} />
                <p className="text-body-sm text-muted">
                  {t("support.tickets.noTickets") || "لا توجد طلبات دعم"}
                </p>
              </DataTableEmpty>
            )}
          </Card>

          {/* الأسئلة الشائعة */}
          <Card>
            <div className={`mb-5 flex items-center gap-3 border-b border-border pb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="rounded-md bg-primary-muted p-2 text-primary">
                <FileText size={20} aria-hidden />
              </div>
              <CardTitle className="m-0">
                {t("support.faq.title") || "الأسئلة الشائعة"}
              </CardTitle>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: t("support.faq.q1") || "كيف يمكنني استعادة كلمة المرور؟",
                  a: t("support.faq.a1") || "يمكنك النقر على 'نسيت كلمة المرور' في صفحة تسجيل الدخول، أو التواصل مع الدعم التقني.",
                },
                {
                  q: t("support.faq.q2") || "كيف أضيف موعد جديد؟",
                  a: t("support.faq.a2") || "انتقل إلى صفحة المواعيد واضغط على 'إضافة موعد جديد' واملأ البيانات المطلوبة.",
                },
                {
                  q: t("support.faq.q3") || "كيف يمكنني تحديث بياناتي الشخصية؟",
                  a: t("support.faq.a3") || "انتقل إلى صفحة الملف الشخصي واضغط على 'تعديل' لتحديث معلوماتك.",
                },
                {
                  q: t("support.faq.q4") || "ما هي ساعات عمل الدعم؟",
                  a: t("support.faq.a4") || "نعمل على مدار الساعة طوال أيام الأسبوع. يمكنك التواصل معنا في أي وقت.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <h3 className="mb-1.5 font-medium text-text">{faq.q}</h3>
                  <p className="text-body-sm text-text-secondary">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* معلومات إضافية */}
          <Card className="border-border bg-primary-muted/25 text-center">
            <p className="mb-1 text-body-sm text-text-secondary">
              {t("support.helpText") || "هل تحتاج مساعدة إضافية؟"}
            </p>
            <p className="text-body-sm font-semibold text-text">
              {t("support.contactText") || "لا تتردد في التواصل معنا - نحن هنا لمساعدتك!"}
            </p>
          </Card>
        </div>
      </div>
    </AnimatedWrapper>
  );
}
