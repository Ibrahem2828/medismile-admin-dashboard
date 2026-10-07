"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from "lucide-react";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const isRtl = i18n.language === "ar";

  // Hide footer on login page
  const hideFooter = ["/login"].some((p) =>
    pathname.startsWith(p)
  );

  if (hideFooter) return null;

  // Social media links
  const socialLinks = [
    {
      name: "Facebook",
      icon: <Facebook size={18} />,
      href: "https://facebook.com/medismile",
      color: "hover:text-blue-600 dark:hover:text-blue-400"
    },
    {
      name: "Instagram",
      icon: <Instagram size={18} />,
      href: "https://instagram.com/medismile",
      color: "hover:text-pink-500 dark:hover:text-pink-400"
    },
    {
      name: "Twitter",
      icon: <Twitter size={18} />,
      href: "https://twitter.com/medismile",
      color: "hover:text-blue-400 dark:hover:text-blue-300"
    },
    {
      name: "YouTube",
      icon: <Youtube size={18} />,
      href: "https://youtube.com/@medismile",
      color: "hover:text-red-600 dark:hover:text-red-400"
    }
  ];

  return (
    <footer
      dir={isRtl ? "rtl" : "ltr"}
      className="mt-auto w-full bg-white dark:bg-dark-light border-t border-slate-200 dark:border-slate-700"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Contact */}
          <div className={`flex flex-col md:flex-row items-center gap-4 ${isRtl ? "md:flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <Image
                  src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                  alt={t("Navbar.logoAlt")}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </div>
              <span className="font-semibold text-lg text-slate-900 dark:text-white">
                {t("Root.title")}
              </span>
            </div>
            
            <div className={`flex items-center gap-4 text-sm ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <a 
                href={`mailto:${t("Footer.email")}`}
                className={`flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors ${isRtl ? "flex-row-reverse" : "flex-row"}`}
              >
                <Mail size={16} className="flex-shrink-0" />
                <span>{t("Footer.email")}</span>
              </a>
              <a 
                href={`tel:${t("Footer.phone")}`}
                className={`flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors ${isRtl ? "flex-row-reverse" : "flex-row"}`}
              >
                <Phone size={16} className="flex-shrink-0" />
                <span>{t("Footer.phone")}</span>
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg text-slate-600 dark:text-slate-400 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${social.color}`}
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            {t("Footer.copyright")} © {new Date().getFullYear()} {t("Root.title")}. {t("Footer.rightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}

