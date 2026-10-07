"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import {
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
import { useRtl } from "@/hooks/useRtl";
import toast from "react-hot-toast";
import {
  fetchApprovalsAsync,
  clearError as clearMediContentError,
} from "@/redux/features/mediContent/mediContentSlice";

function getDecisionBadge(decision) {
  if (decision === "approved") {
    return <Badge variant="success">موافق عليه</Badge>;
  }
  if (decision === "rejected") {
    return <Badge variant="danger">مرفوض</Badge>;
  }
  return <Badge variant="default">{decision || "-"}</Badge>;
}

function CommunityApprovalLogsInner() {
  const { i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();

  const { approvals, loadingPending, error } = useSelector(
    (state) => state.mediContent
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    dispatch(fetchApprovalsAsync({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearMediContentError());
    }
  }, [error, dispatch]);

  if (!mounted) {
    return <div className="min-h-screen bg-background p-4 sm:p-6" />;
  }

  const directionRtl = isRtl || i18n?.language === "ar";
  const emptyLabel = "لا توجد سجلات موافقة حتى الآن";

  return (
    <AnimatedWrapper>
      <div
        className={`min-h-screen bg-background p-4 sm:p-6 lg:p-8 ${
          directionRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="space-y-1">
            <h1 className="text-h1 text-text">
              سجلات الموافقة على محتوى المجتمع
            </h1>
            <p className="text-body-sm text-text-secondary">
              عرض تتبّع قرارات الموافقة والرفض لمنشورات المجتمع في جامعتك
            </p>
          </div>

          {loadingPending && approvals.length === 0 && <DataTableLoading />}

          {!loadingPending && (
            <>
              <div className="hidden sm:block">
                {approvals && approvals.length > 0 ? (
                  <DataTable dir={directionRtl ? "rtl" : "ltr"} minWidth="900px">
                    <DataTableHead>
                      <tr>
                        <DataTableTh>الطالب</DataTableTh>
                        <DataTableTh>المشرف</DataTableTh>
                        <DataTableTh>القرار</DataTableTh>
                        <DataTableTh>السبب</DataTableTh>
                        <DataTableTh>التاريخ</DataTableTh>
                      </tr>
                    </DataTableHead>
                    <DataTableBody>
                      {approvals.map((log) => (
                        <DataTableRow key={log.id}>
                          <DataTableTd className="font-medium text-text">
                            {log.author_name ||
                              log.author_id ||
                              log.student_id ||
                              "-"}
                          </DataTableTd>
                          <DataTableTd className="text-text-secondary">
                            {log.approving_supervisor_name ||
                              log.approving_supervisor_id ||
                              log.supervisor_id ||
                              "-"}
                          </DataTableTd>
                          <DataTableTd>
                            {getDecisionBadge(log.decision)}
                          </DataTableTd>
                          <DataTableTd className="max-w-[280px] text-text-secondary">
                            {log.reason || "-"}
                          </DataTableTd>
                          <DataTableTd className="whitespace-nowrap tabular-nums text-text-secondary">
                            {log.created_at
                              ? new Date(log.created_at).toLocaleString("ar-SA")
                              : "-"}
                          </DataTableTd>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                ) : (
                  <DataTableEmpty>
                    <ClipboardList
                      size={40}
                      className="mx-auto mb-3 text-muted"
                    />
                    <p className="text-body-sm text-muted">{emptyLabel}</p>
                  </DataTableEmpty>
                )}
              </div>

              <div className="grid gap-3 sm:hidden">
                {approvals && approvals.length > 0 ? (
                  approvals.map((log) => (
                    <Card key={log.id} className="!p-4">
                      <h3 className="mb-2 text-h3 text-text">
                        {log.author_name ||
                          log.author_id ||
                          log.student_id ||
                          "-"}
                      </h3>
                      <div className="mb-3 space-y-1 text-body-sm text-muted">
                        <p>
                          المشرف:{" "}
                          {log.approving_supervisor_name ||
                            log.approving_supervisor_id ||
                            log.supervisor_id ||
                            "-"}
                        </p>
                      </div>
                      <div className="mb-2">{getDecisionBadge(log.decision)}</div>
                      {log.reason && (
                        <p className="mb-2 text-body-sm text-danger">
                          السبب: {log.reason}
                        </p>
                      )}
                      <p className="text-caption tabular-nums text-muted">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("ar-SA")
                          : ""}
                      </p>
                    </Card>
                  ))
                ) : (
                  <DataTableEmpty>
                    <ClipboardList
                      size={40}
                      className="mx-auto mb-3 text-muted"
                    />
                    <p className="text-body-sm text-muted">{emptyLabel}</p>
                  </DataTableEmpty>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatedWrapper>
  );
}

export default function CommunityApprovalLogsPage() {
  return (
    <RoleGuard>
      <CommunityApprovalLogsInner />
    </RoleGuard>
  );
}
