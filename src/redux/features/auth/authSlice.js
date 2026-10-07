import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../services/api";

// Async Thunks
/**
 * تسجيل الدخول
 * POST /api/accounts/login/university-admin/
 * 
 * حسب التوثيق:
 * - البيانات المرسلة: { "email": "...", "password": "..." }
 * - الاستجابة الناجحة (200): {
 *     "status": "success",
 *     "message": "تم تسجيل الدخول بنجاح.",
 *     "data": {
 *       "tokens": { "access": "...", "refresh": "..." },
 *       "user": { "id": "...", "email": "...", "role": "...", ... }
 *     }
 *   }
 * - الأخطاء: 400 (بيانات غير صحيحة أو حساب غير مفعل)
 */
export const loginAsync = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // إرسال الطلب حسب التوثيق
      const response = await apiClient.post("/accounts/login/university-admin/", {
        email,
        password,
      });

      // التحقق من صيغة الاستجابة حسب التوثيق
      // الصيغة المتوقعة: { status: "success", message: "...", data: { tokens: {...}, user: {...} } }
      if (!response.data) {
        throw new Error("استجابة غير صحيحة من الخادم");
      }

      // معالجة مرنة للصيغ المختلفة
      let tokens, user;
      
      // الصيغة 1: { status: "success", data: { tokens: {...}, user: {...} } }
      if (response.data.data && response.data.data.tokens && response.data.data.user) {
        tokens = response.data.data.tokens;
        user = response.data.data.user;
      }
      // الصيغة 2: { tokens: {...}, user: {...} } (مباشرة في response.data)
      else if (response.data.tokens && response.data.user) {
        tokens = response.data.tokens;
        user = response.data.user;
      }
      // الصيغة 3: { data: { tokens: {...}, user: {...} } } (بدون status)
      else if (response.data.data) {
        if (response.data.data.tokens && response.data.data.user) {
          tokens = response.data.data.tokens;
          user = response.data.data.user;
        } else {
          // Debug: طباعة الاستجابة الفعلية
          if (process.env.NODE_ENV === "development") {
            console.log("🔍 Login API Response:", JSON.stringify(response.data, null, 2));
          }
          throw new Error("بيانات المستخدم غير متوفرة في الاستجابة");
        }
      } else {
        // Debug: طباعة الاستجابة الفعلية
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Login API Response:", JSON.stringify(response.data, null, 2));
        }
        throw new Error("بيانات المستخدم غير متوفرة في الاستجابة");
      }

      // التحقق من وجود tokens و user
      if (!tokens || !tokens.access || !tokens.refresh) {
        throw new Error("Tokens غير متوفرة في الاستجابة");
      }

      if (!user || !user.id) {
        throw new Error("بيانات المستخدم غير مكتملة");
      }

      // حفظ tokens في localStorage
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);

      // إذا كان المستخدم مسؤول جامعة، نجلب Profile للحصول على university_id
      if (user.role === "university_admin" || user.role === "college_admin") {
        try {
          // جلب Profile من API
          // نستخدم access_token مباشرة (تم حفظه للتو)
          const profileResponse = await apiClient.get(
            `/accounts/me/university-admin/`,
            {
              headers: {
                Authorization: `Bearer ${tokens.access}`,
              },
            }
          );
          
          const profile = profileResponse.data?.data || profileResponse.data;
          
          // استخراج university_id من Profile
          // قد يكون university object أو university_id مباشرة
          let universityId = null;
          if (profile?.university) {
            if (typeof profile.university === 'object') {
              universityId = profile.university.id || profile.university;
            } else {
              universityId = profile.university;
            }
          } else if (profile?.university_id) {
            universityId = profile.university_id;
          }
          
          // إضافة university_id إلى user object
          if (universityId) {
            user.university_id = universityId;
            user.university = universityId; // للتوافق مع الكود الحالي
          }
          
          if (process.env.NODE_ENV === "development") {
            console.log("✅ University ID fetched from profile:", universityId);
          }
        } catch (profileError) {
          // إذا فشل جلب Profile، نتابع بدون university_id
          // (قد لا يكون Profile موجوداً بعد أو هناك خطأ في API)
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Could not fetch university profile:", profileError);
          }
        }
      }

      // حفظ user (مع university_id إذا كان موجوداً) في localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // إرسال event لتحديث المكونات
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-login"));
      }

      return { tokens, user };
    } catch (error) {
      // معالجة الأخطاء حسب صيغة API الموحدة
      let errorMessage = "فشل تسجيل الدخول";
      
      if (error.response?.data) {
        // صيغة API الموحدة: { status: "error", message: "...", errors: {...} }
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = Array.isArray(error.response.data.non_field_errors) 
            ? error.response.data.non_field_errors[0] 
            : error.response.data.non_field_errors;
        } else if (error.response.data.errors) {
          // معالجة errors object
          const errors = error.response.data.errors;
          if (typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = errors;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * تسجيل الخروج
 * POST /api/accounts/logout/university-admin/
 * 
 * حسب التوثيق:
 * - Headers: Authorization: Bearer <access_token> (يتم إضافتها تلقائياً من apiClient)
 * - البيانات المرسلة: { "refresh": "..." }
 * - الاستجابة الناجحة (205): {
 *     "status": "success",
 *     "message": "تم تسجيل الخروج."
 *   }
 * - الأخطاء: 400 (Token غير صالح), 401 (غير مصرح)
 */
export const logoutAsync = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    const refreshToken = localStorage.getItem("refresh_token");
    
    // محاولة تسجيل الخروج من API
    if (refreshToken) {
      try {
        const response = await apiClient.post("/accounts/logout/university-admin/", {
          refresh: refreshToken,
        });

        // التحقق من صيغة الاستجابة حسب التوثيق
        // الصيغة المتوقعة: { status: "success", message: "..." }
        if (response.data && response.data.status === "success") {
          console.log("✅ Logout API success:", response.data.message);
        } else {
          console.warn("⚠️ Logout API response format unexpected:", response.data);
        }
      } catch (error) {
        // معالجة الأخطاء حسب التوثيق
        // 400: Token غير صالح
        // 401: غير مصرح (لم يتم تسجيل الدخول)
        if (error.response?.status === 400) {
          console.warn("⚠️ Logout API: Invalid refresh token");
        } else if (error.response?.status === 401) {
          console.warn("⚠️ Logout API: Unauthorized");
        } else {
          console.warn("⚠️ Logout API error:", error.response?.status || error.message);
        }
        // لا نرمي خطأ هنا - نكمل عملية التنظيف المحلية دائماً
      }
    }

    // تنظيف localStorage دائماً (حتى لو فشل API)
    // هذا مهم لضمان تسجيل الخروج حتى لو كان هناك مشكلة في API
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      // إرسال event لتحديث المكونات
      window.dispatchEvent(new Event("user-logout"));
    }

    // نعيد success دائماً لأننا نظفنا المحلي بنجاح
    return { success: true, message: "تم تسجيل الخروج بنجاح" };
  }
);

