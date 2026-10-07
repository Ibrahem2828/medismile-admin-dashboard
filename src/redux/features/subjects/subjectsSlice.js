import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as subjectsApi from "../../../services/subjectsApi";

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 */
const mapSubjectFromApi = (apiSubject) => {
  if (!apiSubject) return null;

  return {
    id: apiSubject.id,
    name: apiSubject.name || "",
    code: apiSubject.code || "",
    description: apiSubject.description || "",
    university_id: apiSubject.university_id || apiSubject.university,
    supervisors: apiSubject.supervisors || [],
    students: apiSubject.students || [],
    created_at: apiSubject.created_at,
    updated_at: apiSubject.updated_at,
    _apiData: apiSubject, // حفظ البيانات الأصلية
  };
};

/**
 * جلب جميع المواد الدراسية
 */
export const fetchSubjectsAsync = createAsyncThunk(
  "subjects/fetchSubjects",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.fetchSubjects(params);
      const mapped = Array.isArray(data) 
        ? data.map(mapSubjectFromApi).filter(Boolean)
        : [];
      return mapped;
    } catch (error) {
      // إذا كان 404، لا نعرض خطأ لأن API غير موجود بعد
      if (error.response?.status === 404) {
        return []; // نعيد قائمة فارغة
      }
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المواد الدراسية"
      );
    }
  }
);

/**
 * جلب مادة دراسية محددة
 */
export const fetchSubjectByIdAsync = createAsyncThunk(
  "subjects/fetchSubjectById",
  async (subjectId, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.fetchSubjectById(subjectId);
      return mapSubjectFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المادة الدراسية"
      );
    }
  }
);

/**
 * إنشاء مادة دراسية جديدة
 */
export const createSubjectAsync = createAsyncThunk(
  "subjects/createSubject",
  async (subjectData, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.createSubject(subjectData);
      return mapSubjectFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إنشاء المادة الدراسية"
      );
    }
  }
);

/**
 * تحديث مادة دراسية
 */
export const updateSubjectAsync = createAsyncThunk(
  "subjects/updateSubject",
  async ({ subjectId, subjectData }, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.updateSubject(subjectId, subjectData);
      return mapSubjectFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث المادة الدراسية"
      );
    }
  }
);

/**
 * حذف مادة دراسية
 */
export const deleteSubjectAsync = createAsyncThunk(
  "subjects/deleteSubject",
  async (subjectId, { rejectWithValue }) => {
    try {
      await subjectsApi.deleteSubject(subjectId);
      return subjectId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في حذف المادة الدراسية"
      );
    }
  }
);

/**
 * تعيين مشرف لمادة دراسية
 */
export const assignSupervisorAsync = createAsyncThunk(
  "subjects/assignSupervisor",
  async ({ subjectId, supervisorId }, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.assignSupervisor(subjectId, supervisorId);
      return { subjectId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تعيين المشرف"
      );
    }
  }
);

/**
 * إزالة مشرف من مادة دراسية
 */
export const removeSupervisorAsync = createAsyncThunk(
  "subjects/removeSupervisor",
  async ({ subjectId, supervisorId }, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.removeSupervisor(subjectId, supervisorId);
      return { subjectId, supervisorId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إزالة المشرف"
      );
    }
  }
);

/**
 * تسجيل طالب في مادة دراسية
 */
export const enrollStudentAsync = createAsyncThunk(
  "subjects/enrollStudent",
  async ({ subjectId, studentId }, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.enrollStudent(subjectId, studentId);
      return { subjectId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تسجيل الطالب"
      );
    }
  }
);

/**
 * إلغاء تسجيل طالب من مادة دراسية
 */
export const unenrollStudentAsync = createAsyncThunk(
  "subjects/unenrollStudent",
  async ({ subjectId, studentId }, { rejectWithValue }) => {
    try {
      const data = await subjectsApi.unenrollStudent(subjectId, studentId);
      return { subjectId, studentId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إلغاء تسجيل الطالب"
      );
    }
  }
);

const initialState = {
  subjects: [],
  selectedSubject: null,
  loading: false,
  error: null,
};

const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSubject: (state, action) => {
      state.selectedSubject = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Subjects
    builder
      .addCase(fetchSubjectsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjectsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload;
        state.error = null;
      })
      .addCase(fetchSubjectsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Subject By Id
    builder
      .addCase(fetchSubjectByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjectByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSubject = action.payload;
        state.error = null;
      })
      .addCase(fetchSubjectByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Subject
    builder
      .addCase(createSubjectAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubjectAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.subjects.push(action.payload);
        }
        state.error = null;
      })
      .addCase(createSubjectAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Subject
    builder
      .addCase(updateSubjectAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubjectAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.subjects.findIndex((s) => s.id === action.payload.id);
          if (index !== -1) {
            state.subjects[index] = action.payload;
          }
          if (state.selectedSubject?.id === action.payload.id) {
            state.selectedSubject = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateSubjectAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Subject
    builder
      .addCase(deleteSubjectAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubjectAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = state.subjects.filter((s) => s.id !== action.payload);
        if (state.selectedSubject?.id === action.payload) {
          state.selectedSubject = null;
        }
        state.error = null;
      })
      .addCase(deleteSubjectAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Assign Supervisor
    builder
      .addCase(assignSupervisorAsync.fulfilled, (state, action) => {
        const { subjectId } = action.payload;
        // إعادة جلب المادة المحدثة
        // يمكن تحسين هذا بإضافة المشرف مباشرة للـ state
      });

    // Remove Supervisor
    builder
      .addCase(removeSupervisorAsync.fulfilled, (state, action) => {
        const { subjectId, supervisorId } = action.payload;
        const subject = state.subjects.find((s) => s.id === subjectId);
        if (subject) {
          subject.supervisors = subject.supervisors.filter((s) => s.id !== supervisorId);
        }
      });

    // Enroll Student
    builder
      .addCase(enrollStudentAsync.fulfilled, (state, action) => {
        const { subjectId } = action.payload;
        // إعادة جلب المادة المحدثة
      });

    // Unenroll Student
    builder
      .addCase(unenrollStudentAsync.fulfilled, (state, action) => {
        const { subjectId, studentId } = action.payload;
        const subject = state.subjects.find((s) => s.id === subjectId);
        if (subject) {
          subject.students = subject.students.filter((s) => s.id !== studentId);
        }
      });
  },
});

export const { clearError, setSelectedSubject } = subjectsSlice.actions;
export default subjectsSlice.reducer;

