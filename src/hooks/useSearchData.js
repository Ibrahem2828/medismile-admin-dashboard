"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentsAsync } from "@/redux/features/students/studentsSlice";
import { fetchSupervisorsAsync } from "@/redux/features/supervisors/supervisorsSlice";
import { fetchCases } from "@/redux/features/clinicalCases/clinicalCasesSlice";
import { fetchAppointmentsAsync } from "@/redux/features/appointments/appointmentsSlice";
import { fetchEvaluationsAsync } from "@/redux/features/evaluations/evaluationsSlice";

/**
 * Prefetch searchable datasets into Redux so Navbar dropdown + /search work.
 * Fetches only when data is still empty (avoids redundant requests).
 */
export function useSearchData({ enabled = true } = {}) {
  const dispatch = useDispatch();

  const students = useSelector((state) => state.students?.students || []);
  const supervisors = useSelector((state) => state.supervisors?.supervisors || []);
  const cases = useSelector((state) => state.clinicalCases?.cases || []);
  const appointments = useSelector((state) => state.appointments?.appointments || []);
  const evaluations = useSelector((state) => state.evaluations?.evaluations || []);

  const studentsLoading = useSelector((state) => state.students?.loading || false);
  const supervisorsLoading = useSelector((state) => state.supervisors?.loading || false);
  const casesLoading = useSelector((state) => state.clinicalCases?.loading || false);
  const appointmentsLoading = useSelector((state) => state.appointments?.loading || false);
  const evaluationsLoading = useSelector((state) => state.evaluations?.loading || false);

  useEffect(() => {
    if (!enabled) return;

    if (!students.length && !studentsLoading) {
      dispatch(fetchStudentsAsync());
    }
    if (!supervisors.length && !supervisorsLoading) {
      dispatch(fetchSupervisorsAsync());
    }
    if (!cases.length && !casesLoading) {
      dispatch(fetchCases({}));
    }
    if (!appointments.length && !appointmentsLoading) {
      dispatch(fetchAppointmentsAsync({}));
    }
    if (!evaluations.length && !evaluationsLoading) {
      dispatch(fetchEvaluationsAsync({}));
    }
  }, [
    enabled,
    dispatch,
    students.length,
    supervisors.length,
    cases.length,
    appointments.length,
    evaluations.length,
    studentsLoading,
    supervisorsLoading,
    casesLoading,
    appointmentsLoading,
    evaluationsLoading,
  ]);

  const loading =
    studentsLoading ||
    supervisorsLoading ||
    casesLoading ||
    appointmentsLoading ||
    evaluationsLoading;

  const hasAnyData =
    students.length > 0 ||
    supervisors.length > 0 ||
    cases.length > 0 ||
    appointments.length > 0 ||
    evaluations.length > 0;

  return {
    students,
    supervisors,
    cases,
    appointments,
    evaluations,
    loading,
    hasAnyData,
  };
}
