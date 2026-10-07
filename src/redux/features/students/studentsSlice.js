import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchStudents,
  createStudent as createStudentApi,
  updateStudent as updateStudentApi,
  deleteStudent as deleteStudentApi,
} from "../../../services/studentsApi";

/**
 * دالة مساعدة لاستخراج الاسم الكامل من User object
 */
const getFullName = (student) => {
  if (!student) return "-";
  
  const firstName = student.first_name || "";
  const lastName = student.last_name || "";
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (student.username) return student.username;
  
  // إذا لم يكن هناك اسم، نستخدم جزء من الإيميل
  if (student.email) {
    const emailPart = student.email.split("@")[0];
    return emailPart;
  }
  
  return "-";
};

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 */
const mapStudentFromApi = (apiStudent) => {
  if (!apiStudent) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  return {
    id: safeValue(apiStudent.user_id || apiStudent.id),
    user_id: safeValue(apiStudent.user_id || apiStudent.id),
    // اسم الطالب (من first_name + last_name)
    studentName: getFullName(apiStudent),
    // رقم الطالب
    studentNumber: safeValue(apiStudent.student_id, ""),
    student_id: safeValue(apiStudent.student_id, ""),
    // الجامعة
    university: safeValue(apiStudent.university_name, ""),
    // السنة الدراسية
    year: safeValue(apiStudent.year_of_study) 
      ? `السنة ${apiStudent.year_of_study}` 
      : "",
    year_of_study: safeValue(apiStudent.year_of_study),
    // التخصص
    specialty: safeValue(apiStudent.specialization, ""),
    specialization: safeValue(apiStudent.specialization, ""),
    // البريد الإلكتروني
    email: safeValue(apiStudent.email, ""),
    // رقم الهاتف
    phoneNumber: safeValue(apiStudent.phone_number, ""),
    phone_number: safeValue(apiStudent.phone_number, ""),
    // العنوان
    address: safeValue(apiStudent.address, ""),
    // تاريخ الميلاد
    dateOfBirth: safeValue(apiStudent.date_of_birth, ""),
    date_of_birth: safeValue(apiStudent.date_of_birth, ""),
    // الجنس
    gender: safeValue(apiStudent.gender, ""),
    first_name: safeValue(apiStudent.first_name, ""),
    last_name: safeValue(apiStudent.last_name, ""),
    username: safeValue(apiStudent.username, ""),
    // بيانات API الأصلية (للاستخدام في التحديث)
    _apiData: {
      user_id: safeValue(apiStudent.user_id || apiStudent.id),
      first_name: safeValue(apiStudent.first_name, ""),
      last_name: safeValue(apiStudent.last_name, ""),
      username: safeValue(apiStudent.username, ""),
      email: safeValue(apiStudent.email, ""),
      phone_number: safeValue(apiStudent.phone_number),
      address: safeValue(apiStudent.address),
      date_of_birth: safeValue(apiStudent.date_of_birth),
      gender: safeValue(apiStudent.gender),
      profile_picture: safeValue(apiStudent.profile_picture),
      university: safeValue(apiStudent.university),
      university_name: safeValue(apiStudent.university_name),
      student_id: safeValue(apiStudent.student_id),
      year_of_study: safeValue(apiStudent.year_of_study),
      specialization: safeValue(apiStudent.specialization),
    },
  };
};

/**
 * جلب جميع الطلاب من API
 */
export const fetchStudentsAsync = createAsyncThunk(
  "students/fetchStudents",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchStudents();
      
      // تحويل كل طالب باستخدام دالة mapping
      if (Array.isArray(data)) {
        const mapped = data.map(mapStudentFromApi).filter(Boolean);
        return mapped;
      }
      
      return [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب الطلاب"
      );
    }
  }
);

/**
 * إنشاء طالب جديد
 */
export const createStudentAsync = createAsyncThunk(
  "students/createStudent",
  async (studentData, { rejectWithValue }) => {
    try {
      const newStudent = await createStudentApi(studentData);
      return mapStudentFromApi(newStudent);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إنشاء الطالب"
      );
    }
  }
);

/**
 * تحديث طالب
 */
export const updateStudentAsync = createAsyncThunk(
  "students/updateStudent",
  async ({ userId, studentData }, { rejectWithValue }) => {
    try {
      const updatedStudent = await updateStudentApi(userId, studentData);
      return mapStudentFromApi(updatedStudent);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث الطالب"
      );
    }
  }
);

/**
 * حذف طالب
 */
export const deleteStudentAsync = createAsyncThunk(
  "students/deleteStudent",
  async (userId, { rejectWithValue }) => {
    try {
      await deleteStudentApi(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في حذف الطالب"
      );
    }
  }
);

const studentsSlice = createSlice({
  name: "students",
  initialState: {
    students: [],
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
      // جلب الطلاب
      .addCase(fetchStudentsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload || [];
        state.error = null;
      })
      .addCase(fetchStudentsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب الطلاب";
        state.students = [];
      })
      // إنشاء طالب جديد
      .addCase(createStudentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudentAsync.fulfilled, (state, action) => {
        state.loading = false;
        const newStudent = action.payload;
        if (newStudent) {
          state.students.push(newStudent);
        }
        state.error = null;
      })
      .addCase(createStudentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء إنشاء الطالب";
      })
      // تحديث طالب
      .addCase(updateStudentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStudent = action.payload;
        const index = state.students.findIndex((s) => s.id === updatedStudent.id);
        if (index !== -1) {
          state.students[index] = updatedStudent;
        }
        state.error = null;
      })
      .addCase(updateStudentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تحديث الطالب";
      })
      // حذف طالب
      .addCase(deleteStudentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudentAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.students = state.students.filter((s) => s.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteStudentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء حذف الطالب";
      });
  },
});

export const { clearError } = studentsSlice.actions;

export default studentsSlice.reducer;
