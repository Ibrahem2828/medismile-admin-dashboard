"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { useRole } from "@/hooks/useRole";
import RoleGuard from "@/components/RoleGuard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import {
  Button,
  Input,
  Badge,
  Card,
  CardTitle,
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableBody,
  DataTableRow,
  DataTableTd,
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui";
import { fetchAuditLogs, fetchAuditStatistics } from "@/services/auditApi";
import { Activity, Search, Filter, User, FileText, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm text-text " +
  "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

const labelClass = "mb-1.5 block text-caption font-semibold text-muted";

/**
 * صفحة سجلات التدقيق
 * متاحة فقط لإدارة الجامعة
 */
export default function AuditLogsPage() {
  return (
    <RoleGuard>
      <AuditLogsContent />
    </RoleGuard>
  );
}

function AuditLogsContent() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const { canAccess } = useRole();

  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    content_type: "",
    start_date: "",
    end_date: "",
    search: "",
  });

  // جلب البيانات
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // جلب السجلات
      const logsData = await fetchAuditLogs(filters);
      setLogs(logsData);

      // جلب الإحصائيات (مع معالجة الأخطاء)
      try {
        const statsData = await fetchAuditStatistics();
        setStatistics(statsData);
      } catch (error) {
        // إذا فشل، نستخدم قيم افتراضية
        setStatistics({
          action_counts: [],
          top_users: [],
          daily_activity: [],
        });
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      content_type: "",
      start_date: "",
      end_date: "",
      search: "",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionVariant = (action) => {
    const variants = {
      create: "success",
      update: "info",
      delete: "danger",
      view: "default",
    };
    return variants[action] || "default";
  };

  if (loading) {
    return (
      <AnimatedWrapper>
        <div className={`space-y-4 p-6 sm:p-8 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="h-8 w-1/3 animate-pulse rounded-md bg-border" />
          <DataTableLoading />
        </div>
      </AnimatedWrapper>
    );
  }

  return (
    <AnimatedWrapper>
      <div className={`space-y-6 p-6 sm:p-8 ${isRtl ? "text-right" : "text-left"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="rounded-lg bg-primary-muted p-2.5 text-primary">
                <Activity className="h-5 w-5" aria-hidden />
              </div>
              <h1 className="text-h1 text-text">
                {t("AuditLogs.title")}
              </h1>
            </div>
          </div>
          <Button onClick={loadData} className="shrink-0 self-start sm:self-auto">
            <RefreshCw size={18} />
            {t("AuditLogs.refresh")}
          </Button>
        </div>

        {/* Statistics Charts */}
        {statistics && canAccess("audit.statistics") && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            {/* Action Counts Chart */}
            {statistics.action_counts && (
              <Card>
                <CardTitle className="mb-4">
                  {t("AuditLogs.actionDistribution")}
                </CardTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statistics.action_counts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border)" />
                    <XAxis dataKey="action" stroke="var(--ds-muted)" />
                    <YAxis stroke="var(--ds-muted)" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="var(--ds-primary)" name={t("AuditLogs.actionCount")} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Daily Activity Chart */}
            {statistics.daily_activity && (
              <Card>
                <CardTitle className="mb-4">
                  {t("AuditLogs.dailyActivity")}
                </CardTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={statistics.daily_activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border)" />
                    <XAxis dataKey="date" stroke="var(--ds-muted)" />
                    <YAxis stroke="var(--ds-muted)" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--ds-primary)"
                      strokeWidth={2.5}
                      name={t("AuditLogs.actionCount")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Card padding className="!p-4 sm:!p-5">
          <div className={`mb-4 flex items-center gap-2 border-b border-border pb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Filter size={18} className="text-primary" aria-hidden />
            <h2 className="text-h3 text-text">{t("AuditLogs.filters")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div>
              <label className={labelClass}>
                {t("AuditLogs.search")}
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
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder={t("AuditLogs.searchPlaceholder")}
                  className={isRtl ? "pr-10" : "pl-10"}
                />
              </div>
            </div>

            {/* Action */}
            <div>
              <label className={labelClass}>
                {t("AuditLogs.actionType")}
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("AuditLogs.all")}</option>
                <option value="create">{t("AuditLogs.actions.create")}</option>
                <option value="update">{t("AuditLogs.actions.update")}</option>
                <option value="delete">{t("AuditLogs.actions.delete")}</option>
                <option value="view">{t("AuditLogs.actions.view")}</option>
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className={labelClass}>
                {t("AuditLogs.contentType")}
              </label>
              <select
                value={filters.content_type}
                onChange={(e) => handleFilterChange("content_type", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("AuditLogs.all")}</option>
                <option value="case">{t("AuditLogs.contentTypes.case")}</option>
                <option value="appointment">{t("AuditLogs.contentTypes.appointment")}</option>
                <option value="evaluation">{t("AuditLogs.contentTypes.evaluation")}</option>
                <option value="report">{t("AuditLogs.contentTypes.report")}</option>
                <option value="user">{t("AuditLogs.contentTypes.user")}</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className={labelClass}>
                {t("AuditLogs.fromDate")}
              </label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label className={labelClass}>
                {t("AuditLogs.toDate")}
              </label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button variant="outline" onClick={handleResetFilters} className="w-full">
                {t("AuditLogs.reset")}
              </Button>
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        {logs.length > 0 ? (
          <DataTable dir={isRtl ? "rtl" : "ltr"} minWidth="900px">
            <DataTableHead>
              <tr>
                <DataTableTh>{t("AuditLogs.table.date")}</DataTableTh>
                <DataTableTh>{t("AuditLogs.table.user")}</DataTableTh>
                <DataTableTh>{t("AuditLogs.table.action")}</DataTableTh>
                <DataTableTh>{t("AuditLogs.table.contentType")}</DataTableTh>
                <DataTableTh>{t("AuditLogs.table.description")}</DataTableTh>
                <DataTableTh>{t("AuditLogs.table.ipAddress")}</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {logs.map((log) => (
                <DataTableRow key={log.id}>
                  <DataTableTd className="text-text-secondary tabular-nums whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </DataTableTd>
                  <DataTableTd>
                    <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <User size={16} className="shrink-0 text-primary" aria-hidden />
                      <span className="font-medium text-text">
                        {log.user?.first_name || ""} {log.user?.last_name || ""}
                      </span>
                      <span className="text-caption text-muted">
                        ({log.user?.email || log.user?.username || t("AuditLogs.unknown")})
                      </span>
                    </div>
                  </DataTableTd>
                  <DataTableTd>
                    <Badge variant={getActionVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </DataTableTd>
                  <DataTableTd>
                    <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <FileText size={16} className="shrink-0 text-primary" aria-hidden />
                      <span className="text-text-secondary">
                        {log.content_type || t("AuditLogs.notSpecified")}
                      </span>
                    </div>
                  </DataTableTd>
                  <DataTableTd className="max-w-[280px] text-text-secondary">
                    {log.description || t("AuditLogs.noDescription")}
                  </DataTableTd>
                  <DataTableTd className="font-mono text-caption text-muted tabular-nums">
                    {log.ip_address || t("AuditLogs.notAvailable")}
                  </DataTableTd>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        ) : (
          <DataTableEmpty>{t("AuditLogs.noLogs")}</DataTableEmpty>
        )}

        {/* Top Users */}
        {statistics?.top_users && canAccess("audit.statistics") && (
          <Card>
            <CardTitle className="mb-4 border-b border-border pb-3">
              {t("AuditLogs.topUsers")}
            </CardTitle>
            <div className="space-y-2">
              {statistics.top_users.slice(0, 5).map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 ${
                    isRtl ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <span className="text-caption font-semibold text-muted">#{index + 1}</span>
                    <span className="text-body-sm font-medium text-text">
                      {user.user__email || user.email || t("AuditLogs.unknown")}
                    </span>
                  </div>
                  <span className="text-body-sm font-semibold tabular-nums text-primary">
                    {user.count} {t("AuditLogs.actionsCount")}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AnimatedWrapper>
  );
}
