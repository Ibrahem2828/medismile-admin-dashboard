
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  registerSupervisorAsync,
  registerCollegeAdminAsync,
} from "../redux/features/auth/authSlice";
import toast from "react-hot-toast";

const UserIcon = dynamic(() =>
  import("@heroicons/react/24/outline").then((mod) => mod.UserIcon),
  { ssr: false }
);
const EnvelopeIcon = dynamic(() =>
  import("@heroicons/react/24/outline").then((mod) => mod.EnvelopeIcon),
  { ssr: false }
);
const LockClosedIcon = dynamic(() =>
  import("@heroicons/react/24/outline").then((mod) => mod.LockClosedIcon),
  { ssr: false }
);

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error: authError } = useSelector((state) => state.auth);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("supervisor");
  
  // حقول إضافية للمشرف
  const [universityId, setUniversityId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  
  // حقول إضافية لإدارة الكلية
  const [collegeUniversityId, setCollegeUniversityId] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const accessToken = localStorage.getItem("access_token");
    
    if (currentUser && accessToken) {
      router.push("/");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // التحقق من الحقول المطلوبة
    if (!username || !email || !password || !passwordConfirm || !firstName || !lastName) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (password !== passwordConfirm) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    try {
      let result;
      
      if (role === "supervisor") {
        // تسجيل مشرف
        const registerData = {
          username,
          email,
          password,
          password_confirm: passwordConfirm,
          first_name: firstName,
          last_name: lastName,
          ...(universityId && { university_id: universityId }),
          ...(licenseNumber && { license_number: licenseNumber }),
          ...(specialization && { specialization }),
        };
        
        console.log("Register data:", registerData);
        
        result = await dispatch(registerSupervisorAsync(registerData)).unwrap();
      } else if (role === "college_admin") {
        // تسجيل مسؤول جامعة (university_admin) عبر endpoint الخاص بالـ backend
        if (!collegeUniversityId) {
          setError("معرف الجامعة مطلوب لإنشاء حساب إدارة الجامعة");
          return;
        }

        const registerData = {
          username,
          email,
          password,
          password_confirm: passwordConfirm,
          first_name: firstName,
          last_name: lastName,
          university_id: collegeUniversityId,
        };

        result = await dispatch(registerCollegeAdminAsync(registerData)).unwrap();
      }

      if (result) {
        toast.success("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.");
        router.push("/login");
      }
    } catch (err) {
      // عرض رسالة الخطأ بشكل أفضل
      let errorMessage = "فشل إنشاء الحساب";
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err) {
        errorMessage = String(err);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // طباعة الخطأ في console للمساعدة في التطوير
      console.error("Register error:", err);
    }
  };

  if (isLoading) return null;

  return (
    <div dir="rtl">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--color-text-light)] p-8 rounded-2xl shadow-xl border border-[var(--color-border)]">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-[var(--color-bg-dark)] mb-2">
              <div className="mx-auto w-18 h-18 rounded-full bg-white p-1 flex items-center justify-center">
                <Image
                  src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                  alt="MediSmile Logo"
                  width={72}
                  height={72}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-bg-dark)]">
              أنشئ حسابك الجديد
            </h2>
            <p className="text-[var(--color-blue)] text-sm mt-2">
              الوصول إلى رعاية الأسنان التقنية والتعليم
            </p>
          </div>

          {(error || authError) && (
            <p className="text-[var(--color-error)] text-sm mb-3 text-center">
              {error || authError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* اسم المستخدم */}
            <div className="relative">
              <UserIcon className="h-5 w-5 absolute top-3 right-3 text-[var(--color-blue)]" />
              <input
                type="text"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-10 px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                required
              />
            </div>

            {/* الاسم الأول */}
            <div className="relative">
              <UserIcon className="h-5 w-5 absolute top-3 right-3 text-[var(--color-blue)]" />
              <input
                type="text"
                placeholder="الاسم الأول"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full pr-10 px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                required
              />
            </div>

            {/* الاسم الأخير */}
            <div className="relative">
              <UserIcon className="h-5 w-5 absolute top-3 right-3 text-[var(--color-blue)]" />
              <input
                type="text"
                placeholder="الاسم الأخير"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full pr-10 px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                required
              />
            </div>

            <div className="relative">
              <EnvelopeIcon className="h-5 w-5 absolute top-3 right-3 text-[var(--color-blue)]" />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
              />
            </div>

            <div className="relative">
              <LockClosedIcon className="h-5 w-5 absolute top-3 right-3 text-[var(--color-blue)]" />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                required
                minLength={8}
              />
            </div>

            <div className="relative">
              <LockClosedIcon className="h-5 w-5 absolute top-3 right-3 text-[var(--color-blue)]" />
              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full pr-10 px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                required
                minLength={8}
              />
            </div>

            {/* اختيار الدور */}
            <div>
              <label className="block text-sm mb-1 text-[var(--color-bg-dark)]">اختر الدور</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg 
                           bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] focus:outline-none 
                           focus:ring-2 focus:ring-[var(--color-accent)] transition"
              >
                <option value="supervisor">مشرف</option>
                <option value="college_admin">إدارة الجامعة</option>
              </select>
            </div>

            {/* حقول إضافية للمشرف */}
            {role === "supervisor" && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="رقم الرخصة (اختياري)"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                               bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="التخصص (اختياري)"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                               bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="معرف الجامعة (اختياري)"
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                               bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                  />
                </div>
              </>
            )}

            {/* حقول إضافية لإدارة الجامعة */}
            {role === "college_admin" && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="معرف الجامعة (مطلوب)"
                  value={collegeUniversityId}
                  onChange={(e) => setCollegeUniversityId(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] 
                             bg-[var(--color-bg-lightest)] text-[var(--color-bg-dark)] transition"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-blue)] hover:bg-[var(--color-accent)] disabled:bg-blue-300 disabled:cursor-not-allowed
                         text-[var(--color-text-light)] font-semibold py-2 rounded-lg transition-all duration-200"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full border border-[var(--color-blue)] text-[var(--color-blue)] 
                         hover:bg-[var(--color-blue-light)] font-semibold py-2 rounded-lg transition-all duration-200"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

