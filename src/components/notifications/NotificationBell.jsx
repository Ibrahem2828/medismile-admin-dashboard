"use client";

import { Bell } from "lucide-react";

/**
 * 🔕 مكون جرس الإشعارات - معلق مؤقتاً
 * سيتم ربطه بـ API جديد قريباً
 */
export default function NotificationBell() {
  // 🔕 معلق مؤقتاً - سيتم إعادة كتابته عند ربط API جديد
  
  return (
    <button
      className="relative p-2 rounded-lg bg-white dark:bg-dark-light border border-slate-200 dark:border-dark-lighter
        hover:bg-slate-50 dark:hover:bg-dark-lighter text-slate-700 dark:text-slate-300 
        focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:focus:ring-sky-400/20 
        transition-colors opacity-50 cursor-not-allowed"
      aria-label="الإشعارات"
      disabled
      title="الإشعارات معلقة مؤقتاً - سيتم ربطها بـ API جديد قريباً"
    >
      <Bell size={18} />
    </button>
  );
}
