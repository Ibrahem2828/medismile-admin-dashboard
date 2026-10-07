import { createSlice } from "@reduxjs/toolkit";

const treatmentsSlice = createSlice({
  name: "treatments",
  initialState: [],
  reducers: {
    addTreatment: (state, action) => {
      state.push(action.payload);
    },
    updateTreatment: (state, action) => {
      const index = state.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    deleteTreatment: (state, action) => {
      return state.filter((t) => t.id !== action.payload);
    },
  },
});

export const { addTreatment, updateTreatment, deleteTreatment } =
  treatmentsSlice.actions;
export default treatmentsSlice.reducer;
