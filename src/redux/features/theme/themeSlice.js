import { createSlice } from "@reduxjs/toolkit";

// القيمة الافتراضية - دائماً "light" للـ SSR
const initialState = {
  theme: "light", // سيتم تحديثه في useEffect في AppLayout
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      // حفظ في localStorage (يعني أن المستخدم قام بتغييره يدوياً)
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", state.theme);
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      // حفظ في localStorage (يعني أن المستخدم قام بتغييره يدوياً)
      if (typeof window !== "undefined") {
        if (action.payload && action.payload !== "auto") {
          localStorage.setItem("theme", action.payload);
        } else {
          localStorage.removeItem("theme");
        }
      }
    },
    // تحديث theme بدون حفظ في localStorage (للاستخدام مع النظام الافتراضي)
    updateThemeFromSystem: (state, action) => {
      state.theme = action.payload;
      // لا نحفظ في localStorage هنا
    },
  },
});

export const { toggleTheme, setTheme, updateThemeFromSystem } = themeSlice.actions;
export default themeSlice.reducer;












