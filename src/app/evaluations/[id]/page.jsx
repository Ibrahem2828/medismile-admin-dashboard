"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Star, Edit2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import { Button, Badge, Card, Input } from "@/components/ui";
import { useRtl } from "@/hooks/useRtl";
import toast from "react-hot-toast";
import {
  fetchEvaluationByIdAsync,
  adjustEvaluationAsync,
  finalizeEvaluationAsync,
  clearError,
} from "@/redux/features/evaluations/evaluationsSlice";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text " +
  "placeholder:text-muted focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

function getStatusBadge(status) {
  const map = {
    created: { label: "تم الإنشاء", variant: "warning" },
    adjusted: { label: "تم التعديل", variant: "info" },
    finalized: { label: "مقرار", variant: "success" },
    draft: { label: "مسودة", variant: "warning" },
    submitted: { label: "مقدمة", variant: "info" },
    final: { label: "نهائي", variant: "success" },
  };
  const info = map[status] || { label: status || "غير معروف", variant: "default" };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function EvaluationDetailsInner() {
  const { id } = useParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();

  const evaluationsState = useSelector((state) => state.evaluations);
  const evaluation = evaluationsState?.selectedEvaluation || null;
  const loading = evaluationsState?.loading || false;
  const error = evaluationsState?.error || null;

  const [mounted, setMounted] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newScore, setNewScore] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchEvaluationByIdAsync(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (evaluation?.final_score !== undefined) {
      setNewScore((evaluation.final_score / 10).toFixed(1));
    }
  }, [evaluation]);

  const handleAdjust = async () => {
    if (!id || !newScore) {
      toast.error("الرجاء إدخال التقييم الجديد");
      return;
    }

    const score = parseFloat(newScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error("التقييم يجب أن يكون بين 0 و 10");
      return;
    }

    const apiScore = score * 10;

    try {
      setAdjusting(true);
      await dispatch(
        adjustEvaluationAsync({
          evaluationId: id,
          adjustmentData: {
            new_score: apiScore,
            reason: adjustReason || undefined,
          },
        })
      ).unwrap();
      toast.success("تم تعديل التقييم بنجاح");
      setShowAdjustModal(false);
      setAdjustReason("");
      dispatch(fetchEvaluationByIdAsync(id));
    } catch (err) {
      toast.error(err?.message || "فشل في تعديل التقييم");
    } finally {
      setAdjusting(false);
    }
  };

  const handleFinalize = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      "هل أنت متأكد من إقرار هذا التقييم؟ لن يمكن تعديله بعد الإقرار."
    );
    if (!confirmed) return;

    try {
      setFinalizing(true);
      await dispatch(finalizeEvaluationAsync(id)).unwrap();
      toast.success("تم إقرار التقييم بنجاح");
      dispatch(fetchEvaluationByIdAsync(id));
    } catch (err) {
      toast.error(err?.message || "فشل في إقرار التقييم");
    } finally {
      setFinalizing(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4 sm:p-6" />;
  }

  const directionRtl = isRtl || i18n?.language === "ar";

  if (loading && !evaluation) {
    return (
      <AnimatedWrapper>
        <div
          className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
            directionRtl ? "text-right" : "text-left"
          }`}
        >
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-primary" size={32} />
          </div>
        </div>
      </AnimatedWrapper>
    );
  }

  if (error && !evaluation) {
    return (
      <AnimatedWrapper>
        <div
          className={`min-h-screen space-y-4 p-4 sm:p-6 lg:p-8 ${
            directionRtl ? "text-right" : "text-left"
          }`}
        >
          <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-body-sm text-danger">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button onClick={() => router.push("/evaluations")}>العودة</Button>
        </div>
      </AnimatedWrapper>
    );
  }

  if (!evaluation) {
    return (
      <AnimatedWrapper>
        <div
          className={`min-h-screen space-y-4 p-4 sm:p-6 lg:p-8 ${
            directionRtl ? "text-right" : "text-left"
          }`}
        >
          <p className="text-body-sm text-muted">التقييم غير موجود</p>
          <Button onClick={() => router.push("/evaluations")}>العودة</Button>
        </div>
      </AnimatedWrapper>
    );
  }

  const canAdjust =
    (user?.role === "university_admin" || user?.role === "supervisor") &&
    evaluation.status !== "finalized";
  const canFinalize =
    user?.role === "university_admin" && evaluation.status !== "finalized";

  const starRating =
    evaluation.starRating ||
    Math.round(((evaluation.final_score || evaluation.score || 0) / 100) * 5);

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
          directionRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/evaluations")}
            className={`px-0 text-primary hover:bg-transparent hover:text-primary-hover ${
              directionRtl ? "flex-row-reverse" : ""
            }`}
          >
            <ArrowLeft size={18} />
            العودة إلى التقييمات
          </Button>

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-border p-6 sm:p-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h1 className="mb-3 text-h1 text-text">تفاصيل التقييم</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-sm text-muted">
                      المقيم:{" "}
                      {evaluation.evaluator_name ||
                        evaluation.name ||
                        "غير معروف"}
                    </span>
                    <Badge variant="primary">
                      {evaluation.evaluator_role ||
                        evaluation.evaluatorType ||
                        "-"}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(evaluation.status)}
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <h3 className="mb-2 text-caption font-semibold text-muted">
                  التقييم
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    className={`flex gap-1 ${
                      directionRtl ? "flex-row-reverse" : ""
                    }`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${
                          i < starRating
                            ? "fill-primary text-primary"
                            : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-h2 text-text">
                      {evaluation.final_score !== undefined
                        ? `${(evaluation.final_score / 10).toFixed(1)}/10`
                        : evaluation.score !== undefined
                        ? `${(evaluation.score / 10).toFixed(1)}/10`
                        : `${(evaluation.rating || 0) / 10}/10`}
                    </p>
                    {evaluation.original_score !== undefined &&
                      evaluation.original_score !== evaluation.final_score && (
                        <p className="mt-1 text-caption text-muted line-through">
                          التقييم الأصلي:{" "}
                          {(evaluation.original_score / 10).toFixed(1)}/10
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {evaluation.student_name && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    الطالب المقيّم
                  </h3>
                  <p className="text-body-sm text-text">
                    {evaluation.student_name}
                  </p>
                </div>
              )}

              {evaluation.target_name && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    {evaluation.target_type === "case"
                      ? "الحالة السريرية"
                      : evaluation.target_type === "appointment"
                      ? "الموعد"
                      : evaluation.target_type === "session"
                      ? "الجلسة"
                      : "الهدف"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body-sm font-medium text-text">
                      {evaluation.target_name}
                    </p>
                    {evaluation.target_type && (
                      <Badge variant="default">
                        {evaluation.target_type === "case"
                          ? "حالة سريرية"
                          : evaluation.target_type === "appointment"
                          ? "موعد"
                          : evaluation.target_type === "session"
                          ? "جلسة"
                          : evaluation.target_type}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {evaluation.comment && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    التعليق
                  </h3>
                  <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-text">
                    {evaluation.comment}
                  </p>
                </div>
              )}

              {evaluation.date && (
                <div>
                  <h3 className="mb-2 text-caption font-semibold text-muted">
                    التاريخ
                  </h3>
                  <p className="text-body-sm text-text">{evaluation.date}</p>
                </div>
              )}

              {(canAdjust || canFinalize) && (
                <div className="border-t border-border pt-6">
                  <div
                    className={`flex flex-wrap gap-3 ${
                      directionRtl ? "flex-row-reverse" : ""
                    }`}
                  >
                    {canAdjust && (
                      <Button
                        onClick={() => setShowAdjustModal(true)}
                        disabled={adjusting || finalizing}
                      >
                        <Edit2 size={18} />
                        تعديل التقييم
                      </Button>
                    )}
                    {canFinalize && (
                      <Button
                        variant="secondary"
                        className="border-success/30 bg-success/15 text-success hover:bg-success/20"
                        onClick={handleFinalize}
                        disabled={adjusting || finalizing}
                        loading={finalizing}
                      >
                        {!finalizing ? <CheckCircle size={18} /> : null}
                        إقرار التقييم
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showAdjustModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl sm:p-6">
            <div
              className={`mb-5 flex items-center justify-between border-b border-border pb-4 ${
                directionRtl ? "flex-row-reverse" : ""
              }`}
            >
              <h2 className="text-h3 text-text">تعديل التقييم</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustReason("");
                }}
                disabled={adjusting}
                aria-label="Close"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>التقييم الجديد (0-10)</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="0-10"
                />
              </div>
              <div>
                <label className={labelClass}>سبب التعديل (اختياري)</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3}
                  className={fieldClass}
                  placeholder="أدخل سبب التعديل..."
                />
              </div>
              <div
                className={`flex gap-3 ${
                  directionRtl ? "flex-row-reverse" : ""
                }`}
              >
                <Button
                  className="flex-1"
                  onClick={handleAdjust}
                  disabled={adjusting || !newScore}
                  loading={adjusting}
                >
                  تأكيد التعديل
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustReason("");
                  }}
                  disabled={adjusting}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatedWrapper>
  );
}

export default function EvaluationDetailsPage() {
  return (
    <RoleGuard>
      <EvaluationDetailsInner />
    </RoleGuard>
  );
}
