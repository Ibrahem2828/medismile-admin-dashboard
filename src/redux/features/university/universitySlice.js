import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchUniversityDetails,
  updateUniversityDetails,
  fetchFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  fetchPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  fetchAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} from "../../../services/universityApi";

// جلب تفاصيل الجامعة
export const fetchUniversityAsync = createAsyncThunk(
  "university/fetchDetails",
  async (universityId, { rejectWithValue }) => {
    try {
      return await fetchUniversityDetails(universityId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في جلب بيانات الجامعة"
      );
    }
  }
);

// تحديث بيانات الجامعة
export const updateUniversityAsync = createAsyncThunk(
  "university/updateDetails",
  async ({ universityId, payload }, { rejectWithValue }) => {
    try {
      return await updateUniversityDetails(universityId, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في تحديث بيانات الجامعة"
      );
    }
  }
);

// الكليات
export const fetchFacultiesAsync = createAsyncThunk(
  "university/fetchFaculties",
  async (universityId, { rejectWithValue }) => {
    try {
      return await fetchFaculties(universityId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في جلب الكليات"
      );
    }
  }
);

export const createFacultyAsync = createAsyncThunk(
  "university/createFaculty",
  async ({ universityId, payload }, { rejectWithValue }) => {
    try {
      return await createFaculty(universityId, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في إنشاء الكلية"
      );
    }
  }
);

export const updateFacultyAsync = createAsyncThunk(
  "university/updateFaculty",
  async ({ universityId, facultyId, payload }, { rejectWithValue }) => {
    try {
      return await updateFaculty(universityId, facultyId, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في تحديث الكلية"
      );
    }
  }
);

export const deleteFacultyAsync = createAsyncThunk(
  "university/deleteFaculty",
  async ({ universityId, facultyId }, { rejectWithValue }) => {
    try {
      await deleteFaculty(universityId, facultyId);
      return facultyId; // نعيد ID للكلية المحذوفة
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في حذف الكلية"
      );
    }
  }
);

// البرامج
export const fetchProgramsAsync = createAsyncThunk(
  "university/fetchPrograms",
  async (universityId, { rejectWithValue }) => {
    try {
      return await fetchPrograms(universityId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في جلب البرامج الأكاديمية"
      );
    }
  }
);

export const createProgramAsync = createAsyncThunk(
  "university/createProgram",
  async ({ universityId, payload }, { rejectWithValue }) => {
    try {
      // إضافة university إلى payload
      const programPayload = {
        ...payload,
        university: universityId,
      };
      return await createProgram(programPayload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في إنشاء البرنامج الأكاديمي"
      );
    }
  }
);

export const updateProgramAsync = createAsyncThunk(
  "university/updateProgram",
  async ({ universityId, programId, payload }, { rejectWithValue }) => {
    try {
      return await updateProgram(universityId, programId, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في تحديث البرنامج الأكاديمي"
      );
    }
  }
);

export const deleteProgramAsync = createAsyncThunk(
  "university/deleteProgram",
  async ({ universityId, programId }, { rejectWithValue }) => {
    try {
      await deleteProgram(universityId, programId);
      return programId; // نعيد ID للبرنامج المحذوف
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في حذف البرنامج الأكاديمي"
      );
    }
  }
);

// السنوات الأكاديمية
export const fetchAcademicYearsAsync = createAsyncThunk(
  "university/fetchAcademicYears",
  async (universityId, { rejectWithValue }) => {
    try {
      return await fetchAcademicYears(universityId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في جلب السنوات الأكاديمية"
      );
    }
  }
);

export const createAcademicYearAsync = createAsyncThunk(
  "university/createAcademicYear",
  async ({ universityId, payload }, { rejectWithValue }) => {
    try {
      // إضافة university إلى payload
      const yearPayload = {
        ...payload,
        university: universityId,
      };
      return await createAcademicYear(yearPayload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في إنشاء السنة الأكاديمية"
      );
    }
  }
);

export const updateAcademicYearAsync = createAsyncThunk(
  "university/updateAcademicYear",
  async ({ universityId, yearId, payload }, { rejectWithValue }) => {
    try {
      return await updateAcademicYear(universityId, yearId, payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في تحديث السنة الأكاديمية"
      );
    }
  }
);

export const deleteAcademicYearAsync = createAsyncThunk(
  "university/deleteAcademicYear",
  async ({ universityId, yearId }, { rejectWithValue }) => {
    try {
      await deleteAcademicYear(universityId, yearId);
      return yearId; // نعيد ID للسنة المحذوفة
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "فشل في حذف السنة الأكاديمية"
      );
    }
  }
);

const initialState = {
  university: null,
  faculties: [],
  programs: [],
  academicYears: [],
  loading: false,
  error: null,
};

const universitySlice = createSlice({
  name: "university",
  initialState,
  reducers: {
    clearUniversityError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUniversityAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUniversityAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.university = action.payload || null;
      })
      .addCase(fetchUniversityAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.university = null;
      })
      .addCase(updateUniversityAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUniversityAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.university = action.payload || state.university;
      })
      .addCase(updateUniversityAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFacultiesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacultiesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.faculties = action.payload || [];
      })
      .addCase(fetchFacultiesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.faculties = [];
      })
      .addCase(createFacultyAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFacultyAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.faculties.push(action.payload);
        }
      })
      .addCase(createFacultyAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateFacultyAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFacultyAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.faculties.findIndex(
            (f) => f.id === action.payload.id
          );
          if (index !== -1) {
            state.faculties[index] = action.payload;
          }
        }
      })
      .addCase(updateFacultyAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteFacultyAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFacultyAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.faculties = state.faculties.filter(
          (f) => f.id !== action.payload
        );
      })
      .addCase(deleteFacultyAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProgramsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgramsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.programs = action.payload || [];
      })
      .addCase(fetchProgramsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.programs = [];
      })
      .addCase(createProgramAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProgramAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.programs.push(action.payload);
        }
      })
      .addCase(createProgramAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProgramAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProgramAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.programs.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index !== -1) {
            state.programs[index] = action.payload;
          }
        }
      })
      .addCase(updateProgramAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProgramAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProgramAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.programs = state.programs.filter(
          (p) => p.id !== action.payload
        );
      })
      .addCase(deleteProgramAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAcademicYearsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicYearsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload || [];
      })
      .addCase(fetchAcademicYearsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.academicYears = [];
      })
      .addCase(createAcademicYearAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAcademicYearAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.academicYears.push(action.payload);
        }
      })
      .addCase(createAcademicYearAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAcademicYearAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAcademicYearAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const index = state.academicYears.findIndex(
            (y) => y.id === action.payload.id
          );
          if (index !== -1) {
            state.academicYears[index] = action.payload;
          }
        }
      })
      .addCase(updateAcademicYearAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAcademicYearAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAcademicYearAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = state.academicYears.filter(
          (y) => y.id !== action.payload
        );
      })
      .addCase(deleteAcademicYearAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUniversityError } = universitySlice.actions;

export default universitySlice.reducer;







