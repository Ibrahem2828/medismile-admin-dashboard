"use client";

import { useSelector, useDispatch } from "react-redux";
import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "../redux/features/theme/themeSlice";
import { motion } from "framer-motion";

export default function ToggleTheme() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);

  const handleToggle = () => {
    // تطبيق التغيير فوراً قبل تحديث Redux
    const newTheme = theme === "light" ? "dark" : "light";
    const html = document.documentElement;

    if (newTheme === "dark") {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }

    // تحديث Redux
    dispatch(toggleTheme());
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border " +
        "bg-surface text-text-secondary transition-colors " +
        "hover:bg-primary-muted hover:text-primary " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      }
      title={theme === "light" ? "تفعيل الوضع الليلي" : "تفعيل الوضع النهاري"}
      aria-label={
        theme === "light" ? "تفعيل الوضع الليلي" : "تفعيل الوضع النهاري"
      }
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </motion.button>
  );
}
