import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchSupportTickets,
  createSupportTicket,
  fetchSupportTicketById,
  updateSupportTicket,
  patchSupportTicket,
  fetchTicketResponses,
  addTicketResponse,
  fetchSupportStats,
} from "../../../services/supportApi";

/**
 * جلب قائمة طلبات الدعم
 */
export const fetchTicketsAsync = createAsyncThunk(
  "support/fetchTickets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchSupportTickets(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب طلبات الدعم"
      );
    }
  }
);

/**
 * إنشاء طلب دعم جديد
 */
export const createTicketAsync = createAsyncThunk(
  "support/createTicket",
  async (ticketData, { rejectWithValue }) => {
    try {
      const data = await createSupportTicket(ticketData);
      return data;
    } catch (error) {
      let errorMessage = "فشل إنشاء طلب الدعم";
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const errors = error.response.data.errors;
          if (typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = errors;
          }
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * جلب تفاصيل طلب دعم
 */
export const fetchTicketByIdAsync = createAsyncThunk(
  "support/fetchTicketById",
  async (ticketId, { rejectWithValue }) => {
    try {
      const data = await fetchSupportTicketById(ticketId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب تفاصيل الطلب"
      );
    }
  }
);

/**
 * تحديث طلب دعم
 */
export const updateTicketAsync = createAsyncThunk(
  "support/updateTicket",
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const data = await updateSupportTicket(ticketId, ticketData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث الطلب"
      );
    }
  }
);

/**
 * تحديث جزئي لطلب دعم
 */
export const patchTicketAsync = createAsyncThunk(
  "support/patchTicket",
  async ({ ticketId, ticketData }, { rejectWithValue }) => {
    try {
      const data = await patchSupportTicket(ticketId, ticketData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في تحديث الطلب"
      );
    }
  }
);

/**
 * جلب ردود طلب دعم
 */
export const fetchResponsesAsync = createAsyncThunk(
  "support/fetchResponses",
  async (ticketId, { rejectWithValue }) => {
    try {
      const data = await fetchTicketResponses(ticketId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب الردود"
      );
    }
  }
);

/**
 * إضافة رد على طلب دعم
 */
export const addResponseAsync = createAsyncThunk(
  "support/addResponse",
  async ({ ticketId, responseData }, { rejectWithValue }) => {
    try {
      const data = await addTicketResponse(ticketId, responseData);
      return data;
    } catch (error) {
      let errorMessage = "فشل إرسال الرد";
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const errors = error.response.data.errors;
          if (typeof errors === 'object') {
            const firstError = Object.values(errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = errors;
          }
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * جلب إحصائيات طلبات الدعم
 */
export const fetchStatsAsync = createAsyncThunk(
  "support/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchSupportStats();
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || error?.message || "فشل في جلب الإحصائيات"
      );
    }
  }
);

// Initial State
const initialState = {
  tickets: [],
  selectedTicket: null,
  responses: {}, // مخزنة حسب ticketId
  stats: null,
  loading: false,
  loadingSelected: false,
  loadingResponses: false,
  loadingStats: false,
  error: null,
  filters: {
    status: null,
    priority: null,
    category: null,
  },
};

// Slice
const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: null,
        priority: null,
        category: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch Tickets
    builder
      .addCase(fetchTicketsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Ticket
    builder
      .addCase(createTicketAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicketAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.unshift(action.payload); // إضافة في البداية
      })
      .addCase(createTicketAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Ticket By ID
    builder
      .addCase(fetchTicketByIdAsync.pending, (state) => {
        state.loadingSelected = true;
        state.error = null;
      })
      .addCase(fetchTicketByIdAsync.fulfilled, (state, action) => {
        state.loadingSelected = false;
        state.selectedTicket = action.payload;
      })
      .addCase(fetchTicketByIdAsync.rejected, (state, action) => {
        state.loadingSelected = false;
        state.error = action.payload;
      });

    // Update Ticket
    builder
      .addCase(updateTicketAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.selectedTicket?.id === action.payload.id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateTicketAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Patch Ticket
    builder
      .addCase(patchTicketAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(patchTicketAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.selectedTicket?.id === action.payload.id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(patchTicketAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Responses
    builder
      .addCase(fetchResponsesAsync.pending, (state) => {
        state.loadingResponses = true;
        state.error = null;
      })
      .addCase(fetchResponsesAsync.fulfilled, (state, action) => {
        state.loadingResponses = false;
        const ticketId = action.meta.arg;
        state.responses[ticketId] = action.payload;
      })
      .addCase(fetchResponsesAsync.rejected, (state, action) => {
        state.loadingResponses = false;
        state.error = action.payload;
      });

    // Add Response
    builder
      .addCase(addResponseAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addResponseAsync.fulfilled, (state, action) => {
        state.loading = false;
        const ticketId = action.meta.arg.ticketId;
        if (!state.responses[ticketId]) {
          state.responses[ticketId] = [];
        }
        state.responses[ticketId].push(action.payload);
        
        // تحديث selectedTicket إذا كان موجود
        if (state.selectedTicket?.id === ticketId) {
          if (!state.selectedTicket.responses) {
            state.selectedTicket.responses = [];
          }
          state.selectedTicket.responses.push(action.payload);
        }
      })
      .addCase(addResponseAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Stats
    builder
      .addCase(fetchStatsAsync.pending, (state) => {
        state.loadingStats = true;
        state.error = null;
      })
      .addCase(fetchStatsAsync.fulfilled, (state, action) => {
        state.loadingStats = false;
        state.stats = action.payload;
      })
      .addCase(fetchStatsAsync.rejected, (state, action) => {
        state.loadingStats = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedTicket, setFilters, clearFilters } =
  supportSlice.actions;
export default supportSlice.reducer;















