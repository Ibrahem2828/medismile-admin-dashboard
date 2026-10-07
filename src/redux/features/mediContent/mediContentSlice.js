import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchCommunityContent,
  fetchCommunityContentById,
  createCommunityContent,
  updateCommunityContent,
  deleteCommunityContent,
  fetchApprovals,
  fetchPendingContent, // @deprecated - للتوافق مع الكود القديم
  approveContent,
  rejectContent,
  fetchContentComments,
  addComment,
  toggleLike,
  fetchTrendingContent,
} from "../../../services/communityApi";

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
const mapContentFromApi = (apiContent) => {
  if (!apiContent) {
    return null;
  }
  
  // Helper function لمعالجة null/undefined
  const safeValue = (value, defaultValue = null) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };
  
  // محاولة استخراج اسم الكاتب بشكل ذكي
  const resolvedAuthorName =
    // لو الـ API يرسل اسم جاهز في أحد هذه الحقول نستخدمه أولاً
    safeValue(
      apiContent.author_name ||
        apiContent.author_full_name ||
        apiContent.author_fullname ||
        apiContent.author_display,
      null
    ) ||
    // وإلا نستخدم الدالة التي تحاول بناء الاسم من الـ object
    getUserName(apiContent.author);

  return {
    id: safeValue(apiContent.id),
    title: safeValue(apiContent.title, ""),
    description: safeValue(apiContent.description, ""),
    content: safeValue(apiContent.content, ""),
    content_type: safeValue(apiContent.content_type, ""),
    category: safeValue(apiContent.category, ""),
    url: safeValue(apiContent.url, ""),
    file: safeValue(apiContent.file, ""),
    file_url: safeValue(apiContent.file_url || apiContent.file, ""),
    is_featured: safeValue(apiContent.is_featured, false),
    is_public: safeValue(apiContent.is_public, false),
    is_deleted: safeValue(apiContent.is_deleted, false),
    status: safeValue(apiContent.status, "pending"),
    tags: safeValue(apiContent.tags, ""),
    // معلومات المستخدم (nested User object)
    author: safeValue(apiContent.author, null),
    author_name: resolvedAuthorName,
    author_id: apiContent.author?.id || apiContent.author_id || null,
    // معلومات الموافقة
    approved_by: safeValue(apiContent.approved_by, null),
    approved_by_name: apiContent.approved_by_name || getUserName(apiContent.approved_by),
    rejection_reason: safeValue(apiContent.rejection_reason, ""),
    approved_at: safeValue(apiContent.approved_at),
    // معلومات الجامعة
    university: safeValue(apiContent.university, null),
    university_id: apiContent.university?.id || apiContent.university_id || null,
    university_name: safeValue(apiContent.university_name, ""),
    // إحصائيات
    likes_count: safeValue(apiContent.likes_count, 0),
    comments_count: safeValue(apiContent.comments_count, 0),
    view_count: safeValue(apiContent.view_count, 0),
    is_liked: safeValue(apiContent.is_liked, false),
    // الحقول التاريخية
    created_at: safeValue(apiContent.created_at),
    updated_at: safeValue(apiContent.updated_at),
  };
};

/**
 * جلب قائمة المحتوى
 */
export const fetchCommunityContentAsync = createAsyncThunk(
  "mediContent/fetchCommunityContent",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchCommunityContent(params);
      // تحويل كل محتوى باستخدام دالة mapping
      if (Array.isArray(data)) {
        return data.map(mapContentFromApi).filter(Boolean);
      }
      return [];
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المحتوى"
      );
    }
  }
);

/**
 * جلب محتوى محدد
 */
export const fetchCommunityContentByIdAsync = createAsyncThunk(
  "mediContent/fetchCommunityContentById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await fetchCommunityContentById(id);
      return mapContentFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المحتوى"
      );
    }
  }
);

/**
 * إنشاء محتوى جديد
 */
export const createCommunityContentAsync = createAsyncThunk(
  "mediContent/createCommunityContent",
  async (contentData, { rejectWithValue }) => {
    try {
      const data = await createCommunityContent(contentData);
      return mapContentFromApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إنشاء المحتوى"
      );
    }
  }
);

