"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { menuItems } from "@/lib/roleConfig";
import Button from "./ui/Button";
import { cx } from "./ui/cx";

/** Visual grouping only — does not change routes, labels, or permissions */
const NAV_SECTIONS = [
  {
    key: "overview",
    labelAr: "نظرة عامة",
    labelEn: "Overview",
    hrefs: ["/", "/search"],
  },
  {
    key: "management",
    labelAr: "الإدارة",
    labelEn: "Management",
    hrefs: ["/users", "/academic-structure"],
  },
  {
    key: "operations",
    labelAr: "العمليات",
    labelEn: "Operations",
    hrefs: [
      "/university-cases",
      "/community",
      "/university-appointments",
      "/university-attachments",
      "/evaluations",
    ],
  },
  {
    key: "system",
    labelAr: "النظام",
    labelEn: "System",
    hrefs: [
      "/audit-logs",
      "/community/approval-logs",
      "/reports",
      "/notifications",
      "/support",
    ],
  },
];

function isItemActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const Sidebar = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const noSidebarPages = ["/login"];
  if (noSidebarPages.includes(pathname)) return null;

  const sections = useMemo(() => {
    const used = new Set();
    const built = NAV_SECTIONS.map((section) => {
      const items = menuItems.filter((item) => {
        // Exact href match only — avoids /community swallowing /community/approval-logs
        const match = section.hrefs.includes(item.href);
        if (match) used.add(item.href);
        return match;
      });
      return { ...section, items };
    }).filter((section) => section.items.length > 0);

    const orphanItems = menuItems.filter((item) => !used.has(item.href));
    if (orphanItems.length) {
      built.push({
        key: "more",
        labelAr: "أخرى",
        labelEn: "More",
        hrefs: [],
        items: orphanItems,
      });
    }
    return built;
  }, []);

  const displayName = (item) => (isRtl ? item.name : item.nameEn || item.name);

  const renderNavLink = (item) => {
    const isActive = isItemActive(pathname, item.href);
    const Icon = item.icon;
    const itemName = displayName(item);

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => isMobile && setIsDropdownOpen(false)}
          aria-current={isActive ? "page" : undefined}
          className={cx(
            "group relative flex min-h-11 items-center gap-3 rounded-lg ps-3 pe-3 py-2.5",
            "text-sm text-start transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            isActive
              ? "bg-primary-muted font-semibold text-primary"
              : "font-medium text-text-secondary hover:bg-primary-muted/60 hover:text-text"
          )}
        >
          {isActive ? (
            <span
              aria-hidden
              className="absolute start-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary"
            />
          ) : null}

          {Icon ? (
            <span
              className={cx(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center",
                isActive
                  ? "text-primary"
                  : "text-muted group-hover:text-text-secondary"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
            </span>
          ) : null}

          <span className="min-w-0 flex-1 truncate leading-snug">{itemName}</span>
        </Link>
      </li>
    );
  };

  const renderMenu = () => (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-caption font-medium uppercase tracking-wide text-muted">
            {isRtl ? section.labelAr : section.labelEn}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(renderNavLink)}
          </ul>
        </div>
      ))}
    </div>
  );

  const LanguageSwitch = ({ className }) => (
    <div
      className={cx(
        "grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {[
        { code: "ar", label: "العربية" },
        { code: "en", label: "EN" },
      ].map(({ code, label }) => {
        const active = i18n.language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={active}
            className={cx(
              "h-9 rounded-md px-2 text-caption transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              active
                ? "bg-surface font-semibold text-primary shadow-sm"
                : "font-medium text-muted hover:text-text"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const BrandBlock = ({ compact = false }) => (
    <div
      className={cx(
        "flex min-w-0 items-center gap-3",
        isRtl ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cx(
          "relative shrink-0 overflow-hidden rounded-lg border border-border bg-primary-muted",
          compact ? "h-9 w-9" : "h-10 w-10"
        )}
      >
        <Image
          src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
          alt={t("Navbar.logoAlt") || "MediSmile"}
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </div>
      <div className={cx("min-w-0", isRtl ? "text-end" : "text-start")}>
        <p
          className={cx(
            "m-0 truncate font-bold text-text leading-tight",
            compact ? "text-sm" : "text-base"
          )}
        >
          {t("Root.title") || "MediSmile"}
        </p>
        {!compact ? (
          <p className="m-0 mt-0.5 truncate text-caption text-muted">
            {isRtl ? "لوحة التحكم" : "Admin Console"}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          dir={isRtl ? "rtl" : "ltr"}
          className="sidebar-main fixed top-0 start-0 z-50 flex h-screen w-64 flex-col border-e border-border bg-surface"
        >
          <div className="shrink-0 border-b border-border px-4 py-5">
            <BrandBlock />
          </div>

          <nav
            className="sidebar-nav flex-1 overflow-y-auto px-3 py-4"
            aria-label="Main"
          >
            {renderMenu()}
          </nav>

          <div className="shrink-0 border-t border-border px-3 py-3">
            <p className="mb-2 px-1 text-caption font-medium text-muted">
              {isRtl ? "اللغة" : "Language"}
            </p>
            <LanguageSwitch />
          </div>
        </aside>
      )}

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobile && isDropdownOpen && (
          <motion.div
            key="mobileMenu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            dir={isRtl ? "rtl" : "ltr"}
            className="sidebar-mobile-menu fixed top-28 start-0 z-40 flex h-[calc(100vh-7rem)] w-full flex-col border-t border-border bg-surface"
          >
            <nav className="sidebar-nav flex-1 overflow-y-auto px-3 py-4">
              {renderMenu()}
            </nav>
            <div className="shrink-0 border-t border-border px-3 py-3">
              <LanguageSwitch />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      {isMobile && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="sidebar-mobile-header fixed top-14 start-0 z-[55] flex h-14 w-full items-center justify-between gap-3 border-b border-border bg-surface px-3"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 px-2 text-text-secondary"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label={isDropdownOpen ? "Close menu" : "Open menu"}
            aria-expanded={isDropdownOpen}
          >
            {isDropdownOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <div className="min-w-0 flex-1">
            <BrandBlock compact />
          </div>

          {/* Keeps header balanced; language lives in drawer footer */}
          <span className="inline-block w-9 shrink-0" aria-hidden />
        </div>
      )}
    </>
  );
};

export default Sidebar;
