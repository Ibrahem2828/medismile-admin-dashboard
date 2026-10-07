import { createSlice } from "@reduxjs/toolkit";

const initialState = [
  {
    id: "MS-2024-001",
    student: "فاطمة الزهراء",
    patient: "خالد",
    status: "قيد التقدم",
    progress: 75,
    elapsed: "00:45:30",
  },
  {
    id: "MS-2024-002",
    student: "أحمد كمال",
    patient: "سارة محمود",
    status: "متوقفة مؤقتاً",
    progress: 30,
    elapsed: "00:20:15",
  },
];

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    addSession: (state, action) => {
      state.push(action.payload);
    },
    updateSession: (state, action) => {
      const index = state.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) state[index] = action.payload;
    },
    deleteSession: (state, action) => {
      return state.filter((s) => s.id !== action.payload);
    },
    approveSession: (state, action) => {
      const index = state.findIndex((s) => s.id === action.payload);
      if (index !== -1) {
        state[index].status = "معتمدة";
        state[index].approved = true;
      }
    },
    rejectSession: (state, action) => {
      const index = state.findIndex((s) => s.id === action.payload);
      if (index !== -1) {
        state[index].status = "مرفوضة";
        state[index].rejected = true;
      }
    },
    requestModification: (state, action) => {
      const { sessionId, comments } = action.payload;
      const index = state.findIndex((s) => s.id === sessionId);
      if (index !== -1) {
        state[index].status = "طلب تعديل";
        state[index].modificationRequested = true;
        state[index].modificationComments = comments;
      }
    },
  },
});

export const { 
  addSession, 
  updateSession, 
  deleteSession,
  approveSession,
  rejectSession,
  requestModification,
} = sessionsSlice.actions;
export default sessionsSlice.reducer;
