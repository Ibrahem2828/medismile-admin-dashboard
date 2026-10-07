"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function PageLoader({ loading, hasSidebar }) {
  const { i18n, t } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarOffsetClass =
    hasSidebar && !isMobile
      ? isRtl
        ? "lg:right-64"
        : "lg:left-64"
      : "";

  const loadingLabel = isRtl ? "جارٍ التحضير..." : "Preparing...";

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          dir={isRtl ? "rtl" : "ltr"}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={loadingLabel}
          className={`fixed inset-y-0 left-0 right-0 z-[9999] flex items-center justify-center bg-background ${sidebarOffsetClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="flex w-full max-w-[280px] flex-col items-center px-6 sm:max-w-[320px]">
            <motion.div
              className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-sm sm:mb-6 sm:h-20 sm:w-20"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Image
                src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                alt={t("Navbar.logoAlt") || "MediSmile Logo"}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                priority
              />
            </motion.div>

            <motion.p
              className="mb-1 font-sans text-h3 text-text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
            >
              MediSmile
            </motion.p>

            <motion.p
              className="mb-6 font-sans text-body-sm text-muted"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
            >
              {loadingLabel}
            </motion.p>

            <motion.div
              className="flex items-center gap-1.5"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1, 0.9] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.18,
                  }}
                />
              ))}
            </motion.div>

            <span className="sr-only">{loadingLabel}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
