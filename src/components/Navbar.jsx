"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Menu, X, Search, ChevronDown, LayoutDashboard, UserRound, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToggleTheme from "./ToggleTheme";
import SearchDropdown from "./SearchDropdown";
// 🔕 الإشعارات معلقة مؤقتاً
// import NotificationBell from "./notifications/NotificationBell";
import { logoutAsync } from "../redux/features/auth/authSlice";
import { getUser } from "@/lib/auth";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { cx } from "./ui/cx";

// دالة إرسال إشعار
export function sendNotification(notification) {
  try {
    const stored = localStorage.getItem("notifications");
    const notifications = stored ? JSON.parse(stored) : [];
    notifications.push(notification);
    localStorage.setItem("notifications", JSON.stringify(notifications));
    window.dispatchEvent(new Event("new-notification"));
  } catch (error) {
    console.error("Error saving notification to localStorage:", error);
  }
}

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const menuRef = useRef(null);
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRefDesktop = useRef(null);
  const searchRefMobile = useRef(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);

    const handleUserLogin = () => setCurrentUser(getUser());
    const handleUserLogout = () => setCurrentUser(null);

    window.addEventListener("user-login", handleUserLogin);
    window.addEventListener("user-logout", handleUserLogout);
    return () => {
      window.removeEventListener("user-login", handleUserLogin);
      window.removeEventListener("user-logout", handleUserLogout);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      const inDesktop = searchRefDesktop.current?.contains(e.target);
      const inMobile = searchRefMobile.current?.contains(e.target);
      if (!inDesktop && !inMobile) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync());
      setCurrentUser(null);
      toast.success("تم تسجيل الخروج بنجاح");
      router.push("/login");
    } catch (error) {
      console.warn("Logout error (performing local cleanup):", error);
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setCurrentUser(null);
      toast.success("تم تسجيل الخروج بنجاح");
      router.push("/login");
    }
  };

  if (!mounted) return null;

  const isRtl = i18n?.language === "ar";
  const displayName =
    currentUser?.first_name ||
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.email ||
    "";
  const fallbackInitial =
    displayName?.[0]?.toUpperCase() ||
    currentUser?.email?.[0]?.toUpperCase() ||
    "U";
  const roleLabel =
    currentUser?.role === "university_admin" || currentUser?.role === "college_admin"
      ? isRtl
        ? "مسؤول الجامعة"
        : "University Admin"
      : null;
  const isAdmin =
    currentUser?.role === "university_admin" ||
    currentUser?.role === "college_admin";

  const submitSearch = (closeMobile = false) => {
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSearchDropdown(false);
    if (closeMobile) setMobileMenu(false);
  };

  const SearchField = ({
    containerRef,
    widthClass = "w-full",
    maxResults = 5,
    closeMobile = false,
  }) => (
    <div ref={containerRef} className={cx("relative", widthClass)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(closeMobile);
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute top-1/2 z-10 start-3 -translate-y-1/2 text-muted"
          size={16}
        />
        <Input
          type="text"
          size="compact"
          fullWidth
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchDropdown(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (searchQuery.trim().length > 0) setShowSearchDropdown(true);
          }}
          placeholder={t("Navbar.searchPlaceholder") || "بحث..."}
          className="border-border bg-background ps-9 pe-3 text-start focus:bg-surface"
        />
      </form>
      {showSearchDropdown && searchQuery.trim() && (
        <div className="absolute inset-x-0 top-full z-50 mt-1">
          <SearchDropdown
            query={searchQuery}
            onClose={() => setShowSearchDropdown(false)}
            maxResults={maxResults}
          />
        </div>
      )}
    </div>
  );

  const menuItemClass =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-text-secondary text-start transition-colors hover:bg-primary-muted hover:text-text";

  const AvatarButton = ({ className }) => (
    <button
      type="button"
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="Profile menu"
      aria-expanded={menuOpen}
      className={cx(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-1.5 pe-2",
        "text-text transition-colors hover:bg-primary-muted/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        className
      )}
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-caption font-semibold text-primary-foreground">
        {currentUser?.image ? (
          <Image
            src={currentUser.image}
            alt="Profile"
            width={28}
            height={28}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          fallbackInitial
        )}
      </span>
      <span className="hidden min-w-0 max-w-[9rem] flex-col items-start sm:flex">
        <span className="w-full truncate text-caption font-semibold leading-tight text-text">
          {displayName || "User"}
        </span>
        {roleLabel ? (
          <span className="w-full truncate text-[11px] leading-tight text-muted">
            {roleLabel}
          </span>
        ) : null}
      </span>
      <ChevronDown
        size={14}
        className={cx(
          "hidden text-muted transition-transform sm:block",
          menuOpen && "rotate-180"
        )}
      />
    </button>
  );

  return (
    <>
      {/* === Navbar Desktop === */}
      <nav
        dir={isRtl ? "rtl" : "ltr"}
        className="navbar-main fixed top-0 start-0 end-0 z-[60] hidden h-16 items-center gap-4 border-b border-border bg-surface px-5 lg:start-64 lg:flex"
      >
        {/* Search as primary navbar focus — brand lives in Sidebar */}
        <div className="min-w-0 flex-1">
          {currentUser ? (
            <SearchField
              containerRef={searchRefDesktop}
              widthClass="w-full max-w-md"
              maxResults={5}
            />
          ) : null}
        </div>

        {currentUser && (
          <div className="flex shrink-0 items-center gap-2">
            <ToggleTheme />

            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />

            <div ref={menuRef} className="relative">
              <AvatarButton />

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute end-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
                  >
                    <div className="border-b border-border px-3 py-3">
                      <p className="m-0 truncate text-sm font-semibold text-text">
                        {displayName || "User"}
                      </p>
                      {currentUser?.email ? (
                        <p className="m-0 mt-0.5 truncate text-caption text-muted">
                          {currentUser.email}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col py-1.5">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/");
                            setMenuOpen(false);
                          }}
                          className={menuItemClass}
                        >
                          <LayoutDashboard size={16} className="text-muted" />
                          {isRtl ? "لوحة إدارة الجامعة" : "University Dashboard"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          router.push("/profile");
                          setMenuOpen(false);
                        }}
                        className={menuItemClass}
                      >
                        <UserRound size={16} className="text-muted" />
                        {t("Navbar.profile") || "الملف الشخصي"}
                      </button>
                    </div>

                    <div className="border-t border-border py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-danger text-start transition-colors hover:bg-danger/10"
                      >
                        <LogOut size={16} />
                        {t("Navbar.logout") || "تسجيل الخروج"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </nav>

      {/* === Navbar Mobile === */}
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="navbar-mobile fixed top-0 start-0 z-[60] flex h-14 w-full items-center justify-between gap-3 border-b border-border bg-surface px-3 lg:hidden"
      >
        <div
          className={cx(
            "flex min-w-0 cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80",
            isRtl ? "flex-row-reverse" : "flex-row"
          )}
          onClick={() => router.push("/")}
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-primary-muted">
            <Image
              src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
              alt={t("Navbar.logoAlt") || "MediSmile Logo"}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="truncate text-sm font-bold text-text">
            {t("Root.title") || "MediSmile"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* 🔕 إشعارات - معلقة مؤقتاً */}
          {/* {currentUser && <NotificationBell />} */}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="px-2 text-text-secondary"
            aria-label="Toggle menu"
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {/* === Mobile Menu Panel === */}
      <AnimatePresence>
        {mobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenu(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              dir={isRtl ? "rtl" : "ltr"}
              className="fixed top-14 start-0 end-0 z-50 border-b border-border bg-surface shadow-xl lg:hidden"
            >
              {currentUser && (
                <div className="flex flex-col gap-3 px-3 py-3">
                  <SearchField
                    containerRef={searchRefMobile}
                    maxResults={3}
                    closeMobile
                  />

                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                        {fallbackInitial}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-sm font-semibold text-text">
                          {displayName || "User"}
                        </p>
                        {roleLabel ? (
                          <p className="m-0 truncate text-caption text-muted">
                            {roleLabel}
                          </p>
                        ) : null}
                      </div>
                      <div onClick={() => setMobileMenu(false)}>
                        <ToggleTheme />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden rounded-xl border border-border">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          router.push("/");
                          setMobileMenu(false);
                        }}
                        className={menuItemClass}
                      >
                        <LayoutDashboard size={16} className="text-muted" />
                        {isRtl ? "لوحة الإدارة" : "Dashboard"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/profile");
                        setMobileMenu(false);
                      }}
                      className={cx(menuItemClass, "border-t border-border")}
                    >
                      <UserRound size={16} className="text-muted" />
                      {t("Navbar.profile") || "الملف الشخصي"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setMobileMenu(false);
                      }}
                      className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-sm font-medium text-danger text-start transition-colors hover:bg-danger/10"
                    >
                      <LogOut size={16} />
                      {t("Navbar.logout") || "تسجيل الخروج"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