export const registerSupervisorAsync = createAsyncThunk(
  "auth/registerSupervisor",
  async (
    {
      username,
      email,
      first_name,
      last_name,
      university,
      university_name,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post("/accounts/create/supervisor/", {
        email,
        username,
        first_name,
        last_name,
        university,
        university_name,
      });

      return response.data?.data || response.data;
    } catch (error) {
      // معالجة أفضل للأخطاء
      let errorMessage = "فشل إنشاء الحساب";
      
      if (error.response?.data) {
        // إذا كان هناك رسالة مباشرة
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        // إذا كان هناك أخطاء في الحقول
        else if (error.response.data.errors) {
          const errors = error.response.data.errors;
          if (typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = errors;
          }
        }
        // إذا كان هناك تفاصيل
        else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
        // إذا كان هناك قائمة أخطاء
        else if (Array.isArray(error.response.data)) {
          errorMessage = error.response.data.map(err => 
            typeof err === 'string' ? err : Object.values(err)[0]
          ).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerCollegeAdminAsync = createAsyncThunk(
  "auth/registerCollegeAdmin",
  async (
    {
      username,
      email,
      password,
      password_confirm,
      first_name,
      last_name,
      university_id,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(
        "/accounts/university-admins/create/",
        {
          username,
          email,
          password,
          password_confirm,
          first_name,
          last_name,
          university_id,
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "فشل إنشاء الحساب"
      );
    }
  }
);

export const refreshTokenAsync = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await apiClient.post("/token/refresh/", {
        refresh: refreshToken,
      });

      const newAccessToken = response.data.access;
      localStorage.setItem("access_token", newAccessToken);

      return newAccessToken;
    } catch (error) {
      // إذا فشل refresh، ننظف كل شيء
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("user-logout"));
      
      return rejectWithValue("فشل تجديد الـ token");
    }
  }
);

// Initial State
const initialState = {
  user: null,
  tokens: {
    access: null,
    refresh: null,
  },
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.tokens = { access: null, refresh: null };
      state.isAuthenticated = false;
      state.error = null;
    },
    setTokens: (state, action) => {
      state.tokens = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.tokens = { access: null, refresh: null };
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        // حتى لو رُفض، ننظف state لأن التنظيف المحلي تم في logoutAsync
        state.loading = false;
        state.user = null;
        state.tokens = { access: null, refresh: null };
        state.isAuthenticated = false;
        // لا نعرض خطأ للمستخدم لأن التنظيف المحلي نجح
        state.error = null;
      });

    // Register Supervisor
    builder
      .addCase(registerSupervisorAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerSupervisorAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerSupervisorAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register College Admin
    builder
      .addCase(registerCollegeAdminAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerCollegeAdminAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerCollegeAdminAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Refresh Token
    builder
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.tokens.access = action.payload;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.user = null;
        state.tokens = { access: null, refresh: null };
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearAuth, setTokens } = authSlice.actions;
export default authSlice.reducer;

