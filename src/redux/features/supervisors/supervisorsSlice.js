import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchSupervisors,
  createSupervisor,
  fetchSupervisorById,
  updateSupervisor,
  deleteSupervisor,
} from "../../../services/supervisorsApi";

/**
 * دالة مساعدة لاستخراج الاسم الكامل من User object
 */
const getFullName = (supervisor) => {
  if (!supervisor) return "-";
  
  const firstName = supervisor.first_name || "";
  const lastName = supervisor.last_name || "";
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (supervisor.username) return supervisor.username;
  
  // إذا لم يكن هناك اسم، نستخدم جزء من الإيميل
  if (supervisor.email) {
    const emailPart = supervisor.email.split("@")[0];
    return emailPart;
  }
  
  return "-";
};

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 */
const mapSupervisorFromApi = (apiSupervisor) => {
  if (!apiSupervisor) {
    return null;
  }
  
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  return {
    id: safeValue(apiSupervisor.user_id || apiSupervisor.id),
    user_id: safeValue(apiSupervisor.user_id || apiSupervisor.id),
    supervisorName: getFullName(apiSupervisor),
    email: safeValue(apiSupervisor.email, ""),
    phone_number: safeValue(apiSupervisor.phone_number, ""),
    university: safeValue(apiSupervisor.university_name, ""),
    department: safeValue(apiSupervisor.department, ""),
    position: safeValue(apiSupervisor.position, ""),
    licenseNumber: safeValue(apiSupervisor.license_number, ""),
    first_name: safeValue(apiSupervisor.first_name, ""),
    last_name: safeValue(apiSupervisor.last_name, ""),
    username: safeValue(apiSupervisor.username, ""),
    _apiData: {
      user_id: safeValue(apiSupervisor.user_id || apiSupervisor.id),
      first_name: safeValue(apiSupervisor.first_name, ""),
      last_name: safeValue(apiSupervisor.last_name, ""),
      username: safeValue(apiSupervisor.username, ""),
      email: safeValue(apiSupervisor.email, ""),
      phone_number: safeValue(apiSupervisor.phone_number),
      address: safeValue(apiSupervisor.address),
      date_of_birth: safeValue(apiSupervisor.date_of_birth),
      gender: safeValue(apiSupervisor.gender),
      university: safeValue(apiSupervisor.university),
      university_name: safeValue(apiSupervisor.university_name),
      department: safeValue(apiSupervisor.department),
      position: safeValue(apiSupervisor.position),
      license_number: safeValue(apiSupervisor.license_number),
    },
  };
};

/**
 * جلب جميع المشرفين من API
 */
export const fetchSupervisorsAsync = createAsyncThunk(
  "supervisors/fetchSupervisors",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSupervisors();
      
      if (Array.isArray(data)) {
        const mapped = data.map(mapSupervisorFromApi).filter(Boolean);
        return mapped;
      }
      
      return [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المشرفين"
      );
    }
  }
);

/**
 * إنشاء مشرف جديد
 */
export const createSupervisorAsync = createAsyncThunk(
  "supervisors/createSupervisor",
  async (supervisorData, { rejectWithValue }) => {
    try {
      const newSupervisor = await createSupervisor(supervisorData);
      return mapSupervisorFromApi(newSupervisor);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إنشاء المشرف"
      );
    }
  }
);

/**
 * جلب تفاصيل مشرف محدد
 */
export const fetchSupervisorDetailAsync = createAsyncThunk(
  "supervisors/fetchSupervisorDetail",
  async (userId, { rejectWithValue }) => {
    try {
      const data = await fetchSupervisorById(userId);
      return mapSupervisorFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تفاصيل المشرف"
      );
    }
  }
);

/**
 * تحديث مشرف
 */
export const updateSupervisorAsync = createAsyncThunk(
  "supervisors/updateSupervisor",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await updateSupervisor(id, data);
      return mapSupervisorFromApi(updated);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث المشرف"
      );
    }
  }
);

/**
 * حذف مشرف
 */
export const deleteSupervisorAsync = createAsyncThunk(
  "supervisors/deleteSupervisor",
  async (userId, { rejectWithValue }) => {
    try {
      await deleteSupervisor(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في حذف المشرف"
      );
    }
  }
);

const supervisorsSlice = createSlice({
  name: "supervisors",
  initialState: {
    supervisors: [],
    selectedSupervisor: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedSupervisor: (state) => {
      state.selectedSupervisor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب المشرفين
      .addCase(fetchSupervisorsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupervisorsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisors = action.payload || [];
        state.error = null;
      })
      .addCase(fetchSupervisorsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب المشرفين";
        state.supervisors = [];
      })
      // إنشاء مشرف جديد
      .addCase(createSupervisorAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupervisorAsync.fulfilled, (state, action) => {
        state.loading = false;
        const newSupervisor = action.payload;
        if (newSupervisor) {
          state.supervisors.push(newSupervisor);
        }
        state.error = null;
      })
      .addCase(createSupervisorAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء إنشاء المشرف";
      })
      // جلب تفاصيل مشرف
      .addCase(fetchSupervisorDetailAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupervisorDetailAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedSupervisor = action.payload;
        state.error = null;
      })
      .addCase(fetchSupervisorDetailAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب تفاصيل المشرف";
      })
      // تحديث مشرف
      .addCase(updateSupervisorAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSupervisorAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        if (updated) {
          const index = state.supervisors.findIndex((s) => s.id === updated.id);
          if (index !== -1) {
            state.supervisors[index] = updated;
          }
        }
        state.error = null;
      })
      .addCase(updateSupervisorAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تحديث المشرف";
      })
      // حذف مشرف
      .addCase(deleteSupervisorAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSupervisorAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisors = state.supervisors.filter((s) => s.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteSupervisorAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء حذف المشرف";
      });
  },
});

export const { clearError, clearSelectedSupervisor } = supervisorsSlice.actions;

export default supervisorsSlice.reducer;





