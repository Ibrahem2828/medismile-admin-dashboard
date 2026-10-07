"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const GlobeAltIcon = dynamic(
  () => import("@heroicons/react/24/outline").then(mod => mod.GlobeAltIcon),
  { ssr: false }
);

export default function LanguageButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button className="absolute top-4 left-4 flex items-center gap-1 text-text-light dark:text-text-dark">
      <GlobeAltIcon className="h-5 w-5" /> EN/AR
    </button>
  );
}
