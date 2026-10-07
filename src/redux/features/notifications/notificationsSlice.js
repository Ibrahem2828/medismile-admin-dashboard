import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as notificationsApi from "../../../services/notificationsApi";

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
  if (user.name) return user.name;
  if (user.email) return user.email;
  return "-";
};

/**
 * Mapping function لتحويل بيانات API إلى تنسيق مناسب للـ Frontend
 */
const mapNotificationFromApi = (apiNotification) => {
  if (!apiNotification) {
    return null;
  }
  
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  return {
    id: safeValue(apiNotification.id),
    sender: safeValue(apiNotification.sender, null),
    sender_name: getUserName(apiNotification.sender),
    sender_id: apiNotification.sender?.id || apiNotification.sender || null,
    recipient: safeValue(apiNotification.recipient, null),
    recipient_name: getUserName(apiNotification.recipient),
    recipient_id: apiNotification.recipient?.id || apiNotification.recipient || null,
    notification_type: safeValue(apiNotification.notification_type, ""),
    priority: safeValue(apiNotification.priority, "normal"),
    title: safeValue(apiNotification.title, ""),
    message: safeValue(apiNotification.message, ""),
    status: safeValue(apiNotification.status, "pending"),
    is_read: safeValue(apiNotification.is_read, false),
    proposed_changes: safeValue(apiNotification.proposed_changes, null),
    payload: safeValue(apiNotification.payload, null),
    target_type: safeValue(apiNotification.target_type, null),
    target_object_id: safeValue(apiNotification.target_id) || safeValue(apiNotification.target_object_id, null),
    appointment: safeValue(apiNotification.appointment, null),
    appointment_id: apiNotification.appointment?.id || apiNotification.appointment_id || null,
    read_at: safeValue(apiNotification.read_at, null),
    created_at: safeValue(apiNotification.created_at, ""),
    updated_at: safeValue(apiNotification.updated_at, ""),
  };
};

/**
 * جلب جميع الإشعارات
 */
export const fetchNotificationsAsync = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await notificationsApi.fetchNotifications(params);
      const mapped = Array.isArray(data.results) 
        ? data.results.map(mapNotificationFromApi).filter(Boolean)
        : [];
      return {
        notifications: mapped,
        count: data.count || mapped.length,
        next: data.next,
        previous: data.previous,
      };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.detail || error?.message || "فشل في جلب الإشعارات";
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * جلب إشعار محدد
 */
export const fetchNotificationByIdAsync = createAsyncThunk(
  "notifications/fetchNotificationById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await notificationsApi.fetchNotificationById(id);
      return mapNotificationFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب الإشعار"
      );
    }
  }
);

/**
 * تحديث إشعار (حالة/قراءة)
 */
export const updateNotificationAsync = createAsyncThunk(
  "notifications/updateNotification",
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const data = await notificationsApi.updateNotification(id, updateData);
      return mapNotificationFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data?.errors || error?.message || "فشل في تحديث الإشعار"
      );
    }
  }
);

/**
 * إنشاء إشعار جديد
 */
export const createNotificationAsync = createAsyncThunk(
  "notifications/createNotification",
  async (notificationData, { rejectWithValue }) => {
    try {
      const data = await notificationsApi.createNotification(notificationData);
      return mapNotificationFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.response?.data?.errors || error?.message || "فشل في إنشاء الإشعار"
      );
    }
  }
);

const initialState = {
  notifications: [],
  selectedNotification: null,
  loading: false,
  loadingSelected: false,
  error: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
  filters: {
    is_read: null,
    status: null,
  },
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        is_read: null,
        status: null,
      };
    },
    setSelectedNotification: (state, action) => {
      state.selectedNotification = action.payload;
    },
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },
  },
  extraReducers: (builder) => {
    // fetchNotificationsAsync
    builder
      .addCase(fetchNotificationsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchNotificationsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchNotificationByIdAsync
      .addCase(fetchNotificationByIdAsync.pending, (state) => {
        state.loadingSelected = true;
        state.error = null;
      })
      .addCase(fetchNotificationByIdAsync.fulfilled, (state, action) => {
        state.loadingSelected = false;
        state.selectedNotification = action.payload;
      })
      .addCase(fetchNotificationByIdAsync.rejected, (state, action) => {
        state.loadingSelected = false;
        state.error = action.payload;
      })
      // updateNotificationAsync
      .addCase(updateNotificationAsync.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        if (state.selectedNotification?.id === action.payload.id) {
          state.selectedNotification = action.payload;
        }
      })
      // createNotificationAsync
      .addCase(createNotificationAsync.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
        state.pagination.count += 1;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSelectedNotification,
  clearSelectedNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;


