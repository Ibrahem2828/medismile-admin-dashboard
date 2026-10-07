import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as attachmentsApi from "../../../services/attachmentsApi";
import { fetchStudents } from "../../../services/studentsApi";
import { fetchCases } from "../../../services/casesApi";
import { fetchAppointments } from "../../../services/appointmentsApi";

/**
 * دالة مساعدة لاستخراج اسم المستخدم من User object
 */
const getUserName = (user) => {
  if (!user) return "-";
  if (typeof user === "string") return user;
  
  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  if (firstName) return firstName;
  if (user.username) return user.username;
  if (user.email) return user.email;
  return "-";
};

/**
 * دالة مساعدة لتحويل حجم الملف إلى صيغة مقروءة
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 */
const mapAttachmentFromApi = (apiAttachment, studentsMap = new Map(), casesMap = new Map(), appointmentsMap = new Map()) => {
  if (!apiAttachment) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  return {
    id: safeValue(apiAttachment.id),
    file_url: safeValue(apiAttachment.file_url),
    original_filename: safeValue(apiAttachment.original_filename, ""),
    file_size: safeValue(apiAttachment.file_size, 0),
    file_size_formatted: formatFileSize(apiAttachment.file_size || 0),
    mime_type: safeValue(apiAttachment.mime_type, ""),
    file_category: safeValue(apiAttachment.file_category, "other"),
    attachment_type: safeValue(apiAttachment.attachment_type, "other"),
    is_visible_to_patient: safeValue(apiAttachment.is_visible_to_patient, false),
    case: safeValue(apiAttachment.case, null),
    case_id: apiAttachment.case?.id || apiAttachment.case || null,
    case_title: casesMap.get(apiAttachment.case?.id || apiAttachment.case) || "-",
    appointment: safeValue(apiAttachment.appointment, null),
    appointment_id: apiAttachment.appointment?.id || apiAttachment.appointment || null,
    appointment_date: appointmentsMap.get(apiAttachment.appointment?.id || apiAttachment.appointment) || null,
    uploaded_by: safeValue(apiAttachment.uploaded_by, null),
    uploaded_by_id: apiAttachment.uploaded_by?.id || apiAttachment.uploaded_by || null,
    uploaded_by_name: getUserName(apiAttachment.uploaded_by) || studentsMap.get(apiAttachment.uploaded_by?.id || apiAttachment.uploaded_by) || "-",
    created_at: safeValue(apiAttachment.created_at),
  };
};

/**
 * جلب جميع المرفقات من API
 * مع جلب أسماء الطلاب والحالات والمواعيد من المعرفات
 */
export const fetchAttachmentsAsync = createAsyncThunk(
  "attachments/fetchAttachments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await attachmentsApi.fetchAttachments(params);
      
      // جلب قائمة الطلاب والحالات والمواعيد لاستخراج الأسماء من المعرفات
      let studentsMap = new Map();
      let casesMap = new Map();
      let appointmentsMap = new Map();
      
      try {
        const [studentsData, casesData, appointmentsData] = await Promise.all([
          fetchStudents().catch(() => []),
          fetchCases().catch(() => []),
          fetchAppointments().catch(() => [])
        ]);
        
        // إنشاء map من ID إلى Name للطلاب
        if (Array.isArray(studentsData)) {
          studentsData.forEach((student) => {
            const studentId = student.user_id || student.id;
            if (studentId) {
              const name = getUserName(student);
              if (name && name !== "-") {
                studentsMap.set(studentId, name);
              }
            }
          });
        }
        
        // إنشاء map من ID إلى Title للحالات
        if (Array.isArray(casesData)) {
          casesData.forEach((caseItem) => {
            const caseId = caseItem.id;
            if (caseId) {
              const title = caseItem.title || "حالة بدون عنوان";
              casesMap.set(caseId, title);
            }
          });
        }
        
        // إنشاء map من ID إلى Date للمواعيد
        if (Array.isArray(appointmentsData)) {
          appointmentsData.forEach((appointment) => {
            const appointmentId = appointment.id;
            if (appointmentId) {
              const date = appointment.appointment_date || appointment.start_datetime || appointment.scheduled_at;
              if (date) {
                appointmentsMap.set(appointmentId, date);
              }
            }
          });
        }
      } catch (err) {
        // إذا فشل جلب البيانات، نكمل بدونها
        console.warn("Failed to fetch related data for name mapping:", err);
      }
      
      // تحويل كل مرفق باستخدام دالة mapping مع maps الأسماء
      if (Array.isArray(data)) {
        return data.map((attachment) => 
          mapAttachmentFromApi(attachment, studentsMap, casesMap, appointmentsMap)
        ).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المرفقات"
      );
    }
  }
);

