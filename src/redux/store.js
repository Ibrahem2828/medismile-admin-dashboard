import { configureStore } from "@reduxjs/toolkit";
import studentsReducer from "./features/students/studentsSlice";
import universityReducer from "./features/university/universitySlice";
import clinicalCasesReducer from "./features/clinicalCases/clinicalCasesSlice";
import supervisorsReducer from "./features/supervisors/supervisorsSlice";
import evaluationsReducer from "./features/evaluations/evaluationsSlice";
import patientsReducer from "./features/patients/patientsSlice";
import treatmentsReducer from "./features/treatments/treatmentsSlice";
import appointmentsReducer from "./features/appointments/appointmentsSlice";
import sessionsReducer from "./features/sessions/sessionsSlice";
import mediContentReducer from "./features/mediContent/mediContentSlice";
import reportsReducer from "./features/reports/reportsSlice";
import attachmentsReducer from "./features/attachments/attachmentsSlice";
import notificationsReducer from "./features/notifications/notificationsSlice";
import themeReducer from "./features/theme/themeSlice";
import authReducer from "./features/auth/authSlice";
import supportReducer from "./features/support/supportSlice";
import subjectsReducer from "./features/subjects/subjectsSlice";



export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentsReducer,
    university: universityReducer,
    clinicalCases: clinicalCasesReducer,
    supervisors: supervisorsReducer,
    evaluations: evaluationsReducer,
    patients: patientsReducer,
    treatments: treatmentsReducer,
    appointments: appointmentsReducer,
    sessions: sessionsReducer,
    mediContent: mediContentReducer,
    reports: reportsReducer,
    attachments: attachmentsReducer,
    notifications: notificationsReducer,
    theme: themeReducer,
    support: supportReducer,
    subjects: subjectsReducer,
  },
});

export default store;
