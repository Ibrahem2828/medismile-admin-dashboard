"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Send, CheckCircle, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  fetchEvaluationsAsync,
  submitEvaluationAsync,
  finalizeEvaluationAsync,
  setSearch,
  setStatusFilter,
  setDateFilter,
  setEvaluatorTypeFilter,
  clearError,
} from "../../redux/features/evaluations/evaluationsSlice";
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
import { useRtl } from "@/hooks/useRtl";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

function getStatusBadge(status, t) {
  const map = {
    created: { label: "تم الإنشاء", variant: "warning" },
    adjusted: { label: "تم التعديل", variant: "info" },
    finalized: { label: "مقرار", variant: "success" },
    draft: { label: t("reviews.statuses.draft"), variant: "warning" },
    submitted: { label: t("reviews.statuses.submitted"), variant: "info" },
    final: { label: t("reviews.statuses.final"), variant: "success" },
    new: { label: t("reviews.statuses.new"), variant: "default" },
  };
  const info = map[status] || { label: status || t("reviews.statuses.new"), variant: "default" };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export default function EvaluationsPage() {
  return (
    <RoleGuard>
      <EvaluationsContent />
    </RoleGuard>
  );
}

function EvaluationsContent() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();
  const evaluationsState = useSelector((state) => state.evaluations);
  const reviews = evaluationsState?.reviews || [];
  const loading = evaluationsState?.loading || false;
  const error = evaluationsState?.error || null;
  const search = evaluationsState?.search || "";
  const statusFilter = evaluationsState?.statusFilter || "all";
  const dateFilter = evaluationsState?.dateFilter || "";
  const evaluatorTypeFilter = evaluationsState?.evaluatorTypeFilter || "all";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
    setUserLoaded(true);
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    const params = {};

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (evaluatorTypeFilter !== "all") {
      params.evaluator_role = evaluatorTypeFilter;
      params.evaluator_type = evaluatorTypeFilter;
    }

    dispatch(fetchEvaluationsAsync(params));
  }, [dispatch, userLoaded, user?.id, user?.role, statusFilter, evaluatorTypeFilter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const averageRating =
    reviews.length > 0
      ? (
          (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
            reviews.length /
            10) *
          5
        ).toFixed(1)
      : "0.0";

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.name?.toLowerCase().includes(search.toLowerCase()) ||
      review.comment?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || review.status === statusFilter;

    const matchesDate = !dateFilter || review.date?.includes(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleSubmitEvaluationStatus = async (evaluationId) => {
    try {
      await dispatch(submitEvaluationAsync(evaluationId)).unwrap();
      toast.success(t("reviews.submitSuccess"));
      const params = {};
      if (user?.role === "university_admin" && evaluatorTypeFilter !== "all") {
        params.evaluator_type = evaluatorTypeFilter;
      }
      dispatch(fetchEvaluationsAsync(params));
    } catch (err) {
      toast.error(err || t("reviews.submitError"));
    }
  };

  const handleFinalizeEvaluation = async (evaluationId) => {
    try {
      await dispatch(finalizeEvaluationAsync(evaluationId)).unwrap();
      toast.success(t("reviews.finalizeSuccess"));
      const params = {};
      if (user?.role === "university_admin" && evaluatorTypeFilter !== "all") {
        params.evaluator_type = evaluatorTypeFilter;
      }
      dispatch(fetchEvaluationsAsync(params));
    } catch (err) {
      toast.error(err || t("reviews.finalizeError"));
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4 sm:p-6" />;
  }

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen bg-background p-4 sm:p-6 lg:p-8 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="text-h1 text-text">{t("reviews.title")}</h1>
              <p className="text-body-sm text-text-secondary">
                {t("reviews.description")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { value: reviews.length, label: t("reviews.total"), delay: 0 },
              { value: averageRating, label: t("reviews.average"), delay: 0.05 },
              {
                value: reviews.filter((r) => r.status === "new").length,
                label: t("reviews.new"),
                delay: 0.1,
              },
              {
                value: reviews.filter((r) => r.status === "reviewed").length,
                label: t("reviews.reviewed"),
                delay: 0.15,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: stat.delay }}
              >
                <Card className="!p-4 text-center sm:!p-5">
                  <p className="mb-1 text-h2 text-primary">{stat.value}</p>
                  <p className="text-caption font-medium text-muted">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card padding className="!p-4 sm:!p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={labelClass}>{t("actions.search")}</label>
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
                    placeholder={t("reviews.searchPlaceholder")}
                    value={search}
                    onChange={(e) => dispatch(setSearch(e.target.value))}
                    className={isRtl ? "pr-10" : "pl-10"}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("reviews.evaluatorTypes.all")}</label>
                <select
                  value={evaluatorTypeFilter}
                  onChange={(e) => dispatch(setEvaluatorTypeFilter(e.target.value))}
                  className={selectClass}
                >
                  <option value="all">{t("reviews.evaluatorTypes.all")}</option>
                  <option value="patient">{t("reviews.evaluatorTypes.patient")}</option>
                  <option value="supervisor">{t("reviews.evaluatorTypes.supervisor")}</option>
                  <option value="student">{t("reviews.evaluatorTypes.student")}</option>
                  <option value="university">{t("reviews.evaluatorTypes.university")}</option>
                  <option value="admin">{t("reviews.evaluatorTypes.admin")}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{t("reviews.all")}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => dispatch(setStatusFilter(e.target.value))}
                  className={selectClass}
                >
                  <option value="all">{t("reviews.all")}</option>
                  <option value="created">تم الإنشاء</option>
                  <option value="adjusted">تم التعديل</option>
                  <option value="finalized">مقرار</option>
                  <option value="draft">{t("reviews.statuses.draft")}</option>
                  <option value="submitted">{t("reviews.statuses.submitted")}</option>
                  <option value="final">{t("reviews.statuses.final")}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>التاريخ</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => dispatch(setDateFilter(e.target.value))}
                />
              </div>
            </div>
          </Card>

          {loading && reviews.length === 0 && <DataTableLoading />}

          {!loading && (
            <div className="space-y-3">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review, idx) => {
                  const starRating =
                    review.starRating || Math.round((review.rating || 0) / 2);

                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(idx * 0.02, 0.2),
                      }}
                    >
                      <Card className="!p-4 transition-colors hover:bg-primary-muted/20 sm:!p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div
                              className={`mb-2 flex flex-wrap items-center gap-2 ${
                                isRtl ? "flex-row-reverse" : ""
                              }`}
                            >
                              <h2 className="text-h3 text-text">
                                <Link
                                  href={`/evaluations/${review.id}`}
                                  className="hover:text-primary"
                                >
                                  {review.evaluator_name ||
                                    review.name ||
                                    "غير معروف"}
                                </Link>
                              </h2>
                              <Badge variant="primary">
                                {review.evaluator_role ||
                                  review.evaluatorType ||
                                  "-"}
                              </Badge>
                              {getStatusBadge(review.status, t)}
                            </div>

                            <div className="mb-2 space-y-1 text-body-sm text-muted">
                              <p>{review.date || "-"}</p>
                              {review.student_name && (
                                <p className="text-text-secondary">
                                  الطالب: {review.student_name}
                                </p>
                              )}
                              {review.target_name && (
                                <p className="text-text-secondary">
                                  الهدف: {review.target_name}
                                </p>
                              )}
                            </div>

                            {review.comment && (
                              <p className="text-body-sm leading-relaxed text-text">
                                {review.comment}
                              </p>
                            )}
                          </div>

                          <div
                            className={`flex shrink-0 flex-col gap-3 ${
                              isRtl
                                ? "items-start md:items-start"
                                : "items-start md:items-end"
                            }`}
                          >
                            <div
                              className={`flex gap-1 ${
                                isRtl ? "flex-row-reverse" : ""
                              }`}
                            >
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < starRating
                                      ? "fill-primary text-primary"
                                      : "text-border"
                                  }`}
                                />
                              ))}
                            </div>

                            <div className="text-center">
                              <p className="text-body-sm font-semibold text-text">
                                {review.final_score !== undefined
                                  ? `${review.final_score}/100`
                                  : review.score !== undefined
                                  ? `${review.score}/100`
                                  : `${review.rating || 0}/10`}
                              </p>
                              {review.original_score !== undefined &&
                                review.original_score !== review.final_score && (
                                  <p className="text-caption text-muted line-through">
                                    {review.original_score}/100
                                  </p>
                                )}
                            </div>

                            {review.target_type && (
                              <Badge variant="default">
                                {review.target_type === "case"
                                  ? "حالة سريرية"
                                  : review.target_type === "appointment"
                                  ? "موعد"
                                  : review.target_type === "session"
                                  ? "جلسة"
                                  : review.target_type}
                              </Badge>
                            )}

                            <div
                              className={`mt-1 flex flex-wrap gap-2 ${
                                isRtl ? "flex-row-reverse" : ""
                              }`}
                            >
                              {user?.role === "university_admin" &&
                                review.status === "draft" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSubmitEvaluationStatus(review.id)
                                    }
                                  >
                                    <Send size={14} />
                                    {t("reviews.submit")}
                                  </Button>
                                )}
                              {user?.role === "university_admin" &&
                                review.status === "submitted" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="border-success/30 bg-success/15 text-success hover:bg-success/20"
                                    onClick={() =>
                                      handleFinalizeEvaluation(review.id)
                                    }
                                  >
                                    <CheckCircle size={14} />
                                    {t("reviews.finalize")}
                                  </Button>
                                )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <DataTableEmpty>
                  <Star size={40} className="mx-auto mb-3 text-muted" />
                  <p className="text-body-sm text-muted">
                    {loading ? t("reviews.loading") : t("reviews.no_results")}
                  </p>
                </DataTableEmpty>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}