/**
 * جلب تفاصيل مرفق محدد
 * مع جلب أسماء الطلاب والحالات والمواعيد من المعرفات
 */
export const fetchAttachmentByIdAsync = createAsyncThunk(
  "attachments/fetchAttachmentById",
  async (attachmentId, { rejectWithValue }) => {
    try {
      const data = await attachmentsApi.fetchAttachmentById(attachmentId);
      
      // جلب قائمة الطلاب والحالات والمواعيد لاستخراج الأسماء من المعرفات
      let studentsMap = new Map();
      let casesMap = new Map();
      let appointmentsMap = new Map();
      
      try {
        const [studentsData, casesData, appointmentsData] = await Promise.all([
          fetchStudents().catch(() => []),
          fetchCases().catch(() => []),
          fetchAppointments().catch(() => [])
        ]);
        
        // إنشاء map من ID إلى Name للطلاب
        if (Array.isArray(studentsData)) {
          studentsData.forEach((student) => {
            const studentId = student.user_id || student.id;
            if (studentId) {
              const name = getUserName(student);
              if (name && name !== "-") {
                studentsMap.set(studentId, name);
              }
            }
          });
        }
        
        // إنشاء map من ID إلى Title للحالات
        if (Array.isArray(casesData)) {
          casesData.forEach((caseItem) => {
            const caseId = caseItem.id;
            if (caseId) {
              const title = caseItem.title || "حالة بدون عنوان";
              casesMap.set(caseId, title);
            }
          });
        }
        
        // إنشاء map من ID إلى Date للمواعيد
        if (Array.isArray(appointmentsData)) {
          appointmentsData.forEach((appointment) => {
            const appointmentId = appointment.id;
            if (appointmentId) {
              const date = appointment.appointment_date || appointment.start_datetime || appointment.scheduled_at;
              if (date) {
                appointmentsMap.set(appointmentId, date);
              }
            }
          });
        }
      } catch (err) {
        // إذا فشل جلب البيانات، نكمل بدونها
        console.warn("Failed to fetch related data for name mapping:", err);
      }
      
      return mapAttachmentFromApi(data, studentsMap, casesMap, appointmentsMap);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تفاصيل المرفق"
      );
    }
  }
);

const initialState = {
  attachments: [],
  selectedAttachment: null,
  loading: false,
  loadingSelected: false,
  error: null,
};

const attachmentsSlice = createSlice({
  name: "attachments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedAttachment: (state) => {
      state.selectedAttachment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAttachmentsAsync
      .addCase(fetchAttachmentsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttachmentsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.attachments = action.payload || [];
        state.error = null;
      })
      .addCase(fetchAttachmentsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.attachments = [];
      })
      // fetchAttachmentByIdAsync
      .addCase(fetchAttachmentByIdAsync.pending, (state) => {
        state.loadingSelected = true;
        state.error = null;
      })
      .addCase(fetchAttachmentByIdAsync.fulfilled, (state, action) => {
        state.loadingSelected = false;
        state.selectedAttachment = action.payload;
        state.error = null;
      })
      .addCase(fetchAttachmentByIdAsync.rejected, (state, action) => {
        state.loadingSelected = false;
        state.error = action.payload;
        state.selectedAttachment = null;
      });
  },
});

export const { clearError, clearSelectedAttachment } = attachmentsSlice.actions;
export default attachmentsSlice.reducer;

