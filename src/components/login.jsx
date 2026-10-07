"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { Mail, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { loginAsync, logoutAsync } from "../redux/features/auth/authSlice";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { cx } from "./ui/cx";
import ToggleTheme from "./ToggleTheme";

const floatTransition = (duration, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error: authError } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);

  useEffect(() => {
    if (hasChecked) return;

    try {
      const storedUser =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "null")
          : null;
      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      if (typeof window !== "undefined") {
        const attemptsStr = localStorage.getItem("login_failed_attempts");
        const lockUntilStr = localStorage.getItem("login_lock_until");

        const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
        const lockUntilTime = lockUntilStr ? parseInt(lockUntilStr, 10) : null;

        setFailedAttempts(Number.isNaN(attempts) ? 0 : attempts);

        if (lockUntilTime && !Number.isNaN(lockUntilTime)) {
          const now = Date.now();
          if (now < lockUntilTime) {
            setLockUntil(lockUntilTime);
            setLockRemainingSeconds(Math.ceil((lockUntilTime - now) / 1000));
          } else {
            localStorage.removeItem("login_lock_until");
            localStorage.removeItem("login_failed_attempts");
            setFailedAttempts(0);
            setLockUntil(null);
            setLockRemainingSeconds(0);
          }
        }
      }

      if (storedUser && accessToken) {
        setHasChecked(true);
        router.push("/");
      } else {
        setHasChecked(true);
        setIsLoading(false);
      }
    } catch {
      setHasChecked(true);
      setIsLoading(false);
    }
  }, [hasChecked, router]);

  useEffect(() => {
    if (!lockUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockUntil) {
        setLockUntil(null);
        setLockRemainingSeconds(0);
        setFailedAttempts(0);
        if (typeof window !== "undefined") {
          localStorage.removeItem("login_lock_until");
          localStorage.removeItem("login_failed_attempts");
        }
        clearInterval(interval);
      } else {
        setLockRemainingSeconds(Math.ceil((lockUntil - now) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockUntil && Date.now() < lockUntil) {
      toast.error(
        "لقد تجاوزت عدد المحاولات المسموح بها. يرجى الانتظار قبل المحاولة مرة أخرى."
      );
      return;
    }

    setError("");

    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    try {
      const result = await dispatch(loginAsync({ email, password })).unwrap();

      if (result?.user) {
        toast.success("تم تسجيل الدخول بنجاح");

        setFailedAttempts(0);
        setLockUntil(null);
        setLockRemainingSeconds(0);
        if (typeof window !== "undefined") {
          localStorage.removeItem("login_failed_attempts");
          localStorage.removeItem("login_lock_until");
        }

        const role = result.user.role;

        if (role === "university_admin" || role === "college_admin") {
          router.push("/");
        } else {
          toast.error("هذا الحساب غير مصرح له بالوصول");
          dispatch(logoutAsync());
          router.push("/login");
        }
      }
    } catch (err) {
      const errorMessage = err || "البريد أو كلمة المرور غير صحيحة";
      setError(errorMessage);
      toast.error(errorMessage);

      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (typeof window !== "undefined") {
        localStorage.setItem("login_failed_attempts", String(newAttempts));
      }

      if (newAttempts >= 5) {
        const lockDurationMs = 60 * 1000;
        const newLockUntil = Date.now() + lockDurationMs;

        setLockUntil(newLockUntil);
        setLockRemainingSeconds(Math.ceil(lockDurationMs / 1000));

        if (typeof window !== "undefined") {
          localStorage.setItem("login_lock_until", String(newLockUntil));
        }

        toast.error(
          "تم إدخال بيانات غير صحيحة عدة مرات. يرجى الانتظار 60 ثانية قبل المحاولة مرة أخرى."
        );
      }
    }
  };

  if (isLoading) return null;

  const isLocked = Boolean(lockUntil && lockRemainingSeconds > 0);

  return (
    <div dir="rtl" className="h-dvh overflow-hidden bg-background text-text">
      <div className="flex h-full min-h-0">
        {/* Brand panel — right side in RTL */}
        <aside className="relative hidden h-full w-[44%] max-w-xl overflow-hidden bg-primary px-10 py-8 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          {/* Soft brand shapes (same palette only) */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -start-16 -top-20 h-64 w-64 rounded-full bg-primary-hover/50"
            animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
            transition={floatTransition(8)}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -end-10 bottom-10 h-52 w-52 rounded-full bg-primary-foreground/10"
            animate={{ y: [0, -16, 0], scale: [1, 1.06, 1] }}
            transition={floatTransition(7, 0.4)}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute start-1/3 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5"
            animate={{ y: ["-50%", "-42%", "-50%"], rotate: [0, 12, 0] }}
            transition={floatTransition(9, 0.2)}
          />

          <motion.div
            className="relative z-10 flex items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 shadow-md">
              <Image
                src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                alt="MediSmile Logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <p className="m-0 text-base font-bold text-primary-foreground">
                MediSmile
              </p>
              <p className="m-0 text-caption text-primary-foreground/75">
                Admin Console
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-caption font-medium text-primary-foreground/90">
              <Sparkles size={14} aria-hidden />
              University Admin
            </span>
            <h1 className="m-0 text-h1 font-bold text-primary-foreground">
              إدارة التعليم السريري في مكان واحد
            </h1>
            <p className="mt-4 m-0 text-body-sm leading-relaxed text-primary-foreground/80">
              الوصول إلى رعاية الأسنان التقنية والتعليم عبر لوحة تحكم آمنة
              لمسؤولي الجامعة.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {["حالات", "تقييمات", "تقارير"].map((label, i) => (
                <motion.div
                  key={label}
                  className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-3 text-center"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.22 + i * 0.08 }}
                >
                  <p className="m-0 text-caption font-semibold text-primary-foreground">
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            className="relative z-10 m-0 text-caption text-primary-foreground/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.35 }}
          >
            © {new Date().getFullYear()} MediSmile
          </motion.p>
        </aside>

        {/* Form panel */}
        <main className="relative flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
          <div className="absolute top-4 end-4 z-20 sm:top-6 sm:end-6">
            <ToggleTheme />
          </div>

          <motion.div
            aria-hidden
            className="pointer-events-none absolute -end-24 top-16 h-40 w-40 rounded-full bg-primary-muted"
            animate={{ y: [0, 12, 0] }}
            transition={floatTransition(6)}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -start-16 bottom-10 h-32 w-32 rounded-full bg-primary/10"
            animate={{ y: [0, -10, 0] }}
            transition={floatTransition(7, 0.3)}
          />

          <motion.div
            className="relative z-10 w-full max-w-[420px]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {/* Mobile brand */}
            <motion.div
              className="mb-8 flex flex-col items-center text-center lg:hidden"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-border bg-primary-muted shadow-sm">
                <Image
                  src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                  alt="MediSmile Logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <p className="m-0 text-base font-bold text-text">MediSmile</p>
              <p className="m-0 mt-1 text-caption text-muted">Admin Console</p>
            </motion.div>

            <motion.div
              className="rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <header className="mb-7 text-start">
                <h2 className="m-0 text-h2 font-bold text-text">أهلاً بك</h2>
                <p className="mt-2 m-0 text-body-sm text-text-secondary">
                  سجّل الدخول للمتابعة إلى لوحة التحكم
                </p>
              </header>

              {(error || authError) && (
                <motion.div
                  role="alert"
                  className="mb-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="m-0 text-center text-sm font-medium text-danger">
                    {error || authError}
                  </p>
                </motion.div>
              )}

              {isLocked && (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5"
                >
                  <p className="m-0 text-center text-sm font-medium text-warning">
                    لقد تجاوزت عدد المحاولات المسموح بها. يرجى الانتظار{" "}
                    <span className="font-bold tabular-nums">
                      {lockRemainingSeconds}
                    </span>{" "}
                    ثانية قبل المحاولة مرة أخرى.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-caption font-medium text-text-secondary"
                  >
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 start-3 z-10 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLocked || loading}
                      error={Boolean(error || authError)}
                      className="h-11 bg-background ps-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-caption font-medium text-text-secondary"
                  >
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute top-1/2 start-3 z-10 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden
                    />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLocked || loading}
                      error={Boolean(error || authError)}
                      className="h-11 bg-background ps-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={isLocked}
                  className={cx("mt-1 h-11 w-full text-sm font-semibold")}
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>
            </motion.div>

            <p className="mt-6 text-center text-caption text-muted lg:hidden">
              © {new Date().getFullYear()} MediSmile
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