/**
 * تحديث محتوى
 */
export const updateCommunityContentAsync = createAsyncThunk(
  "mediContent/updateCommunityContent",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await updateCommunityContent(id, data);
      return mapContentFromApi(updated);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث المحتوى"
      );
    }
  }
);

/**
 * حذف محتوى
 */
export const deleteCommunityContentAsync = createAsyncThunk(
  "mediContent/deleteCommunityContent",
  async (id, { rejectWithValue }) => {
    try {
      await deleteCommunityContent(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في حذف المحتوى"
      );
    }
  }
);

/**
 * جلب الموافقات والرفض
 * GET /api/community/approvals/
 */
export const fetchApprovalsAsync = createAsyncThunk(
  "mediContent/fetchApprovals",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchApprovals(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب الموافقات والرفض"
      );
    }
  }
);

/**
 * @deprecated استخدم fetchApprovalsAsync بدلاً منها
 * جلب المنشورات المعلقة (قديم)
 */
export const fetchPendingContentAsync = createAsyncThunk(
  "mediContent/fetchPendingContent",
  async (_, { rejectWithValue }) => {
    try {
      // استخدام الـ endpoint الجديد مع فلترة pending
      const data = await fetchApprovals({ status: "pending" });
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المنشورات المعلقة"
      );
    }
  }
);

/**
 * الموافقة على منشور
 */
export const approveContentAsync = createAsyncThunk(
  "mediContent/approveContent",
  async ({ contentId, userId }, { rejectWithValue }) => {
    try {
      const data = await approveContent(contentId, userId);
      return { contentId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في الموافقة على المنشور"
      );
    }
  }
);

/**
 * رفض منشور
 */
export const rejectContentAsync = createAsyncThunk(
  "mediContent/rejectContent",
  async ({ contentId, userId, rejectionReason }, { rejectWithValue }) => {
    try {
      const data = await rejectContent(contentId, userId, rejectionReason);
      return { contentId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في رفض المنشور"
      );
    }
  }
);

/**
 * جلب تعليقات محتوى
 */
export const fetchContentCommentsAsync = createAsyncThunk(
  "mediContent/fetchContentComments",
  async (contentId, { rejectWithValue }) => {
    try {
      const data = await fetchContentComments(contentId);
      return { contentId, comments: data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب التعليقات"
      );
    }
  }
);

/**
 * إضافة تعليق
 */
export const addCommentAsync = createAsyncThunk(
  "mediContent/addComment",
  async ({ contentId, commentData }, { rejectWithValue }) => {
    try {
      const data = await addComment(contentId, commentData);
      return { contentId, comment: data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في إضافة التعليق"
      );
    }
  }
);

/**
 * إعجاب أو إلغاء إعجاب
 */
export const toggleLikeAsync = createAsyncThunk(
  "mediContent/toggleLike",
  async ({ contentId, userId }, { rejectWithValue }) => {
    try {
      const data = await toggleLike(contentId, userId);
      return { contentId, data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث الإعجاب"
      );
    }
  }
);

/**
 * جلب المحتوى الرائج
 */
export const fetchTrendingContentAsync = createAsyncThunk(
  "mediContent/fetchTrendingContent",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchTrendingContent();
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب المحتوى الرائج"
      );
    }
  }
);

const initialState = {
  // قائمة المحتوى
  content: [],
  // المحتوى المحدد
  selectedContent: null,
  // المنشورات المعلقة (قديم - للتوافق)
  pendingContent: [],
  // الموافقات والرفض
  approvals: [],
  // المحتوى الرائج
  trendingContent: [],
  // التعليقات (مخزنة حسب contentId)
  comments: {},
  // حالة التحميل
  loading: false,
  // حالة التحميل للمحتوى المحدد
  loadingSelected: false,
  // حالة التحميل للمحتوى المعلق
  loadingPending: false,
  // الأخطاء
  error: null,
  // معاملات البحث
  filters: {
    type: null,
    category: null,
    university: null,
    featured: null,
    status: null,
    order_by: null,
  },
};

