"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  GraduationCap,
  FileText,
  Calendar,
  Star,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { unifiedSearch, highlightMatchReact } from "@/lib/searchUtils";
import { useSearchData } from "@/hooks/useSearchData";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import {
  Input,
  Badge,
  Card,
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui";
import { useRtl } from "@/hooks/useRtl";

export default function SearchPage() {
  return (
    <RoleGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" size={32} />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </RoleGuard>
  );
}

function SearchContent() {
  const isRtl = useRtl();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    students,
    supervisors,
    cases,
    appointments,
    evaluations,
    loading: dataLoading,
    hasAnyData,
  } = useSearchData({ enabled: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // جلب query من URL
  useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    setSearchQuery(queryFromUrl);
  }, [searchParams]);

  // البحث عند تغيير query أو البيانات
  useEffect(() => {
    if (searchQuery.trim()) {
      const searchResults = unifiedSearch(searchQuery, {
        students: students || [],
        supervisors: supervisors || [],
        cases: cases || [],
        appointments: appointments || [],
        evaluations: evaluations || [],
      });
      setResults(searchResults);
    } else {
      setResults(null);
    }
  }, [searchQuery, students, supervisors, cases, appointments, evaluations]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults(null);
    setActiveTab("all");
    router.push("/search");
  };

  const tabs = [
    { id: "all", label: "الكل", icon: Search, count: results?.total || 0 },
    { id: "students", label: "الطلاب", icon: GraduationCap, count: results?.students.length || 0 },
    { id: "supervisors", label: "المشرفين", icon: Users, count: results?.supervisors.length || 0 },
    { id: "cases", label: "الحالات", icon: FileText, count: results?.cases.length || 0 },
    { id: "appointments", label: "المواعيد", icon: Calendar, count: results?.appointments.length || 0 },
    { id: "evaluations", label: "التقييمات", icon: Star, count: results?.evaluations.length || 0 },
  ];

  const getDisplayedResults = () => {
    if (!results) return null;

    switch (activeTab) {
      case "students":
        return { students: results.students };
      case "supervisors":
        return { supervisors: results.supervisors };
      case "cases":
        return { cases: results.cases };
      case "appointments":
        return { appointments: results.appointments };
      case "evaluations":
        return { evaluations: results.evaluations };
      default:
        return results;
    }
  };

  const displayedResults = getDisplayedResults();
  const showLoading = Boolean(searchQuery.trim()) && dataLoading && !hasAnyData;
  const showNoResults =
    Boolean(searchQuery.trim()) &&
    !dataLoading &&
    results &&
    results.total === 0;

  if (!mounted) return null;

  return (
    <AnimatedWrapper>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`min-h-screen bg-background px-4 py-6 md:px-6 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-h1 text-text">البحث الموحد</h1>
            <p className="text-body-sm text-text-secondary">
              ابحث في الطلاب، المشرفين، الحالات، المواعيد، والتقييمات
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted ${
                  isRtl ? "right-4" : "left-4"
                }`}
                size={18}
                aria-hidden
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveTab("all");
                }}
                placeholder="ابحث عن طالب، مشرف، حالة، موعد، أو تقييم..."
                className={`h-12 text-body-sm ${isRtl ? "pr-11 pl-11" : "pl-11 pr-11"}`}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:bg-primary-muted hover:text-text ${
                    isRtl ? "left-3" : "right-3"
                  }`}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </form>

          {/* Loading State */}
          {showLoading && <DataTableLoading />}

          {/* Results Summary */}
          {results && results.total > 0 && (
            <Card className="!p-4 border-primary/25 bg-primary-muted/30">
              <p className="text-body-sm text-text">
                تم العثور على{" "}
                <span className="font-semibold text-primary">{results.total}</span>{" "}
                نتيجة
                {dataLoading ? (
                  <span className="ms-2 text-caption text-muted">(جاري تحديث البيانات...)</span>
                ) : null}
              </p>
            </Card>
          )}

          {/* Tabs */}
          {results && results.total > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-border pb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-t-md px-3 py-2 text-caption font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-text-secondary hover:bg-primary-muted hover:text-text"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge
                        variant={isActive ? "default" : "primary"}
                        className={
                          isActive
                            ? "border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground"
                            : undefined
                        }
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <DataTableEmpty>
              <Search className="mx-auto mb-3 text-muted" size={40} />
              <p className="text-body-sm font-medium text-text">لم يتم العثور على نتائج</p>
              <p className="mt-1 text-caption text-muted">
                جرب البحث بكلمات مختلفة أو تحقق من الإملاء
              </p>
            </DataTableEmpty>
          )}

          {/* Empty state before search */}
          {!searchQuery.trim() && !showLoading && (
            <DataTableEmpty>
              <Search className="mx-auto mb-3 text-muted" size={40} />
              <p className="text-body-sm text-muted">
                اكتب كلمة للبحث في بيانات الجامعة
              </p>
            </DataTableEmpty>
          )}

          {/* Results */}
          {displayedResults && results?.total > 0 && (
            <div className="space-y-4">
              {(activeTab === "all" || activeTab === "students") &&
                displayedResults.students?.length > 0 && (
                  <ResultsSection
                    title="الطلاب"
                    icon={GraduationCap}
                    count={displayedResults.students.length}
                    items={displayedResults.students}
                    type="student"
                    router={router}
                    isRtl={isRtl}
                    query={searchQuery}
                  />
                )}

              {(activeTab === "all" || activeTab === "supervisors") &&
                displayedResults.supervisors?.length > 0 && (
                  <ResultsSection
                    title="المشرفين"
                    icon={Users}
                    count={displayedResults.supervisors.length}
                    items={displayedResults.supervisors}
                    type="supervisor"
                    router={router}
                    isRtl={isRtl}
                    query={searchQuery}
                  />
                )}

              {(activeTab === "all" || activeTab === "cases") &&
                displayedResults.cases?.length > 0 && (
                  <ResultsSection
                    title="الحالات السريرية"
                    icon={FileText}
                    count={displayedResults.cases.length}
                    items={displayedResults.cases}
                    type="case"
                    router={router}
                    isRtl={isRtl}
                    query={searchQuery}
                  />
                )}

              {(activeTab === "all" || activeTab === "appointments") &&
                displayedResults.appointments?.length > 0 && (
                  <ResultsSection
                    title="المواعيد"
                    icon={Calendar}
                    count={displayedResults.appointments.length}
                    items={displayedResults.appointments}
                    type="appointment"
                    router={router}
                    isRtl={isRtl}
                    query={searchQuery}
                  />
                )}

              {(activeTab === "all" || activeTab === "evaluations") &&
                displayedResults.evaluations?.length > 0 && (
                  <ResultsSection
                    title="التقييمات"
                    icon={Star}
                    count={displayedResults.evaluations.length}
                    items={displayedResults.evaluations}
                    type="evaluation"
                    router={router}
                    isRtl={isRtl}
                    query={searchQuery}
                  />
                )}
            </div>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}

function ResultsSection({ title, icon: Icon, count, items, type, router, isRtl, query }) {
  const getRoute = (item, type) => {
    switch (type) {
      case "student":
        return `/users/students?studentId=${item.id || item.user_id}`;
      case "supervisor":
        return `/users/supervisors?supervisorId=${item.id || item.user_id}`;
      case "case":
        return `/university-cases/${item.id}`;
      case "appointment":
        return `/university-appointments?appointmentId=${item.id}`;
      case "evaluation":
        return `/evaluations/${item.id}`;
      default:
        return "#";
    }
  };

  const getItemTitle = (item, type) => {
    switch (type) {
      case "student":
        return (
          item.studentName ||
          `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
          item.email ||
          "-"
        );
      case "supervisor":
        return (
          item.supervisorName ||
          `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
          item.email ||
          "-"
        );
      case "case":
        return item.title || "-";
      case "appointment":
        return item.title || item.patient_name || "-";
      case "evaluation":
        return item.title || "-";
      default:
        return "-";
    }
  };

  const getItemSubtitle = (item, type) => {
    switch (type) {
      case "student":
        return item.email || item.student_id || "";
      case "supervisor":
        return item.email || item.department || "";
      case "case":
        return item.patient_name || item.description?.substring(0, 50) || "";
      case "appointment":
        return item.patient_name || item.notes?.substring(0, 50) || "";
      case "evaluation":
        return item.student_name || item.description?.substring(0, 50) || "";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <div className={`mb-4 flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="rounded-md bg-primary-muted p-2 text-primary">
            <Icon size={18} aria-hidden />
          </div>
          <h2 className="text-h3 text-text">{title}</h2>
          <Badge variant="primary">{count}</Badge>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <button
              type="button"
              key={item.id || item.user_id}
              onClick={() => router.push(getRoute(item, type))}
              className="w-full rounded-md border border-border bg-surface px-4 py-3 text-start transition-colors hover:border-primary/35 hover:bg-primary-muted/40"
            >
              <div className={`flex items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-0.5 font-medium text-text">
                    {highlightMatchReact(getItemTitle(item, type), query)}
                  </h3>
                  {getItemSubtitle(item, type) ? (
                    <p className="text-caption text-muted">
                      {highlightMatchReact(getItemSubtitle(item, type), query)}
                    </p>
                  ) : null}
                </div>
                <ArrowRight
                  className={`shrink-0 text-muted ${isRtl ? "rotate-180" : ""}`}
                  size={18}
                />
              </div>
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
