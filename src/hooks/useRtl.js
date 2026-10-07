// src/hooks/useRtl.js
"use client";
import { useEffect, useState } from "react";
import i18n from "../i18n"; // تأكد أن مسار ملف i18n صحيح

export function useRtl() {
  const [isRtl, setIsRtl] = useState(i18n.language === "ar");

  useEffect(() => {
    const handleChange = () => {
      const rtl = i18n.language === "ar";
      setIsRtl(rtl);
      document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", i18n.language);
    };

    handleChange(); // عند التحميل
    i18n.on("languageChanged", handleChange);
    return () => i18n.off("languageChanged", handleChange);
  }, []);

  return isRtl;
}
