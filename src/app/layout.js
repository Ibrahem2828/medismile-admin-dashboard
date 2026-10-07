import "./globals.css";
import { Tajawal } from "next/font/google";
import AppLayout from "../components/AppLayout";
import ReduxProvider from "../components/ReduxProvider";
import ToasterConfig from "../components/ToasterConfig";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata = {
  title: "MediSmile - لوحة التحكم",
  description: "نظام إدارة الحالات السريرية والطلاب",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={tajawal.variable}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (!theme && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="font-sans min-h-screen transition-colors"
        suppressHydrationWarning
      >
        <ReduxProvider>
          <AppLayout>{children}</AppLayout>
          <ToasterConfig />
        </ReduxProvider>
      </body>
    </html>
  );
}
