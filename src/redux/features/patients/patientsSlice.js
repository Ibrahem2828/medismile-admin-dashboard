import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as patientsApi from "../../../services/patientsApi";

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 * بناءً على PatientListSerializer و PatientDetailSerializer
 */
const mapPatientFromApi = (apiPatient) => {
  if (!apiPatient) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = "") => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  const firstName = safeValue(apiPatient.first_name);
  const lastName = safeValue(apiPatient.last_name);
  const fullName = `${firstName} ${lastName}`.trim() || safeValue(apiPatient.username);
  
  // حساب العمر من تاريخ الميلاد
  let age = "";
  if (apiPatient.date_of_birth) {
    const birthDate = new Date(apiPatient.date_of_birth);
    const today = new Date();
    age = String(today.getFullYear() - birthDate.getFullYear());
  }
  
  return {
    id: safeValue(apiPatient.user_id) || safeValue(apiPatient.id) || "",
    user_id: safeValue(apiPatient.user_id) || safeValue(apiPatient.id) || "",
    // معلومات المستخدم الأساسية (من PatientListSerializer)
    username: safeValue(apiPatient.username),
    email: safeValue(apiPatient.email),
    first_name: firstName,
    last_name: lastName,
    name: fullName,
    // معلومات إضافية من Profile
    phone: safeValue(apiPatient.phone_number),
    phone_number: safeValue(apiPatient.phone_number),
    address: safeValue(apiPatient.address),
    date_of_birth: safeValue(apiPatient.date_of_birth),
    age: age,
    gender: safeValue(apiPatient.gender),
    // حقول إضافية من PatientDetailSerializer
    medical_history: safeValue(apiPatient.medical_history),
    allergies: safeValue(apiPatient.allergies),
    medications: safeValue(apiPatient.medications),
    emergency_contact_name: safeValue(apiPatient.emergency_contact_name),
    emergency_contact_phone: safeValue(apiPatient.emergency_contact_phone),
    profile_picture: safeValue(apiPatient.profile_picture),
    // حقول للتوافق مع الواجهة الحالية
    condition: safeValue(apiPatient.medical_history) || safeValue(apiPatient.condition),
    image: safeValue(apiPatient.profile_picture) || safeValue(apiPatient.image),
  };
};

/**
 * Mapping function لتحويل بيانات Frontend إلى تنسيق API للإنشاء
 * بناءً على PatientCreateSerializer
 */
const mapPatientToApiForCreate = (frontendPatient) => ({
  username: frontendPatient.username || "",
  email: frontendPatient.email || "",
  password: frontendPatient.password || "",
  password_confirm: frontendPatient.password_confirm || frontendPatient.password || "",
  first_name: frontendPatient.first_name || frontendPatient.name?.split(" ")[0] || "",
  last_name: frontendPatient.last_name || frontendPatient.name?.split(" ").slice(1).join(" ") || "",
});

/**
 * Mapping function لتحويل بيانات Frontend إلى تنسيق API للتحديث
 * بناءً على PatientUpdateSerializer
 */
const mapPatientToApiForUpdate = (frontendPatient) => {
  const updateData = {};
  
  // إضافة الحقول فقط إذا كانت موجودة وغير فارغة
  if (frontendPatient.phone_number || frontendPatient.phone) {
    updateData.phone_number = frontendPatient.phone_number || frontendPatient.phone;
  }
  if (frontendPatient.address) {
    updateData.address = frontendPatient.address;
  }
  if (frontendPatient.date_of_birth) {
    updateData.date_of_birth = frontendPatient.date_of_birth;
  }
  if (frontendPatient.gender) {
    updateData.gender = frontendPatient.gender;
  }
  if (frontendPatient.medical_history || frontendPatient.condition) {
    updateData.medical_history = frontendPatient.medical_history || frontendPatient.condition;
  }
  if (frontendPatient.allergies) {
    updateData.allergies = frontendPatient.allergies;
  }
  if (frontendPatient.medications) {
    updateData.medications = frontendPatient.medications;
  }
  if (frontendPatient.emergency_contact_name) {
    updateData.emergency_contact_name = frontendPatient.emergency_contact_name;
  }
  if (frontendPatient.emergency_contact_phone) {
    updateData.emergency_contact_phone = frontendPatient.emergency_contact_phone;
  }
  if (frontendPatient.profile_picture || frontendPatient.image) {
    updateData.profile_picture = frontendPatient.profile_picture || frontendPatient.image;
  }
  
  return updateData;
};

// Async Thunks
export const fetchPatients = createAsyncThunk(
  "patients/fetchPatients",
  async (_, { rejectWithValue }) => {
    try {
      const data = await patientsApi.fetchPatients();
      
      // البيانات تأتي كـ array من PatientListSerializer
      if (Array.isArray(data)) {
        return data.map(mapPatientFromApi).filter(p => p !== null);
      }
      
      return [];
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message || "Unknown error";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  "patients/fetchPatientById",
  async (userId, { rejectWithValue }) => {
    try {
      const data = await patientsApi.fetchPatientById(userId);
      return mapPatientFromApi(data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createPatient = createAsyncThunk(
  "patients/createPatient",
  async (patientData, { rejectWithValue }) => {
    try {
      const apiData = mapPatientToApiForCreate(patientData);
      const response = await patientsApi.createPatient(apiData);
      
      // الاستجابة من API تأتي كـ PatientDetailSerializer
      return mapPatientFromApi(response);
    } catch (error) {
      // استخراج رسالة الخطأ من response
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.errors || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePatient = createAsyncThunk(
  "patients/updatePatient",
  async ({ userId, ...patientData }, { rejectWithValue }) => {
    try {
      const apiData = mapPatientToApiForUpdate(patientData);
      const response = await patientsApi.updatePatient(userId, apiData);
      
      // الاستجابة من API تأتي كـ PatientDetailSerializer
      return mapPatientFromApi(response);
    } catch (error) {
      // استخراج رسالة الخطأ من response
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.errors || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePatient = createAsyncThunk(
  "patients/deletePatient",
  async (userId, { rejectWithValue }) => {
    try {
      await patientsApi.deletePatient(userId);
      return userId;
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData || error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

const patientsSlice = createSlice({
  name: "patients",
  initialState: {
    patients: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPatients
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchPatientById
      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.patients.findIndex((p) => p.id === action.payload.id || p.user_id === action.payload.user_id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        } else {
          state.patients.push(action.payload);
        }
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createPatient
      .addCase(createPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.patients.push(action.payload);
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updatePatient
      .addCase(updatePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.patients.findIndex((p) => p.id === action.payload.id || p.user_id === action.payload.user_id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deletePatient
      .addCase(deletePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = state.patients.filter((p) => p.id !== action.payload && p.user_id !== action.payload);
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = patientsSlice.actions;
export default patientsSlice.reducer;