const mediContentSlice = createSlice({
  name: "mediContent",
  initialState,
  reducers: {
    // مسح الخطأ
    clearError: (state) => {
      state.error = null;
    },
    // مسح المحتوى المحدد
    clearSelectedContent: (state) => {
      state.selectedContent = null;
    },
    // تحديث الفلاتر
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // مسح الفلاتر
    clearFilters: (state) => {
      state.filters = {
        type: null,
        category: null,
        university: null,
        featured: null,
        status: null,
        order_by: null,
      };
    },
    // تحديث محتوى في القائمة (بعد تحديث أو حذف)
    updateContentInList: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.content.findIndex((item) => item.id === id);
      if (index !== -1) {
        state.content[index] = { ...state.content[index], ...updates };
      }
    },
    // حذف محتوى من القائمة
    removeContentFromList: (state, action) => {
      state.content = state.content.filter((item) => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // جلب قائمة المحتوى
      .addCase(fetchCommunityContentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunityContentAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.content = action.payload || [];
        state.error = null;
      })
      .addCase(fetchCommunityContentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء جلب المحتوى";
        state.content = [];
      })
      // جلب محتوى محدد
      .addCase(fetchCommunityContentByIdAsync.pending, (state) => {
        state.loadingSelected = true;
        state.error = null;
      })
      .addCase(fetchCommunityContentByIdAsync.fulfilled, (state, action) => {
        state.loadingSelected = false;
        state.selectedContent = action.payload;
        state.error = null;
      })
      .addCase(fetchCommunityContentByIdAsync.rejected, (state, action) => {
        state.loadingSelected = false;
        state.error = action.payload || "حدث خطأ أثناء جلب المحتوى";
        state.selectedContent = null;
      })
      // إنشاء محتوى جديد
      .addCase(createCommunityContentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCommunityContentAsync.fulfilled, (state, action) => {
        state.loading = false;
        // إضافة المحتوى الجديد للقائمة
        if (action.payload) {
          state.content.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(createCommunityContentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء إنشاء المحتوى";
      })
      // تحديث محتوى
      .addCase(updateCommunityContentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCommunityContentAsync.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        // تحديث في القائمة
        const index = state.content.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.content[index] = updated;
        }
        // تحديث المحتوى المحدد إذا كان نفسه
        if (state.selectedContent?.id === updated.id) {
          state.selectedContent = updated;
        }
        state.error = null;
      })
      .addCase(updateCommunityContentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء تحديث المحتوى";
      })
      // حذف محتوى
      .addCase(deleteCommunityContentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCommunityContentAsync.fulfilled, (state, action) => {
        state.loading = false;
        // حذف من القائمة
        state.content = state.content.filter((item) => item.id !== action.payload);
        // مسح المحتوى المحدد إذا كان المحذوف
        if (state.selectedContent?.id === action.payload) {
          state.selectedContent = null;
        }
        state.error = null;
      })
      .addCase(deleteCommunityContentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "حدث خطأ أثناء حذف المحتوى";
      })
      // جلب الموافقات والرفض
      .addCase(fetchApprovalsAsync.pending, (state) => {
        state.loadingPending = true;
        state.error = null;
      })
      .addCase(fetchApprovalsAsync.fulfilled, (state, action) => {
        state.loadingPending = false;
        // حفظ الموافقات والرفض
        if (Array.isArray(action.payload)) {
          state.approvals = action.payload;
        } else {
          state.approvals = [];
        }
        state.error = null;
      })
      .addCase(fetchApprovalsAsync.rejected, (state, action) => {
        state.loadingPending = false;
        state.error = action.payload || "حدث خطأ أثناء جلب الموافقات والرفض";
        state.approvals = [];
      })
      // جلب المنشورات المعلقة (قديم - للتوافق)
      .addCase(fetchPendingContentAsync.pending, (state) => {
        state.loadingPending = true;
        state.error = null;
      })
      .addCase(fetchPendingContentAsync.fulfilled, (state, action) => {
        state.loadingPending = false;
        // تحويل كل محتوى معلق باستخدام دالة mapping
        if (Array.isArray(action.payload)) {
          state.pendingContent = action.payload.map(mapContentFromApi).filter(Boolean);
        } else {
          state.pendingContent = [];
        }
        state.error = null;
      })
      .addCase(fetchPendingContentAsync.rejected, (state, action) => {
        state.loadingPending = false;
        state.error = action.payload || "حدث خطأ أثناء جلب المنشورات المعلقة";
        state.pendingContent = [];
      })
      // الموافقة على منشور
      .addCase(approveContentAsync.pending, (state) => {
        state.loadingPending = true;
        state.error = null;
      })
      .addCase(approveContentAsync.fulfilled, (state, action) => {
        state.loadingPending = false;
        const { contentId } = action.payload;
        // حذف من قائمة المعلقة
        state.pendingContent = state.pendingContent.filter(
          (item) => item.id !== contentId
        );
        // تحديث في القائمة الرئيسية إذا كان موجود
        const index = state.content.findIndex((item) => item.id === contentId);
        if (index !== -1) {
          state.content[index].status = "approved";
        }
        state.error = null;
      })
      .addCase(approveContentAsync.rejected, (state, action) => {
        state.loadingPending = false;
        state.error = action.payload || "حدث خطأ أثناء الموافقة على المنشور";
      })
      // رفض منشور
      .addCase(rejectContentAsync.pending, (state) => {
        state.loadingPending = true;
        state.error = null;
      })
      .addCase(rejectContentAsync.fulfilled, (state, action) => {
        state.loadingPending = false;
        const { contentId } = action.payload;
        // حذف من قائمة المعلقة
        state.pendingContent = state.pendingContent.filter(
          (item) => item.id !== contentId
        );
        // تحديث في القائمة الرئيسية إذا كان موجود
        const index = state.content.findIndex((item) => item.id === contentId);
        if (index !== -1) {
          state.content[index].status = "rejected";
        }
        state.error = null;
      })
      .addCase(rejectContentAsync.rejected, (state, action) => {
        state.loadingPending = false;
        state.error = action.payload || "حدث خطأ أثناء رفض المنشور";
      })
      // جلب التعليقات
      .addCase(fetchContentCommentsAsync.fulfilled, (state, action) => {
        const { contentId, comments } = action.payload;
        state.comments[contentId] = comments;
      })
      // إضافة تعليق
      .addCase(addCommentAsync.fulfilled, (state, action) => {
        const { contentId, comment } = action.payload;
        if (!state.comments[contentId]) {
          state.comments[contentId] = [];
        }
        state.comments[contentId].push(comment);
      })
      // إعجاب/إلغاء إعجاب
      .addCase(toggleLikeAsync.fulfilled, (state, action) => {
        const { contentId, data } = action.payload;
        // تحديث في القائمة
        const index = state.content.findIndex((item) => item.id === contentId);
        if (index !== -1) {
          state.content[index].is_liked = data.liked;
          if (data.liked) {
            state.content[index].likes_count = (state.content[index].likes_count || 0) + 1;
          } else {
            state.content[index].likes_count = Math.max(
              (state.content[index].likes_count || 1) - 1,
              0
            );
          }
        }
        // تحديث المحتوى المحدد
        if (state.selectedContent?.id === contentId) {
          state.selectedContent.is_liked = data.liked;
          if (data.liked) {
            state.selectedContent.likes_count = (state.selectedContent.likes_count || 0) + 1;
          } else {
            state.selectedContent.likes_count = Math.max(
              (state.selectedContent.likes_count || 1) - 1,
              0
            );
          }
        }
      })
      // جلب المحتوى الرائج
      .addCase(fetchTrendingContentAsync.fulfilled, (state, action) => {
        state.trendingContent = action.payload || [];
      });
  },
});

export const {
  clearError,
  clearSelectedContent,
  setFilters,
  clearFilters,
  updateContentInList,
  removeContentFromList,
} = mediContentSlice.actions;

export default mediContentSlice.reducer;
