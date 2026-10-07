"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  GraduationCap,
  Users,
  FileText,
  Calendar,
  Star,
  Loader2,
} from "lucide-react";
import { unifiedSearch, highlightMatchReact } from "@/lib/searchUtils";
import { useSearchData } from "@/hooks/useSearchData";
import { useRtl } from "@/hooks/useRtl";

/**
 * SearchDropdown Component
 * يعرض نتائج البحث في dropdown مع Highlighting
 */
export default function SearchDropdown({
  query,
  onClose,
  maxResults = 5,
}) {
  const router = useRouter();
  const isRtl = useRtl();
  const dropdownRef = useRef(null);

  // Prefetch + read searchable data from Redux
  const {
    students,
    supervisors,
    cases,
    appointments,
    evaluations,
    loading: dataLoading,
  } = useSearchData({ enabled: Boolean(query?.trim()) });

  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // البحث عند تغيير query
  useEffect(() => {
    if (!query || query.trim() === "") {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      const searchResults = unifiedSearch(query, {
        students: students || [],
        supervisors: supervisors || [],
        cases: cases || [],
        appointments: appointments || [],
        evaluations: evaluations || [],
      });

      const limitedResults = {
        students: searchResults.students.slice(0, maxResults),
        supervisors: searchResults.supervisors.slice(0, maxResults),
        cases: searchResults.cases.slice(0, maxResults),
        appointments: searchResults.appointments.slice(0, maxResults),
        evaluations: searchResults.evaluations.slice(0, maxResults),
        total: searchResults.total,
      };

      setResults(limitedResults);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, students, supervisors, cases, appointments, evaluations, maxResults]);

  // إغلاق عند النقر خارج الـ dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleResultClick = (item, type) => {
    let route = "#";

    switch (type) {
      case "student":
        route = `/users/students?studentId=${item.id || item.user_id}`;
        break;
      case "supervisor":
        route = `/users/supervisors?supervisorId=${item.id || item.user_id}`;
        break;
      case "case":
        route = `/university-cases/${item.id}`;
        break;
      case "appointment":
        route = `/university-appointments?appointmentId=${item.id}`;
        break;
      case "evaluation":
        route = `/evaluations/${item.id}`;
        break;
    }

    if (route !== "#") {
      router.push(route);
      onClose();
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

  if (!query || query.trim() === "") return null;

  const isLoading = isSearching || dataLoading;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`absolute inset-x-0 top-full z-50 mt-1 max-h-[480px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        {isLoading && (!results || results.total === 0) ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" size={24} />
          </div>
        ) : results && results.total > 0 ? (
          <div className="p-2">
            {results.students.length > 0 && (
              <ResultSection
                title="الطلاب"
                icon={GraduationCap}
                items={results.students}
                type="student"
                query={query}
                onItemClick={handleResultClick}
                getItemTitle={getItemTitle}
                getItemSubtitle={getItemSubtitle}
                isRtl={isRtl}
              />
            )}

            {results.supervisors.length > 0 && (
              <ResultSection
                title="المشرفين"
                icon={Users}
                items={results.supervisors}
                type="supervisor"
                query={query}
                onItemClick={handleResultClick}
                getItemTitle={getItemTitle}
                getItemSubtitle={getItemSubtitle}
                isRtl={isRtl}
              />
            )}

            {results.cases.length > 0 && (
              <ResultSection
                title="الحالات"
                icon={FileText}
                items={results.cases}
                type="case"
                query={query}
                onItemClick={handleResultClick}
                getItemTitle={getItemTitle}
                getItemSubtitle={getItemSubtitle}
                isRtl={isRtl}
              />
            )}

            {results.appointments.length > 0 && (
              <ResultSection
                title="المواعيد"
                icon={Calendar}
                items={results.appointments}
                type="appointment"
                query={query}
                onItemClick={handleResultClick}
                getItemTitle={getItemTitle}
                getItemSubtitle={getItemSubtitle}
                isRtl={isRtl}
              />
            )}

            {results.evaluations.length > 0 && (
              <ResultSection
                title="التقييمات"
                icon={Star}
                items={results.evaluations}
                type="evaluation"
                query={query}
                onItemClick={handleResultClick}
                getItemTitle={getItemTitle}
                getItemSubtitle={getItemSubtitle}
                isRtl={isRtl}
              />
            )}

            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="w-full rounded-md px-3 py-2 text-caption font-semibold text-primary transition-colors hover:bg-primary-muted"
              >
                عرض جميع النتائج ({results.total})
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Search className="mx-auto mb-2 text-muted" size={28} />
            <p className="text-body-sm text-muted">لا توجد نتائج</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function ResultSection({
  title,
  icon: Icon,
  items,
  type,
  query,
  onItemClick,
  getItemTitle,
  getItemSubtitle,
  isRtl,
}) {
  return (
    <div className="mb-1">
      <div
        className={`flex items-center gap-2 px-3 py-2 text-caption font-semibold uppercase tracking-wide text-muted ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        <Icon size={14} className="text-primary" />
        <span>{title}</span>
        <span className="ms-auto text-muted">({items.length})</span>
      </div>
      {items.map((item) => {
        const itemTitle = getItemTitle(item, type);
        const subtitle = getItemSubtitle(item, type);

        return (
          <button
            type="button"
            key={item.id || item.user_id}
            onClick={() => onItemClick(item, type)}
            className={`w-full rounded-md px-3 py-2 text-start transition-colors hover:bg-primary-muted/60 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div className="mb-0.5 text-body-sm font-medium text-text">
              {highlightMatchReact(itemTitle, query)}
            </div>
            {subtitle ? (
              <div className="text-caption text-muted">
                {highlightMatchReact(subtitle, query)}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
