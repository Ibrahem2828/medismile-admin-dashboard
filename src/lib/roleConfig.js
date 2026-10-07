"use client";

/**
 * إعدادات القوائم والمسارات لمسؤول الجامعة
 * 
 * ملاحظة: هذا المشروع خاص فقط بمسؤول الجامعة (university_admin)
 * تم تبسيط النظام - لا حاجة لنظام صلاحيات معقد
 */

import {
  Home,
  FileText,
  Users,
  Calendar,
  Star,
  HelpCircle,
  Bell,
  Building2,
  GraduationCap,
  School,
  CalendarDays,
  Activity,
  BookOpen,
  Paperclip,
  Search,
} from "lucide-react";

/**
 * قائمة القوائم لمسؤول الجامعة
 */
export const menuItems = [
  {
    name: "الرئيسية",
    nameEn: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "البحث الموحد",
    nameEn: "Unified Search",
    href: "/search",
    icon: Search,
  },
  {
    name: "إدارة المستخدمين",
    nameEn: "User Management",
    href: "/users",
    icon: Users,
    submenu: [
      {
        name: "الطلاب",
        nameEn: "Students",
        href: "/users/students",
        icon: GraduationCap,
      },
      {
        name: "المشرفين",
        nameEn: "Supervisors",
        href: "/users/supervisors",
        icon: Users,
      },
    ],
  },
  {
    name: "البنية الأكاديمية",
    nameEn: "Academic Structure",
    href: "/academic-structure",
    icon: Building2,
    submenu: [
      {
        name: "الجامعات",
        nameEn: "Universities",
        href: "/academic-structure/universities",
        icon: Building2,
      },
      {
        name: "الكليات",
        nameEn: "Faculties",
        href: "/academic-structure/faculties",
        icon: School,
      },
      {
        name: "البرامج الأكاديمية",
        nameEn: "Academic Programs",
        href: "/academic-structure/programs",
        icon: BookOpen,
      },
      {
        name: "السنوات الأكاديمية",
        nameEn: "Academic Years",
        href: "/academic-structure/years",
        icon: CalendarDays,
      },
    ],
  },
  {
    name: "الحالات السريرية",
    nameEn: "Clinical Cases",
    href: "/university-cases",
    icon: FileText,
    readOnly: true, // قراءة فقط
  },
  {
    name: "محتوى المجتمع",
    nameEn: "Community Content",
    href: "/community",
    icon: BookOpen,
    readOnly: true, // قراءة فقط لمسؤول الجامعة
  },
  {
    name: "المواعيد",
    nameEn: "Appointments",
    href: "/university-appointments",
    icon: Calendar,
    readOnly: true, // قراءة فقط
  },
  {
    name: "المرفقات",
    nameEn: "Attachments",
    href: "/university-attachments",
    icon: Paperclip,
    readOnly: true, // قراءة فقط
  },
  {
    name: "التقييمات",
    nameEn: "Evaluations",
    href: "/evaluations",
    icon: Star,
  },
  {
    name: "سجلات التدقيق",
    nameEn: "Audit Logs",
    href: "/audit-logs",
    icon: Activity,
  },
  {
    name: "سجلات موافقة المجتمع",
    nameEn: "Community Approval Logs",
    href: "/community/approval-logs",
    icon: Activity,
    readOnly: true, // قراءة فقط
  },
  {
    name: "التقارير",
    nameEn: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "الإشعارات",
    nameEn: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "الدعم الفني",
    nameEn: "Support",
    href: "/support",
    icon: HelpCircle,
  },
];

/**
 * Dashboard Cards لمسؤول الجامعة
 */
export const dashboardCards = [
  {
    id: "total_students",
    label: "إجمالي الطلاب",
    labelEn: "Total Students",
    value: 0,
    icon: GraduationCap,
    color: "blue",
  },
  {
    id: "total_supervisors",
    label: "إجمالي المشرفين",
    labelEn: "Total Supervisors",
    value: 0,
    icon: Users,
    color: "indigo",
  },
  {
    id: "active_cases",
    label: "الحالات النشطة",
    labelEn: "Active Cases",
    value: 0,
    icon: FileText,
    color: "sky",
  },
  {
    id: "total_evaluations",
    label: "إجمالي التقييمات",
    labelEn: "Total Evaluations",
    value: 0,
    icon: Star,
    color: "amber",
  },
];

/**
 * Quick Actions لمسؤول الجامعة
 */
export const quickActions = [
  {
    name: "إضافة طالب",
    nameEn: "Add Student",
    href: "/users/students?action=create",
    icon: GraduationCap,
  },
  {
    name: "إضافة مشرف",
    nameEn: "Add Supervisor",
    href: "/users/supervisors?action=create",
    icon: Users,
  },
  {
    name: "إدارة البنية الأكاديمية",
    nameEn: "Manage Academic Structure",
    href: "/academic-structure",
    icon: Building2,
  },
  {
    name: "إنشاء تقييم",
    nameEn: "Create Evaluation",
    href: "/evaluations?action=create",
    icon: Star,
  },
];
