"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, X, Save, Loader2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  fetchSupervisorsAsync,
  createSupervisorAsync,
  updateSupervisorAsync,
  deleteSupervisorAsync,
  clearError,
} from "@/redux/features/supervisors/supervisorsSlice";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import RoleGuard from "@/components/RoleGuard";
import {
  Button,
  Input,
  Badge,
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableBody,
  DataTableRow,
  DataTableTd,
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui";
import toast from "react-hot-toast";
import { useRtl } from "@/hooks/useRtl";
import { fetchUniversityDetails, fetchUniversityAdminProfile } from "@/services/universityApi";

export default function SupervisorsPage() {
  return (
    <RoleGuard>
      <SupervisorsPageContent />
    </RoleGuard>
  );
}

function SupervisorsPageContent() {
  const { t, i18n } = useTranslation();
  const isRtl = useRtl();
  const dispatch = useDispatch();
  const supervisorsState = useSelector((state) => state.supervisors);
  const supervisors = supervisorsState?.supervisors || [];
  const loading = supervisorsState?.loading || false;
  const error = supervisorsState?.error || null;

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    university: "",
    phone_number: "",
    address: "",
    date_of_birth: "",
    gender: "",
    department: "",
    position: "",
    license_number: "",
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      setUser(storedUser);

      // تعبئة university_id افتراضياً من المستخدم
      let uniId = storedUser?.university_id || storedUser?.university || "";
      
      console.log("🔍 [SupervisorsPage] Initial university_id from localStorage:", uniId);
      console.log("🔍 [SupervisorsPage] storedUser:", storedUser);
      
      // تنظيف university ID - إزالة أي : أو رموز غير صالحة
      if (uniId && typeof uniId === 'string') {
        const originalUniId = uniId;
        uniId = uniId.replace(/^:/, '').trim();
        if (originalUniId !== uniId) {
          console.warn("⚠️ [SupervisorsPage] Cleaned university_id:", originalUniId, "->", uniId);
        }
      }
      
      // التحقق من أن الـ ID ليس :1 أو 1 فقط
      if (uniId && (uniId === '1' || uniId === ':1' || uniId.length < 10)) {
        console.error("❌ [SupervisorsPage] Invalid university_id format:", uniId);
        uniId = ""; // إعادة تعيين إلى فارغ
      }

      if (uniId) {
        console.log("✅ [SupervisorsPage] Setting university_id to formData:", uniId);
        setFormData((prev) => ({
          ...prev,
          university: uniId,
        }));
      } else {
        console.warn("⚠️ [SupervisorsPage] No valid university_id found");
      }
    }
  }, []);

  // جلب المشرفين عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchSupervisorsAsync());
  }, [dispatch]);

  // عرض رسائل الخطأ
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAdd = () => {
    setEditingSupervisor(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      password_confirm: "",
      first_name: "",
      last_name: "",
      university: (() => {
        let uniId = user?.university_id || user?.university || "";
        // تنظيف university ID - إزالة أي : أو رموز غير صالحة
        if (uniId && typeof uniId === 'string') {
          uniId = uniId.replace(/^:/, '').trim();
        }
        return uniId;
      })(),
      phone_number: "",
      address: "",
      date_of_birth: "",
      gender: "",
      department: "",
      position: "",
      license_number: "",
    });
    setShowForm(true);
  };

  const handleEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    // جلب البيانات من _apiData إذا كانت موجودة
    const apiData = supervisor._apiData || supervisor;
    // تنظيف university ID
    let uniId = apiData.university || supervisor.university || user?.university_id || user?.university || "";
    if (uniId && typeof uniId === 'string') {
      uniId = uniId.replace(/^:/, '').trim();
    }
    
    setFormData({
      username: apiData.username || "",
      email: apiData.email || supervisor.email || "",
      password: "",
      password_confirm: "",
      first_name: apiData.first_name || supervisor.first_name || "",
      last_name: apiData.last_name || supervisor.last_name || "",
      university: uniId,
      phone_number: apiData.phone_number || supervisor.phone_number || "",
      address: apiData.address || supervisor.address || "",
      date_of_birth: apiData.date_of_birth || supervisor.date_of_birth || "",
      gender: apiData.gender || supervisor.gender || "",
      department: apiData.department || supervisor.department || "",
      position: apiData.position || supervisor.position || "",
      license_number: apiData.license_number || supervisor.license_number || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (supervisorId) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشرف؟")) return;

    try {
      await dispatch(deleteSupervisorAsync(supervisorId)).unwrap();
      toast.success("تم حذف المشرف بنجاح");
      dispatch(fetchSupervisorsAsync());
    } catch (error) {
      toast.error(error?.message || "فشل في حذف المشرف");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      // التحقق من الحقول المطلوبة
      if (
        !formData.username ||
        !formData.email ||
        !formData.first_name ||
        !formData.last_name ||
        !formData.university
      ) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        setSubmitLoading(false);
        return;
      }

      // التحقق من password و password_confirm عند الإنشاء فقط
      if (!editingSupervisor) {
        if (!formData.password || !formData.password_confirm) {
          toast.error("يرجى إدخال كلمة المرور وتأكيدها");
          setSubmitLoading(false);
          return;
        }
        if (formData.password !== formData.password_confirm) {
          toast.error("كلمات المرور غير متطابقة");
          setSubmitLoading(false);
          return;
        }
      }

      if (editingSupervisor) {
        // عند التعديل، نستخدم البيانات القابلة للتعديل فقط
        const submitData = {
          email: formData.email,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          department: formData.department || null,
          position: formData.position || null,
          license_number: formData.license_number || null,
        };
        
        // إضافة كلمة المرور فقط إذا كانت موجودة
        if (formData.password) {
          submitData.password = formData.password;
          submitData.password_confirm = formData.password_confirm;
        }
        
        await dispatch(
          updateSupervisorAsync({ id: editingSupervisor.user_id || editingSupervisor.id, data: submitData })
        ).unwrap();
        toast.success("تم تحديث المشرف بنجاح");
      } else {
        // عند الإنشاء، نحتاج فقط للحقول المطلوبة حسب API الجديد
        // جلب university_id من Profile مباشرة (الاعتماد على Profile فقط)
        let universityId = null;
        
        if (user?.id && (user?.role === "university_admin" || user?.role === "college_admin")) {
          try {
            const profile = await fetchUniversityAdminProfile();
            
            // استخراج university_id من Profile
            if (profile?.university) {
              if (typeof profile.university === 'object') {
                universityId = profile.university.id || profile.university;
              } else {
                universityId = profile.university;
              }
            } else if (profile?.university_id) {
              universityId = profile.university_id;
            }
            
            // إذا تم جلب university_id، نحدث user object في localStorage
            if (universityId && user) {
              user.university_id = universityId;
              user.university = universityId;
              localStorage.setItem("user", JSON.stringify(user));
              setUser(user); // تحديث state أيضاً
            }
          } catch (error) {
            console.error("Error fetching university admin profile:", error);
            toast.error("فشل في جلب بيانات الجامعة. يرجى المحاولة مرة أخرى.");
            setSubmitLoading(false);
            return;
          }
        }

        // التحقق من أن university_id موجود
        if (!universityId) {
          toast.error("لم يتم العثور على معرف الجامعة. يرجى إعادة تسجيل الدخول.");
          setSubmitLoading(false);
          return;
        }

        // تنظيف university ID (إزالة مسافات فقط)
        const cleanUniversityId = typeof universityId === 'string' ? universityId.trim() : universityId;

        // جلب اسم الجامعة من API
        let universityName = "";
        try {
          const uniData = await fetchUniversityDetails(cleanUniversityId);
          universityName = uniData?.name || "";
        } catch (error) {
          console.error("Error fetching university name:", error);
          toast.error("فشل في جلب اسم الجامعة");
          setSubmitLoading(false);
          return;
        }

        if (!universityName) {
          toast.error("لم يتم العثور على اسم الجامعة");
          setSubmitLoading(false);
          return;
        }

        const submitData = {
          email: formData.email,
          username: formData.username,
          password: formData.password, // مطلوب حسب API
          password_confirm: formData.password_confirm, // مطلوب حسب API
          first_name: formData.first_name,
          last_name: formData.last_name,
          university: cleanUniversityId, // استخدام الـ ID النظيف
          university_name: universityName,
          // الحقول الاختيارية
          ...(formData.department && { department: formData.department }),
          ...(formData.position && { position: formData.position }),
          ...(formData.license_number && { license_number: formData.license_number }),
        };

        console.log("📤 [SupervisorsPage] Sending submitData:", submitData);
        console.log("📤 [SupervisorsPage] University ID:", submitData.university);

        await dispatch(createSupervisorAsync(submitData)).unwrap();
        toast.success("تم إنشاء المشرف بنجاح");
      }

      setShowForm(false);
      setEditingSupervisor(null);
      dispatch(fetchSupervisorsAsync());
    } catch (error) {
      toast.error(error?.message || "فشل في حفظ المشرف");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredSupervisors = supervisors.filter((supervisor) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = supervisor.supervisorName || supervisor.email?.split("@")[0] || "";
    return (
      name.toLowerCase().includes(searchLower) ||
      supervisor.email?.toLowerCase().includes(searchLower) ||
      supervisor.phone_number?.toLowerCase().includes(searchLower) ||
      supervisor.department?.toLowerCase().includes(searchLower) ||
      supervisor.position?.toLowerCase().includes(searchLower)
    );
  });

  if (!mounted) return null;

  return (
    <AnimatedWrapper>
      <div className={`p-6 sm:p-8 space-y-6 ${isRtl ? "text-right" : "text-left"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-h1 text-text">
              إدارة المشرفين
            </h1>
            <p className="text-body-sm text-text-secondary">
              إدارة حسابات المشرفين في الجامعة
            </p>
          </div>
          <Button onClick={handleAdd} className="shrink-0 self-start sm:self-auto">
            <PlusCircle size={18} />
            إضافة مشرف جديد
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search
            className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted ${isRtl ? "right-3" : "left-3"}`}
            size={16}
            aria-hidden
          />
          <Input
            type="text"
            placeholder="ابحث عن مشرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={isRtl ? "pr-10" : "pl-10"}
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            onClick={() => {
              setShowForm(false);
              setEditingSupervisor(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface shadow-xl"
            >
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-h3 text-text">
                    {editingSupervisor ? "تعديل مشرف" : "إضافة مشرف جديد"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingSupervisor(null);
                    }}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-primary-muted hover:text-text"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        اسم المستخدم *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        البريد الإلكتروني *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    {!editingSupervisor && (
                      <>
                        <div>
                          <label className="mb-2 block text-caption font-semibold text-muted">
                            كلمة المرور *
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-caption font-semibold text-muted">
                            تأكيد كلمة المرور *
                          </label>
                          <input
                            type="password"
                            name="password_confirm"
                            value={formData.password_confirm}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        الاسم الأول *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        اسم العائلة *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        العنوان
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        تاريخ الميلاد
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        الجنس
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      >
                        <option value="">اختر الجنس</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        القسم
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        المنصب
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        رقم الرخصة
                      </label>
                      <input
                        type="text"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleChange}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-border pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingSupervisor(null);
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" loading={submitLoading}>
                      {!submitLoading ? <Save size={18} /> : null}
                      حفظ
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Supervisors Table */}
        {loading ? (
          <DataTableLoading />
        ) : filteredSupervisors.length === 0 ? (
          <DataTableEmpty>
            {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مشرفين"}
          </DataTableEmpty>
        ) : (
          <DataTable dir={isRtl ? "rtl" : "ltr"} minWidth="900px">
            <DataTableHead>
              <tr>
                <DataTableTh>البريد الإلكتروني</DataTableTh>
                <DataTableTh>اسم المستخدم</DataTableTh>
                <DataTableTh>العنوان</DataTableTh>
                <DataTableTh>رقم الهاتف</DataTableTh>
                <DataTableTh>المنصب</DataTableTh>
                <DataTableTh className={isRtl ? "text-right" : "text-left"}>الإجراءات</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {filteredSupervisors.map((supervisor, idx) => {
                // استخراج اسم المستخدم من البريد الإلكتروني
                const username = supervisor.email ? supervisor.email.split("@")[0] : "-";
                
                return (
                  <DataTableRow
                    as={motion.tr}
                    key={supervisor.user_id || supervisor.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.24) }}
                  >
                    <DataTableTd className="font-medium text-text">
                      {supervisor.email || "-"}
                    </DataTableTd>
                    <DataTableTd className="text-text-secondary">{username}</DataTableTd>
                    <DataTableTd className="text-text-secondary max-w-[220px] truncate">
                      {supervisor.address || "-"}
                    </DataTableTd>
                    <DataTableTd className="text-text-secondary tabular-nums">
                      {supervisor.phone_number || "-"}
                    </DataTableTd>
                    <DataTableTd>
                      {supervisor.position ? (
                        <Badge variant="primary">{supervisor.position}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </DataTableTd>
                    <DataTableTd>
                      <div className={`flex items-center gap-1 ${isRtl ? "justify-start" : "justify-end"}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supervisor)}
                          className="h-9 w-9 px-0 text-primary hover:bg-primary-muted"
                          title="تعديل"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supervisor.user_id || supervisor.id)}
                          className="h-9 w-9 px-0 text-danger hover:bg-danger/10"
                          title="حذف"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </DataTableTd>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </AnimatedWrapper>
  );
}


