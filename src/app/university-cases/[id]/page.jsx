"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, User, FileText, Clock, AlertCircle, UserPlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { useDispatch } from "react-redux";
import RoleGuard from "@/components/RoleGuard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import { Button, Badge, Card, CardTitle } from "@/components/ui";
import { fetchCaseById, fetchCaseHistory, fetchCaseSessions } from "@/services/casesApi";
import { fetchSupervisors } from "@/services/supervisorsApi";
import { 
  assignSupervisorToCaseAsync,
} from "@/redux/features/clinicalCases/clinicalCasesSlice";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * صفحة تفاصيل الحالة السريرية
 * قراءة فقط لمسؤول الجامعة
 */
export default function CaseDetailsPage() {
  return (
    <RoleGuard>
      <CaseDetailsContent />
    </RoleGuard>
  );
}

function CaseDetailsContent() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const router = useRouter();
  const params = useParams();
  const caseId = params.id;
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [assigningSupervisor, setAssigningSupervisor] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [caseHistory, setCaseHistory] = useState([]);
  const [caseSessions, setCaseSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (caseId) {
      loadCaseDetails();
      loadSupervisors();
      loadCaseHistory();
      loadCaseSessions();
    }
  }, [caseId]);

  const loadCaseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCaseById(caseId);
      
      // معالجة الاستجابة حسب التوثيق
      // الصيغة المتوقعة: {status: "success", data: {...}}
      if (response?.data) {
        setCaseData(response.data);
      } else if (response?.id) {
        // إذا كانت الاستجابة مباشرة كـ Case object
        setCaseData(response);
      } else {
        setCaseData(response);
      }
    } catch (err) {
      console.error("Error loading case details:", err);
      const errorMessage = 
        err?.response?.data?.message || 
        err?.response?.data?.detail ||
        err?.message ||
        "فشل في جلب تفاصيل الحالة";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSupervisors = async () => {
    try {
      setLoadingSupervisors(true);
      const data = await fetchSupervisors();
      setSupervisors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading supervisors:", err);
      toast.error("فشل في جلب قائمة المشرفين");
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const loadCaseHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await fetchCaseHistory(caseId);
      setCaseHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error("Error loading case history:", err);
      setCaseHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadCaseSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessions = await fetchCaseSessions(caseId);
      setCaseSessions(Array.isArray(sessions) ? sessions : []);
    } catch (err) {
      console.error("Error loading case sessions:", err);
      setCaseSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisorId) {
      toast.error("يرجى اختيار مشرف");
      return;
    }

    try {
      setAssigningSupervisor(true);
      const result = await dispatch(
        assignSupervisorToCaseAsync({ caseId, supervisorId: selectedSupervisorId })
      ).unwrap();
      
      // تحديث بيانات الحالة
      if (result.case) {
        setCaseData(result.case);
      } else {
        // إعادة تحميل التفاصيل
        await loadCaseDetails();
      }
      
      setShowAssignModal(false);
      setSelectedSupervisorId("");
      toast.success("تم تعيين المشرف بنجاح");
      // إعادة تحميل التاريخ
      await loadCaseHistory();
    } catch (err) {
      console.error("Error assigning supervisor:", err);
      const errorMessage = 
        err || 
        "فشل في تعيين المشرف";
      toast.error(errorMessage);
    } finally {
      setAssigningSupervisor(false);
    }
  };


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

  const getUserName = (user) => {
    if (!user) return "-";
    if (typeof user === "string") return user;
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.username) return user.username;
    if (user.email) return user.email;
    return "-";
  };

  if (loading) {
    return (
      <AnimatedWrapper>
        <div className={`p-6 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" size={32} />
          </div>
        </div>
      </AnimatedWrapper>
    );
  }

  if (error) {
    return (
      <AnimatedWrapper>
        <div className={`space-y-4 p-6 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button onClick={() => router.back()}>العودة</Button>
        </div>
      </AnimatedWrapper>
    );
  }

  if (!caseData) {
    return (
      <AnimatedWrapper>
        <div className={`space-y-4 p-6 ${isRtl ? "text-right" : "text-left"}`}>
          <p className="text-body-sm text-muted">الحالة غير موجودة</p>
          <Button onClick={() => router.back()}>العودة</Button>
        </div>
      </AnimatedWrapper>
    );
  }

  const selectClass =
    "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
    "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

  return (
    <AnimatedWrapper>
      <div className={`space-y-6 p-6 ${isRtl ? "text-right" : "text-left"}`}>
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className={`px-0 text-primary hover:bg-transparent hover:text-primary-hover ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <ArrowLeft size={18} />
          العودة
        </Button>

        {/* Header */}
        <Card>
          <h1 className="mb-3 text-h1 text-text">
            {caseData.title || "بدون عنوان"}
          </h1>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(caseData.status)}
            {getPriorityBadge(caseData.priority)}
            {caseData.is_public && <Badge variant="info">عامة</Badge>}
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Left Column - Main Info */}
          <div className="space-y-5 lg:col-span-2 lg:space-y-6">
            {/* Description */}
            <Card>
              <CardTitle className="mb-4 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                الوصف
              </CardTitle>
              <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
                {caseData.description || "لا يوجد وصف"}
              </p>
            </Card>

            {/* History */}
            {(caseHistory.length > 0 || (caseData.history && caseData.history.length > 0)) && (
              <Card>
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  سجل الحالة
                  {loadingHistory && (
                    <Loader2 className="ms-1 h-4 w-4 animate-spin text-primary" size={16} />
                  )}
                </CardTitle>
                <div className="space-y-3">
                  {(caseHistory.length > 0 ? caseHistory : (caseData.history || [])).map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className={`border-primary py-2 ${isRtl ? "border-r-4 pr-4" : "border-l-4 pl-4"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-text">
                          {entry.description || entry.action || "إجراء"}
                        </p>
                        <span className="shrink-0 text-caption text-muted tabular-nums">
                          {entry.created_at
                            ? new Date(entry.created_at).toLocaleDateString("ar-SA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>
                      {entry.performed_by && (
                        <p className="mt-1 text-caption text-text-secondary">
                          بواسطة: {getUserName(entry.performed_by)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-5 lg:space-y-6">
            {/* Patient Info */}
            <Card>
              <CardTitle className="mb-4 flex items-center gap-2">
                <User size={18} className="text-primary" />
                معلومات المريض
              </CardTitle>
              <div className="space-y-2 text-body-sm text-text-secondary">
                <p>
                  <span className="font-medium text-text">الاسم:</span> {getUserName(caseData.patient)}
                </p>
                {caseData.patient?.email && (
                  <p>
                    <span className="font-medium text-text">البريد:</span> {caseData.patient.email}
                  </p>
                )}
              </div>
            </Card>

            {/* Student Info */}
            {caseData.student && (
              <Card>
                <CardTitle className="mb-4">الطالب المسند</CardTitle>
                <div className="space-y-2 text-body-sm text-text-secondary">
                  <p>
                    <span className="font-medium text-text">الاسم:</span> {getUserName(caseData.student)}
                  </p>
                  {caseData.student?.email && (
                    <p>
                      <span className="font-medium text-text">البريد:</span> {caseData.student.email}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Supervisor Info */}
            <Card>
              <div className="mb-4 flex items-center justify-between gap-3">
                <CardTitle className="m-0">المشرف</CardTitle>
                {!caseData.supervisor && (
                  <Button
                    size="sm"
                    onClick={() => setShowAssignModal(true)}
                    disabled={assigningSupervisor || loadingSupervisors}
                  >
                    <UserPlus size={16} />
                    تعيين مشرف
                  </Button>
                )}
              </div>
              {caseData.supervisor ? (
                <div className="space-y-2 text-body-sm text-text-secondary">
                  <p>
                    <span className="font-medium text-text">الاسم:</span> {getUserName(caseData.supervisor)}
                  </p>
                  {caseData.supervisor?.email && (
                    <p>
                      <span className="font-medium text-text">البريد:</span> {caseData.supervisor.email}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-body-sm text-muted">
                  لم يتم تعيين مشرف بعد
                </p>
              )}
            </Card>

            {/* Dates */}
            <Card>
              <CardTitle className="mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                التواريخ
              </CardTitle>
              <div className="space-y-3 text-body-sm text-text-secondary">
                {caseData.created_at && (
                  <p>
                    <span className="font-medium text-text">تاريخ الإنشاء:</span>
                    <br />
                    <span className="tabular-nums">
                      {new Date(caseData.created_at).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                )}
                {caseData.updated_at && (
                  <p>
                    <span className="font-medium text-text">آخر تحديث:</span>
                    <br />
                    <span className="tabular-nums">
                      {new Date(caseData.updated_at).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                )}
              </div>
            </Card>

            {/* Assignment Requests */}
            {caseData.assignment_requests && caseData.assignment_requests.length > 0 && (
              <Card>
                <CardTitle className="mb-4">
                  طلبات الإسناد ({caseData.assignment_requests.length})
                </CardTitle>
                <div className="space-y-3">
                  {caseData.assignment_requests.map((request, idx) => (
                    <div
                      key={request.id || idx}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-body-sm font-medium text-text">
                          {getUserName(request.student)}
                        </span>
                        <Badge
                          variant={
                            request.status === "accepted"
                              ? "success"
                              : request.status === "rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {request.status === "accepted"
                            ? "مقبول"
                            : request.status === "rejected"
                              ? "مرفوض"
                              : "في الانتظار"}
                        </Badge>
                      </div>
                      {request.message && (
                        <p className="mt-1 text-caption text-text-secondary">
                          {request.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Modal تعيين المشرف */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-h3 text-text">تعيين مشرف للحالة</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 px-0"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedSupervisorId("");
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-label text-text">
                  اختر المشرف
                </label>
                {loadingSupervisors ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" size={24} />
                  </div>
                ) : supervisors.length === 0 ? (
                  <p className="text-body-sm text-muted">
                    لا توجد مشرفين متاحين
                  </p>
                ) : (
                  <select
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">-- اختر مشرف --</option>
                    {supervisors.map((supervisor) => {
                      // بناء نص العرض من الحقول المتاحة
                      let displayText = "";
                      
                      // الإيميل (دائماً موجود)
                      if (supervisor.email) {
                        displayText = supervisor.email;
                      }
                      
                      // إضافة اسم الجامعة إذا كان مختلفاً
                      if (supervisor.university_name && supervisor.university_name !== "Al Sham Private University") {
                        displayText += ` - ${supervisor.university_name}`;
                      }
                      
                      // إضافة القسم إذا كان موجوداً
                      if (supervisor.department) {
                        displayText += ` (${supervisor.department})`;
                      }
                      
                      // إضافة المنصب إذا كان موجوداً
                      if (supervisor.position) {
                        displayText += ` - ${supervisor.position}`;
                      }
                      
                      return (
                        <option key={supervisor.id} value={supervisor.id}>
                          {displayText || `مشرف ${supervisor.id.slice(0, 8)}`}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedSupervisorId("");
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleAssignSupervisor}
                  disabled={!selectedSupervisorId || assigningSupervisor}
                  loading={assigningSupervisor}
                >
                  تعيين
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatedWrapper>
  );
}

