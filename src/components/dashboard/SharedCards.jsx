"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cx } from "@/components/ui/cx";

/**
 * Premium stat cards — brand tokens only.
 */
const accentMap = {
  sky: {
    bar: "bg-primary",
    iconWell: "bg-primary text-primary-foreground",
    glow: "bg-primary/10",
  },
  blue: {
    bar: "bg-primary",
    iconWell: "bg-primary text-primary-foreground",
    glow: "bg-primary/10",
  },
  indigo: {
    bar: "bg-info",
    iconWell: "bg-info text-primary-foreground",
    glow: "bg-info/10",
  },
  amber: {
    bar: "bg-warning",
    iconWell: "bg-warning text-primary-foreground",
    glow: "bg-warning/10",
  },
  orange: {
    bar: "bg-warning",
    iconWell: "bg-warning text-primary-foreground",
    glow: "bg-warning/10",
  },
  purple: {
    bar: "bg-primary",
    iconWell: "bg-primary-muted text-primary",
    glow: "bg-primary-muted",
  },
  green: {
    bar: "bg-success",
    iconWell: "bg-success text-primary-foreground",
    glow: "bg-success/10",
  },
};

export default function SharedCards({ cards = [] }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  if (!cards || cards.length === 0) return null;

  const gridCols =
    cards.length === 1
      ? "grid-cols-1"
      : cards.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : cards.length === 3
          ? "grid-cols-1 md:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const label = isRtl ? card.label : card.labelEn || card.label;
        const accent = accentMap[card.color] || accentMap.sky;
        const value =
          card.value !== undefined && card.value !== null ? card.value : 0;

        return (
          <motion.article
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <span
              aria-hidden
              className={cx("absolute inset-x-0 top-0 h-1", accent.bar)}
            />
            <span
              aria-hidden
              className={cx(
                "pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100",
                accent.glow,
                "opacity-70"
              )}
            />

            <div className="relative flex flex-col gap-5 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium text-text-secondary">
                    {label}
                  </p>
                  {card.subtitle ? (
                    <p className="mt-1 m-0 text-caption text-muted">
                      {card.subtitle}
                    </p>
                  ) : null}
                </div>
                {Icon ? (
                  <div
                    className={cx(
                      "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
                      accent.iconWell
                    )}
                  >
                    <Icon size={20} />
                  </div>
                ) : null}
              </div>

              <div>
                <p className="m-0 text-4xl font-bold tracking-tight text-text tabular-nums">
                  {value}
                </p>
                <p className="mt-1.5 m-0 text-caption text-muted">
                  {isRtl ? "آخر تحديث الآن" : "Updated just now"}
                </p>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
