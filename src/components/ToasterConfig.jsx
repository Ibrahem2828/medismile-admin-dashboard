"use client";

import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";

export default function ToasterConfig() {
  const theme = useSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "",
        duration: 4000,
        style: {
          background: isDark ? "#1e293b" : "#ffffff", // dark-light : white
          color: isDark ? "#e0f2fe" : "#0f172a", // sky-100 : dark
          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", // dark-lighter : slate-200
          borderRadius: "0.75rem",
          padding: "16px",
          boxShadow: isDark
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        success: {
          iconTheme: {
            primary: "#10b981", // green-500
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
          style: {
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#6ee7b7" : "#059669", // green-300 : green-600
            border: isDark ? "1px solid #065f46" : "1px solid #10b981",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
          style: {
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#fca5a5" : "#dc2626", // red-300 : red-600
            border: isDark ? "1px solid #991b1b" : "1px solid #ef4444",
          },
        },
        loading: {
          iconTheme: {
            primary: "#0ea5e9", // sky-500
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
          style: {
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#7dd3fc" : "#0284c7", // sky-300 : sky-600
            border: isDark ? "1px solid #075985" : "1px solid #0ea5e9",
          },
        },
      }}
    />
  );
}

