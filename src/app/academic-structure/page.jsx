"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useRtl } from "@/hooks/useRtl";
import { useRole } from "@/hooks/useRole";
import RoleGuard from "@/components/RoleGuard";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import {
  fetchUniversityDetails,
  updateUniversityDetails,
  fetchFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  fetchPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  fetchAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  // 🔕 الإشعارات معلقة مؤقتاً
  // createProgramNotification,
  // createAcademicYearNotification,
} from "@/services/universityApi";
import { fetchStudents } from "@/services/studentsApi";
import { fetchSupervisors } from "@/services/supervisorsApi";
import { Building2, GraduationCap, School, CalendarDays, BookOpen, Plus, Edit, Trash2, X, Users } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/services/api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asUuid(value) {
  if (typeof value === "string" && UUID_RE.test(value)) return value;
  if (value && typeof value === "object") {
    return asUuid(value.id) || asUuid(value.uuid) || asUuid(value.pk);
  }
  return "";
}

function getYearId(year) {
  if (!year) return "";
  if (typeof year === "string") return asUuid(year);
  return (
    asUuid(year.academic_year_id) ||
    asUuid(year.academic_year) ||
    asUuid(year.uuid) ||
    asUuid(year.id)
  );
}

/**
 * صفحة البنية الأكاديمية
 * متاحة فقط لإدارة الجامعة
 */
export default function AcademicStructurePage() {
  return (
    <RoleGuard>
      <AcademicStructureContent />
    </RoleGuard>
  );
}

function AcademicStructureContent() {
  const { t } = useTranslation();
  const isRtl = useRtl();
  const router = useRouter();
  const { user } = useRole();

  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState(null);
  const [universityId, setUniversityId] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [activeTab, setActiveTab] = useState("universities");

  // Forms state
  const [facultyForm, setFacultyForm] = useState({ name: "", description: "", is_active: true });
  const [programForm, setProgramForm] = useState({ name: "", code: "", faculty: "", level: "bachelor", duration_years: "", description: "" });
  const [yearForm, setYearForm] = useState({ name: "", start_date: "", end_date: "", description: "", is_active: true });
  const [universityForm, setUniversityForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [courseForm, setCourseForm] = useState({ 
    name: "", 
    code: "", 
    academic_year: "", 
    program: "", 
    supervisor: "", 
    students: [], 
    description: "", 
    credits: "", 
    is_active: true 
  });

  // Edit & Delete states
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editingYear, setEditingYear] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: "", id: "", name: "" });

  // جلب البيانات مباشرة - Backend يفلتر تلقائياً حسب Token
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // جلب universityId من user object (تم إضافته بعد Login)
      const readId = (value) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") return value.id || value.uuid || "";
        return "";
      };

      let universityId = readId(user?.university_id) || readId(user?.university);

      // إذا لم يكن هناك universityId، نجرب جلب Profile من API (fallback)
      if (!universityId && user?.id && (user?.role === "university_admin" || user?.role === "college_admin")) {
        try {
          if (process.env.NODE_ENV === "development") {
            console.log("⚠️ university_id not found, fetching profile...");
          }
          
          const profileResponse = await apiClient.get(
            `/accounts/me/university-admin/`
          );
          
          const profile = profileResponse.data?.data || profileResponse.data;
          
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
          if (universityId) {
            user.university_id = universityId;
            user.university = universityId;
            localStorage.setItem("user", JSON.stringify(user));
            
            if (process.env.NODE_ENV === "development") {
              console.log("✅ University ID fetched and saved:", universityId);
            }
          }
        } catch (profileError) {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ Error fetching profile:", profileError);
          }
        }
      }

      // إذا لم يكن هناك universityId بعد كل المحاولات، لا يمكننا المتابعة
      if (!universityId) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ لم يتم العثور على university_id");
          console.log("User object:", user);
          console.log("User keys:", user ? Object.keys(user) : "No user");
        }
        toast.error("لم يتم العثور على معرف الجامعة. يرجى إعادة تسجيل الدخول.");
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("✅ University ID found:", universityId);
      }

      // جلب البيانات - Backend يفلتر تلقائياً حسب Token
      const [uniData, facData, progData, yearsData, coursesData, studentsData, supervisorsData] = await Promise.all([
        fetchUniversityDetails(universityId).catch(() => null),
        fetchFaculties(universityId).catch(() => []),
        fetchPrograms(universityId).catch(() => []),
        fetchAcademicYears(universityId).catch(() => []),
        fetchCourses(universityId).catch(() => []),
        fetchStudents().catch(() => []),
        fetchSupervisors().catch(() => []),
      ]);

      setUniversity(uniData);
      setUniversityId(universityId); // حفظ universityId في state
      setFaculties(Array.isArray(facData) ? facData : []);
      setPrograms(Array.isArray(progData) ? progData : []);
      setAcademicYears(Array.isArray(yearsData) ? yearsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setSupervisors(Array.isArray(supervisorsData) ? supervisorsData : []);

      if (uniData) {
        setUniversityForm({
          name: uniData.name || "",
          address: uniData.address || "",
          phone: uniData.phone || "",
          email: uniData.email || "",
        });
        // حفظ universityId من uniData أيضاً
        if (uniData.id) {
          setUniversityId(uniData.id);
        }
      }
    } catch (error) {
      console.error("Error loading academic structure:", error);
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!universityId) return;

    try {
      const newFaculty = await createFaculty({
        university: universityId,
        name: facultyForm.name,
        description: facultyForm.description || "",
        is_active: facultyForm.is_active !== undefined ? facultyForm.is_active : true,
      });

      setFaculties([...faculties, newFaculty]);
      setFacultyForm({ name: "", description: "", is_active: true });
      toast.success("تم إنشاء الكلية بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في إنشاء الكلية");
    }
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!universityId) return;

    try {
      const newProgram = await createProgram({
        university: universityId,
        name: programForm.name,
        code: programForm.code,
        faculty: programForm.faculty || null,
        level: programForm.level,
        duration_years: programForm.duration_years || null,
        description: programForm.description,
      });

      setPrograms([...programs, newProgram]);
      setProgramForm({ name: "", code: "", faculty: "", level: "bachelor", duration_years: "", description: "" });
      toast.success("تم إنشاء البرنامج بنجاح");

      // 🔕 الإشعارات معلقة مؤقتاً
      // إنشاء إشعار عند إنشاء البرنامج
      // if (user?.id) {
      //   await createProgramNotification({
      //     program: newProgram,
      //     universityId: universityId,
      //     userId: user.id,
      //   });
      // }
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في إنشاء البرنامج");
    }
  };

  const handleCreateAcademicYear = async (e) => {
    e.preventDefault();
    if (!universityId) return;

    try {
      const newYear = await createAcademicYear({
        university: universityId,
        name: yearForm.name,
        start_date: yearForm.start_date,
        end_date: yearForm.end_date,
        description: yearForm.description,
        is_active: true,
      });

      const years = await fetchAcademicYears(universityId).catch(() => []);
      setAcademicYears(
        Array.isArray(years) && years.length ? years : [...academicYears, newYear]
      );
      setYearForm({ name: "", start_date: "", end_date: "", description: "" });
      toast.success("تم إنشاء السنة الأكاديمية بنجاح");

      // 🔕 الإشعارات معلقة مؤقتاً
      // إنشاء إشعار عند إنشاء السنة الأكاديمية
      // if (user?.id) {
      //   await createAcademicYearNotification({
      //     academicYear: newYear,
      //     universityId: universityId,
      //     userId: user.id,
      //   });
      // }
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في إنشاء السنة الأكاديمية");
    }
  };

  const handleUpdateUniversity = async (e) => {
    e.preventDefault();
    if (!universityId) return;

    try {
      const updated = await updateUniversityDetails(universityId, universityForm);
      setUniversity(updated);
      toast.success("تم تحديث بيانات الجامعة بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في تحديث بيانات الجامعة");
    }
  };

  // Faculty handlers
  const handleEditFaculty = (faculty) => {
    setEditingFaculty(faculty);
    setFacultyForm({
      name: faculty.name || "",
      description: faculty.description || "",
      is_active: faculty.is_active !== undefined ? faculty.is_active : true,
    });
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;

    try {
      const updated = await updateFaculty(editingFaculty.id, {
        name: facultyForm.name,
        description: facultyForm.description || "",
        is_active: facultyForm.is_active !== undefined ? facultyForm.is_active : true,
      });
      setFaculties(faculties.map((f) => (f.id === updated.id ? updated : f)));
      setEditingFaculty(null);
      setFacultyForm({ name: "", description: "", is_active: true });
      toast.success("تم تحديث الكلية بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في تحديث الكلية");
    }
  };

  const handleDeleteFaculty = async () => {
    if (!deleteConfirm.id) return;

    try {
      await deleteFaculty(deleteConfirm.id);
      setFaculties(faculties.filter((f) => f.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, type: "", id: "", name: "" });
      toast.success("تم حذف الكلية بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في حذف الكلية");
    }
  };

  // Program handlers
  const handleEditProgram = (program) => {
    setEditingProgram(program);
    setProgramForm({
      name: program.name || "",
      code: program.code || "",
      faculty: program.faculty || "",
      level: program.level || "bachelor",
      duration_years: program.duration_years || "",
      description: program.description || "",
    });
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    if (!universityId || !editingProgram) return;

    try {
      const updated = await updateProgram(universityId, editingProgram.id, programForm);
      setPrograms(programs.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProgram(null);
      setProgramForm({ name: "", code: "", faculty: "", level: "bachelor", duration_years: "", description: "" });
      toast.success("تم تحديث البرنامج بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في تحديث البرنامج");
    }
  };

  const handleDeleteProgram = async () => {
    if (!universityId || !deleteConfirm.id) return;

    try {
      await deleteProgram(universityId, deleteConfirm.id);
      setPrograms(programs.filter((p) => p.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, type: "", id: "", name: "" });
      toast.success("تم حذف البرنامج بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في حذف البرنامج");
    }
  };

  // Academic Year handlers
  const handleEditYear = (year) => {
    setEditingYear(year);
    setYearForm({
      name: year.name || "",
      start_date: year.start_date || "",
      end_date: year.end_date || "",
      description: year.description || "",
      is_active: year.is_active || false,
    });
  };

  const handleUpdateYear = async (e) => {
    e.preventDefault();
    if (!editingYear) return;

    try {
      const updated = await updateAcademicYear(editingYear.id, yearForm);
      setAcademicYears(academicYears.map((y) => (y.id === updated.id ? updated : y)));
      setEditingYear(null);
      setYearForm({ name: "", start_date: "", end_date: "", description: "", is_active: false });
      toast.success("تم تحديث السنة الأكاديمية بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في تحديث السنة الأكاديمية");
    }
  };

  const handleDeleteYear = async () => {
    if (!deleteConfirm.id) return;

    try {
      await deleteAcademicYear(deleteConfirm.id);
      setAcademicYears(academicYears.filter((y) => y.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, type: "", id: "", name: "" });
      toast.success("تم حذف السنة الأكاديمية بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في حذف السنة الأكاديمية");
    }
  };

  // Course handlers
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!universityId) {
      toast.error("معرف الجامعة غير موجود");
      return;
    }

    // التحقق من الحقول المطلوبة
    if (!courseForm.name || !courseForm.code) {
      toast.error("يرجى إدخال اسم المقرر وكود المقرر");
      return;
    }

    const academicYearId = getYearId(courseForm.academic_year);
    const selectedYear = academicYears.find((year) => getYearId(year) === academicYearId);
    if (academicYearId && selectedYear?.is_active === false) {
      toast.error("هذه السنة غير نشطة. فعّلها من تبويب السنوات ثم أعد إضافة المقرر.");
      return;
    }
    if (academicYearId && academicYearId === universityId) {
      toast.error("السنة المختارة غير صالحة. أعد اختيار السنة الأكاديمية.");
      return;
    }

    try {
      // بناء البيانات المرسلة - نرسل جميع الحقول بما في ذلك المشرف والطلاب
      // ملاحظة: لا نرسل حقل university - الـ API يستخرجه تلقائياً من Token
      const courseData = {
        name: courseForm.name.trim(),
        code: courseForm.code.trim(),
        academic_year: getYearId(courseForm.academic_year) || null,
        program: courseForm.program || null,
        supervisor: courseForm.supervisor || null,
        students: courseForm.students && courseForm.students.length > 0 ? courseForm.students : [],
        description: courseForm.description ? courseForm.description.trim() : null,
        credits: courseForm.credits ? parseInt(courseForm.credits) : 0,
        is_active: courseForm.is_active,
      };
      
      // التأكد من عدم إرسال university
      delete courseData.university;

      console.log("📚 إرسال بيانات المقرر:", JSON.stringify(courseData, null, 2));
      console.log("📚 universityId:", universityId);
      console.log("📚 supervisor:", courseForm.supervisor);
      console.log("📚 students:", courseForm.students);

      const newCourse = await createCourse(courseData);

      console.log("✅ تم إنشاء المقرر بنجاح:", newCourse);

      // إعادة تحميل قائمة المقررات لضمان الحصول على أحدث البيانات
      const updatedCourses = await fetchCourses(universityId);
      setCourses(Array.isArray(updatedCourses) ? updatedCourses : []);

      // إعادة تعيين النموذج
      setCourseForm({ 
        name: "", 
        code: "", 
        academic_year: "", 
        program: "", 
        supervisor: "", 
        students: [], 
        description: "", 
        credits: "", 
        is_active: true 
      });
      toast.success("تم إنشاء المقرر بنجاح");
    } catch (error) {
      console.error("❌ خطأ في إنشاء المقرر:", error);
      console.error("❌ تفاصيل الخطأ:", error?.response?.data);
      console.error("❌ Status Code:", error?.response?.status);
      console.error("❌ Error Message:", error?.message);
      
      // عرض تفاصيل الخطأ
      let errorMessage = "فشل في إنشاء المقرر";
      
      if (error?.response?.data) {
        // محاولة استخراج رسالة الخطأ من الاستجابة
        const errorData = error.response.data;
        
        // إذا كان هناك أخطاء في الحقول
        if (errorData.errors && typeof errorData.errors === 'object') {
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `أخطاء في البيانات: ${fieldErrors}`;
        } else {
          errorMessage = errorData.message 
            || errorData.error 
            || errorData.detail
            || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // إذا كان الخطأ 500، أضف رسالة توضيحية
      if (error?.response?.status === 500) {
        errorMessage = `خطأ في السيرفر (500): ${errorMessage}. يرجى التحقق من صحة البيانات أو الاتصال بالدعم الفني.`;
      }
      
      console.error("❌ رسالة الخطأ النهائية:", errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    // استخراج supervisor ID إذا كان object
    const supervisorId = typeof course.supervisor === 'object' && course.supervisor !== null
      ? course.supervisor.id
      : course.supervisor || "";
    
    setCourseForm({
      name: course.name || "",
      code: course.code || "",
      academic_year: getYearId(course.academic_year) || "",
      program: course.program || "",
      supervisor: supervisorId,
      students: course.students || [],
      description: course.description || "",
      credits: course.credits || "",
      is_active: course.is_active !== undefined ? course.is_active : true,
    });
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const updated = await updateCourse(editingCourse.id, {
        name: courseForm.name,
        code: courseForm.code,
        academic_year: getYearId(courseForm.academic_year) || null,
        program: courseForm.program || null,
        supervisor: courseForm.supervisor || null,
        students: courseForm.students || [],
        description: courseForm.description || "",
        credits: courseForm.credits ? parseInt(courseForm.credits) : null,
        is_active: courseForm.is_active,
      });
      setCourses(courses.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCourse(null);
      setCourseForm({ 
        name: "", 
        code: "", 
        academic_year: "", 
        program: "", 
        supervisor: "", 
        students: [], 
        description: "", 
        credits: "", 
        is_active: true 
      });
      toast.success("تم تحديث المقرر بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في تحديث المقرر");
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteConfirm.id) return;

    try {
      await deleteCourse(deleteConfirm.id);
      setCourses(courses.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, type: "", id: "", name: "" });
      toast.success("تم حذف المقرر بنجاح");
    } catch (error) {
      toast.error(error?.response?.data?.message || "فشل في حذف المقرر");
    }
  };

  if (loading) {
    return (
      <AnimatedWrapper>
        <div className={`p-6 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-border"></div>
            <div className="h-64 rounded bg-border"></div>
          </div>
        </div>
      </AnimatedWrapper>
    );
  }

  const tabs = [
    {
      id: "universities",
      name: t("AcademicStructure.tabs.universities"),
      icon: Building2,
    },
    {
      id: "faculties",
      name: t("AcademicStructure.tabs.faculties"),
      icon: School,
    },
    {
      id: "programs",
      name: t("AcademicStructure.tabs.programs"),
      icon: GraduationCap,
    },
    {
      id: "years",
      name: t("AcademicStructure.tabs.years"),
      icon: CalendarDays,
    },
    {
      id: "courses",
      name: t("AcademicStructure.tabs.courses"),
      icon: BookOpen,
    },
  ];

  return (
    <AnimatedWrapper>
      <div className={`min-h-screen space-y-8 bg-background p-4 sm:p-6 lg:p-8 ${isRtl ? "text-right" : "text-left"}`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-h1 text-text">
            {t("AcademicStructure.title")}
          </h1>
          <p className="text-body-sm text-text-secondary sm:text-base">
            {t("AcademicStructure.description")}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className={`flex ${isRtl ? "space-x-reverse" : ""} space-x-6 overflow-x-auto`} aria-label="Tabs">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:border-border hover:text-text"
                  }`}
                >
                  <TabIcon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* Universities Tab */}
          {activeTab === "universities" && (
            <div className="space-y-6">
              {university ? (
                  <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                    <h2 className="mb-5 text-h3 text-text">
                      {university.name}
                    </h2>
                    <div className="space-y-3 text-text-secondary">
                      {university.code && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold">الرمز:</span> 
                          <span>{university.code}</span>
                        </p>
                      )}
                      {university.address && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold">العنوان:</span> 
                          <span>{university.address}</span>
                        </p>
                      )}
                      {university.phone && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold">الهاتف:</span> 
                          <span>{university.phone}</span>
                        </p>
                      )}
                      {university.email && (
                        <p className="flex items-center gap-2">
                          <span className="font-semibold">البريد الإلكتروني:</span> 
                          <span>{university.email}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="py-8 text-center text-body-sm text-muted">لا توجد بيانات الجامعة</p>
                )}

              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                  <h2 className="mb-5 text-h3 text-text">
                    تحديث بيانات الجامعة
                  </h2>
                  <form onSubmit={handleUpdateUniversity} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          الاسم
                        </label>
                        <input
                          type="text"
                          value={universityForm.name}
                          onChange={(e) =>
                            setUniversityForm({ ...universityForm, name: e.target.value })
                          }
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          العنوان
                        </label>
                        <input
                          type="text"
                          value={universityForm.address}
                          onChange={(e) =>
                            setUniversityForm({ ...universityForm, address: e.target.value })
                          }
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          الهاتف
                        </label>
                        <input
                          type="text"
                          value={universityForm.phone}
                          onChange={(e) =>
                            setUniversityForm({ ...universityForm, phone: e.target.value })
                          }
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={universityForm.email}
                          onChange={(e) =>
                            setUniversityForm({ ...universityForm, email: e.target.value })
                          }
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                      >
                        حفظ التغييرات
                      </button>
                    </div>
                  </form>
                </div>
            </div>
          )}

          {/* Faculties Tab */}
          {activeTab === "faculties" && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                  <h2 className="mb-5 text-h3 text-text">
                    إضافة كلية جديدة
                  </h2>
                  <form onSubmit={handleCreateFaculty} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          اسم الكلية *
                        </label>
                        <input
                          type="text"
                          value={facultyForm.name}
                          onChange={(e) =>
                            setFacultyForm({ ...facultyForm, name: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        الوصف
                      </label>
                      <textarea
                        value={facultyForm.description}
                        onChange={(e) =>
                          setFacultyForm({ ...facultyForm, description: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={facultyForm.is_active ?? true}
                          onChange={(e) =>
                            setFacultyForm({ ...facultyForm, is_active: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="text-caption font-semibold text-muted">
                          الكلية نشطة
                        </span>
                      </label>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                      >
                        إضافة كلية
                      </button>
                    </div>
                  </form>
                </div>

              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                <h2 className="mb-5 text-h3 text-text">
                  قائمة الكليات ({faculties.length})
                </h2>
                {faculties.length > 0 ? (
                  <div className="space-y-3">
                    {faculties.map((faculty) => (
                      <div
                        key={faculty.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-primary-muted/30"
                      >
                        <div className="flex-1">
                          <p className="mb-1 font-semibold text-text">
                            {faculty.name}
                          </p>
                          {faculty.code && (
                            <p className="text-body-sm text-muted">
                              رمز: {faculty.code}
                            </p>
                          )}
                          {faculty.description && (
                            <p className="mt-2 text-body-sm text-text-secondary">
                              {faculty.description}
                            </p>
                          )}
                        </div>
                        <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <button
                            onClick={() => handleEditFaculty(faculty)}
                            className="rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary-muted"
                            title="تعديل"
                            aria-label="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                show: true,
                                type: "faculty",
                                id: faculty.id,
                                name: faculty.name,
                              })
                            }
                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
                            title="حذف"
                            aria-label="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-body-sm text-muted">لا توجد كليات</p>
                )}
              </div>
            </div>
          )}

          {/* Programs Tab */}
          {activeTab === "programs" && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                  <h2 className="mb-5 text-h3 text-text">
                    إضافة برنامج أكاديمي جديد
                  </h2>
                  <form onSubmit={handleCreateProgram} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          اسم البرنامج *
                        </label>
                        <input
                          type="text"
                          value={programForm.name}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, name: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          رمز البرنامج *
                        </label>
                        <input
                          type="text"
                          value={programForm.code}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, code: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          الكلية
                        </label>
                        <select
                          value={programForm.faculty}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, faculty: e.target.value })
                          }
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        >
                          <option value="">اختر كلية</option>
                          {faculties.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>
                              {faculty.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          المستوى الأكاديمي *
                        </label>
                        <select
                          value={programForm.level}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, level: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        >
                          <option value="bachelor">بكالوريوس</option>
                          <option value="master">ماجستير</option>
                          <option value="doctorate">دكتوراه</option>
                          <option value="diploma">دبلوم</option>
                          <option value="certificate">شهادة</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          مدة البرنامج (بالسنوات)
                        </label>
                        <input
                          type="number"
                          value={programForm.duration_years}
                          onChange={(e) =>
                            setProgramForm({ ...programForm, duration_years: e.target.value })
                          }
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        الوصف
                      </label>
                      <textarea
                        value={programForm.description}
                        onChange={(e) =>
                          setProgramForm({ ...programForm, description: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                      />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                      >
                        إضافة برنامج
                      </button>
                    </div>
                  </form>
                </div>

              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                <h2 className="mb-5 text-h3 text-text">
                  قائمة البرامج الأكاديمية ({programs.length})
                </h2>
                {programs.length > 0 ? (
                  <div className="space-y-3">
                    {programs.map((program) => (
                      <div
                        key={program.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-primary-muted/30"
                      >
                        <div className="flex-1">
                          <p className="mb-1 font-semibold text-text">
                            {program.name}
                          </p>
                          {program.code && (
                            <p className="text-body-sm text-muted">
                              رمز: {program.code}
                            </p>
                          )}
                          {program.level && (
                            <p className="text-body-sm text-muted">
                              المستوى: {program.level}
                            </p>
                          )}
                          {program.description && (
                            <p className="mt-2 text-body-sm text-text-secondary">
                              {program.description}
                            </p>
                          )}
                        </div>
                        <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <button
                            onClick={() => handleEditProgram(program)}
                            className="rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary-muted"
                            title="تعديل"
                            aria-label="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                show: true,
                                type: "program",
                                id: program.id,
                                name: program.name,
                              })
                            }
                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
                            title="حذف"
                            aria-label="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-body-sm text-muted">لا توجد برامج أكاديمية</p>
                )}
              </div>
            </div>
          )}

          {/* Academic Years Tab */}
          {activeTab === "years" && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                  <h2 className="mb-5 text-h3 text-text">
                    إضافة سنة أكاديمية جديدة
                  </h2>
                  <form onSubmit={handleCreateAcademicYear} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          اسم السنة *
                        </label>
                        <input
                          type="text"
                          value={yearForm.name}
                          onChange={(e) =>
                            setYearForm({ ...yearForm, name: e.target.value })
                          }
                          placeholder="مثال: 2024-2025"
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          تاريخ البداية *
                        </label>
                        <input
                          type="date"
                          value={yearForm.start_date}
                          onChange={(e) =>
                            setYearForm({ ...yearForm, start_date: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-caption font-semibold text-muted">
                          تاريخ النهاية *
                        </label>
                        <input
                          type="date"
                          value={yearForm.end_date}
                          onChange={(e) =>
                            setYearForm({ ...yearForm, end_date: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        الوصف
                      </label>
                      <textarea
                        value={yearForm.description}
                        onChange={(e) =>
                          setYearForm({ ...yearForm, description: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                      />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                      >
                        إضافة سنة أكاديمية
                      </button>
                    </div>
                  </form>
                </div>

              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                <h2 className="mb-5 text-h3 text-text">
                  قائمة السنوات الأكاديمية ({academicYears.length})
                </h2>
                {academicYears.length > 0 ? (
                  <div className="space-y-3">
                    {academicYears.map((year) => (
                      <div
                        key={year.id}
                        className="rounded-lg border border-border p-4 transition-colors hover:bg-primary-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="mb-1 font-semibold text-text">
                              {year.name}
                            </p>
                            {year.start_date && year.end_date && (
                              <p className="text-body-sm text-muted">
                                من {new Date(year.start_date).toLocaleDateString("ar-SA")} إلى{" "}
                                {new Date(year.end_date).toLocaleDateString("ar-SA")}
                              </p>
                            )}
                            {year.description && (
                              <p className="mt-2 text-body-sm text-text-secondary">
                                {year.description}
                              </p>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                            {year.is_active && (
                              <span className="px-3 py-1 bg-success/15 text-success rounded-full text-xs font-semibold">
                                نشطة
                              </span>
                            )}
                            <button
                              onClick={() => handleEditYear(year)}
                              className="rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary-muted"
                              title="تعديل"
                              aria-label="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  show: true,
                                  type: "year",
                                  id: year.id,
                                  name: year.name,
                                })
                              }
                              className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
                              title="حذف"
                              aria-label="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-body-sm text-muted">لا توجد سنوات أكاديمية</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <h2 className="text-h3 text-text">
                تعديل الكلية
              </h2>
              <button
                onClick={() => {
                  setEditingFaculty(null);
                  setFacultyForm({ name: "", description: "", is_active: true });
                }}
                className="rounded-lg p-2 transition-colors hover:bg-primary-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateFaculty} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    اسم الكلية *
                  </label>
                  <input
                    type="text"
                    value={facultyForm.name}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, name: e.target.value })
                    }
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-caption font-semibold text-muted">
                  الوصف
                </label>
                <textarea
                  value={facultyForm.description}
                  onChange={(e) =>
                    setFacultyForm({ ...facultyForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={facultyForm.is_active ?? true}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-caption font-semibold text-muted">
                    الكلية نشطة
                  </span>
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFaculty(null);
                    setFacultyForm({ name: "", description: "", is_active: true });
                  }}
                  className="rounded-md border border-border px-5 py-2.5 text-body-sm font-semibold text-text-secondary transition-all hover:bg-primary-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {editingProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <h2 className="text-h3 text-text">
                تعديل البرنامج الأكاديمي
              </h2>
              <button
                onClick={() => {
                  setEditingProgram(null);
                  setProgramForm({ name: "", code: "", faculty: "", level: "bachelor", duration_years: "", description: "" });
                }}
                className="rounded-lg p-2 transition-colors hover:bg-primary-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateProgram} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    اسم البرنامج *
                  </label>
                  <input
                    type="text"
                    value={programForm.name}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, name: e.target.value })
                    }
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    رمز البرنامج *
                  </label>
                  <input
                    type="text"
                    value={programForm.code}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, code: e.target.value })
                    }
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    الكلية
                  </label>
                  <select
                    value={programForm.faculty}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, faculty: e.target.value })
                    }
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  >
                    <option value="">اختر كلية</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    المستوى الأكاديمي *
                  </label>
                  <select
                    value={programForm.level}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, level: e.target.value })
                    }
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  >
                    <option value="bachelor">بكالوريوس</option>
                    <option value="master">ماجستير</option>
                    <option value="doctorate">دكتوراه</option>
                    <option value="diploma">دبلوم</option>
                    <option value="certificate">شهادة</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    مدة البرنامج (بالسنوات)
                  </label>
                  <input
                    type="number"
                    value={programForm.duration_years}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, duration_years: e.target.value })
                    }
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-caption font-semibold text-muted">
                  الوصف
                </label>
                <textarea
                  value={programForm.description}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProgram(null);
                    setProgramForm({ name: "", code: "", faculty: "", level: "bachelor", duration_years: "", description: "" });
                  }}
                  className="rounded-md border border-border px-5 py-2.5 text-body-sm font-semibold text-text-secondary transition-all hover:bg-primary-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Academic Year Modal */}
      {editingYear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <h2 className="text-h3 text-text">
                تعديل السنة الأكاديمية
              </h2>
              <button
                onClick={() => {
                  setEditingYear(null);
                  setYearForm({ name: "", start_date: "", end_date: "", description: "", is_active: false });
                }}
                className="rounded-lg p-2 transition-colors hover:bg-primary-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateYear} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    اسم السنة *
                  </label>
                  <input
                    type="text"
                    value={yearForm.name}
                    onChange={(e) =>
                      setYearForm({ ...yearForm, name: e.target.value })
                    }
                    placeholder="مثال: 2024-2025"
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    تاريخ البداية *
                  </label>
                  <input
                    type="date"
                    value={yearForm.start_date}
                    onChange={(e) =>
                      setYearForm({ ...yearForm, start_date: e.target.value })
                    }
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    تاريخ النهاية *
                  </label>
                  <input
                    type="date"
                    value={yearForm.end_date}
                    onChange={(e) =>
                      setYearForm({ ...yearForm, end_date: e.target.value })
                    }
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-caption font-semibold text-muted">
                  الوصف
                </label>
                <textarea
                  value={yearForm.description}
                  onChange={(e) =>
                    setYearForm({ ...yearForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={yearForm.is_active}
                    onChange={(e) =>
                      setYearForm({ ...yearForm, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-caption font-semibold text-muted">
                    السنة الأكاديمية النشطة
                  </span>
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingYear(null);
                    setYearForm({ name: "", start_date: "", end_date: "", description: "", is_active: false });
                  }}
                  className="rounded-md border border-border px-5 py-2.5 text-body-sm font-semibold text-text-secondary transition-all hover:bg-primary-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* Courses Tab */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              {/* Create Course Form */}
              {!editingCourse && (
                <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                  <h2 className="mb-5 text-h3 text-text">
                    إضافة مقرر جديد
                  </h2>
                  <form onSubmit={handleCreateCourse} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        اسم المقرر *
                      </label>
                      <input
                        type="text"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        placeholder="مثال: تشخيص الأسنان"
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        كود المقرر *
                      </label>
                      <input
                        type="text"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        placeholder="مثال: DENT-301"
                        required
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        السنة الأكاديمية
                      </label>
                      <select
                        value={courseForm.academic_year}
                        onChange={(e) => setCourseForm({ ...courseForm, academic_year: e.target.value })}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      >
                        <option value="">اختر السنة الأكاديمية</option>
                        {academicYears.map((year) => {
                          const yearId = getYearId(year);
                          if (!yearId || yearId === universityId) return null;
                          return (
                            <option key={yearId} value={yearId}>
                              {year.name}
                              {year.is_active === false ? " (غير نشطة)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        البرنامج
                      </label>
                      <select
                        value={courseForm.program}
                        onChange={(e) => setCourseForm({ ...courseForm, program: e.target.value })}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      >
                        <option value="">اختر البرنامج</option>
                        {programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name} ({program.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        المشرف
                      </label>
                      <select
                        value={courseForm.supervisor}
                        onChange={(e) => setCourseForm({ ...courseForm, supervisor: e.target.value })}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      >
                        <option value="">اختر المشرف</option>
                        {supervisors.map((supervisor) => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.first_name} {supervisor.last_name} ({supervisor.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-caption font-semibold text-muted">
                        عدد الساعات المعتمدة
                      </label>
                      <input
                        type="number"
                        value={courseForm.credits}
                        onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                        placeholder="مثال: 3"
                        min="0"
                        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-caption font-semibold text-muted">
                      الطلاب
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-surface">
                      {students.length === 0 ? (
                        <p className="text-muted text-sm">لا توجد طلاب متاحين</p>
                      ) : (
                        students.map((student) => (
                          <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-primary-muted/30 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseForm.students.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCourseForm({ ...courseForm, students: [...courseForm.students, student.id] });
                                } else {
                                  setCourseForm({ ...courseForm, students: courseForm.students.filter((id) => id !== student.id) });
                                }
                              }}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                            />
                            <span className="text-sm text-text-secondary">
                              {student.first_name} {student.last_name} ({student.email})
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-caption font-semibold text-muted">
                      الوصف
                    </label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="مثال: مادة سريرية"
                      rows={3}
                      className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={courseForm.is_active}
                        onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                      />
                      <span className="text-caption font-semibold text-muted">
                        المقرر نشط
                      </span>
                    </label>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                    >
                      إضافة المقرر
                    </button>
                  </div>
                  </form>
                </div>
              )}

              {/* Courses List */}
              <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm">
                <h2 className="mb-5 text-h3 text-text">
                  قائمة المقررات
                </h2>
                {courses.length === 0 ? (
                  <p className="py-8 text-center text-body-sm text-muted">لا توجد مقررات</p>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="p-4 bg-background rounded-lg border border-border hover:bg-primary-muted transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-text mb-1">
                              {course.name}
                            </h3>
                            <p className="text-sm text-muted mb-2">
                              <span className="font-semibold">الكود:</span> {course.code}
                              {course.credits && (
                                <> | <span className="font-semibold">الساعات:</span> {course.credits}</>
                              )}
                            </p>
                            {course.description && (
                              <p className="text-sm text-muted mb-2">
                                {course.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted">
                              {course.academic_year && (
                                <span className="rounded bg-primary/15 px-2 py-1 text-primary">
                                  السنة: {academicYears.find((y) => y.id === course.academic_year)?.name || course.academic_year}
                                </span>
                              )}
                              {course.program && (
                                <span className="rounded bg-primary/15 px-2 py-1 text-primary">
                                  البرنامج: {programs.find((p) => p.id === course.program)?.name || course.program}
                                </span>
                              )}
                              {course.supervisor && (() => {
                                let displayText = "";
                                
                                // إذا كان supervisor object، استخدمه مباشرة
                                if (typeof course.supervisor === 'object' && course.supervisor !== null) {
                                  const name = `${course.supervisor.first_name || ''} ${course.supervisor.last_name || ''}`.trim();
                                  displayText = name || course.supervisor.email || "";
                                } else {
                                  // إذا كان supervisor UUID، ابحث في قائمة المشرفين
                                  const supervisor = supervisors.find((s) => s.id === course.supervisor);
                                  if (supervisor) {
                                    const name = `${supervisor.first_name || ''} ${supervisor.last_name || ''}`.trim();
                                    displayText = name || supervisor.email || "";
                                  } else {
                                    // إذا لم نجد المشرف في القائمة، لا نعرض المعرف
                                    return null;
                                  }
                                }
                                
                                // عرض المشرف إذا كان هناك نص للعرض
                                return displayText ? (
                                  <span className="rounded bg-primary/15 px-2 py-1 text-primary">
                                    المشرف: {displayText}
                                  </span>
                                ) : null;
                              })()}
                              {course.students && course.students.length > 0 && (
                                <span className="rounded bg-primary/15 px-2 py-1 text-primary flex items-center gap-1">
                                  <Users size={14} />
                                  {course.students.length} طالب
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded ${course.is_active ? "bg-success/15 text-success" : "bg-primary-muted text-muted"}`}>
                                {course.is_active ? "نشط" : "غير نشط"}
                              </span>
                            </div>
                          </div>
                          <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary-muted"
                              title="تعديل"
                              aria-label="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  show: true,
                                  type: "course",
                                  id: course.id,
                                  name: course.name,
                                })
                              }
                              className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
                              title="حذف"
                              aria-label="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className={`flex items-center justify-between mb-6 pb-4 border-b border-border ${isRtl ? "flex-row-reverse" : ""}`}>
              <h2 className="text-h3 text-text">
                تعديل المقرر
              </h2>
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({ 
                    name: "", 
                    code: "", 
                    academic_year: "", 
                    program: "", 
                    supervisor: "", 
                    students: [], 
                    description: "", 
                    credits: "", 
                    is_active: true 
                  });
                }}
                className="rounded-lg p-2 transition-colors hover:bg-primary-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    اسم المقرر *
                  </label>
                  <input
                    type="text"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    كود المقرر *
                  </label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    required
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    السنة الأكاديمية
                  </label>
                  <select
                    value={courseForm.academic_year}
                    onChange={(e) => setCourseForm({ ...courseForm, academic_year: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  >
                    <option value="">اختر السنة الأكاديمية</option>
                    {academicYears.map((year) => {
                      const yearId = getYearId(year);
                      if (!yearId || yearId === universityId) return null;
                      return (
                        <option key={yearId} value={yearId}>
                          {year.name}
                          {year.is_active === false ? " (غير نشطة)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    البرنامج
                  </label>
                  <select
                    value={courseForm.program}
                    onChange={(e) => setCourseForm({ ...courseForm, program: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  >
                    <option value="">اختر البرنامج</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} ({program.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    المشرف
                  </label>
                  <select
                    value={courseForm.supervisor}
                    onChange={(e) => setCourseForm({ ...courseForm, supervisor: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  >
                    <option value="">اختر المشرف</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.first_name} {supervisor.last_name} ({supervisor.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-caption font-semibold text-muted">
                    عدد الساعات المعتمدة
                  </label>
                  <input
                    type="number"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })}
                    min="0"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-caption font-semibold text-muted">
                  الطلاب
                </label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-surface">
                  {students.length === 0 ? (
                    <p className="text-muted text-sm">لا توجد طلاب متاحين</p>
                  ) : (
                    students.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-primary-muted/30 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={courseForm.students.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCourseForm({ ...courseForm, students: [...courseForm.students, student.id] });
                            } else {
                              setCourseForm({ ...courseForm, students: courseForm.students.filter((id) => id !== student.id) });
                            }
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="text-sm text-text-secondary">
                          {student.first_name} {student.last_name} ({student.email})
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-caption font-semibold text-muted">
                  الوصف
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-body-sm text-text transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={courseForm.is_active}
                    onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-caption font-semibold text-muted">
                    المقرر نشط
                  </span>
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseForm({ 
                      name: "", 
                      code: "", 
                      academic_year: "", 
                      program: "", 
                      supervisor: "", 
                      students: [], 
                      description: "", 
                      credits: "", 
                      is_active: true 
                    });
                  }}
                  className="rounded-md border border-border px-5 py-2.5 text-body-sm font-semibold text-text-secondary transition-all hover:bg-primary-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-border">
            <h2 className="text-h3 text-text mb-4">
              تأكيد الحذف
            </h2>
            <p className="text-muted mb-6">
              هل أنت متأكد من حذف {deleteConfirm.type === "faculty" ? "الكلية" : deleteConfirm.type === "program" ? "البرنامج" : deleteConfirm.type === "year" ? "السنة الأكاديمية" : "المقرر"}{" "}
              <span className="font-semibold text-text">
                "{deleteConfirm.name}"
              </span>
              ؟
            </p>
            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, type: "", id: "", name: "" })
                }
                className="rounded-md border border-border px-5 py-2.5 text-body-sm font-semibold text-text-secondary transition-all hover:bg-primary-muted"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "faculty") {
                    handleDeleteFaculty();
                  } else if (deleteConfirm.type === "program") {
                    handleDeleteProgram();
                  } else if (deleteConfirm.type === "year") {
                    handleDeleteYear();
                  } else if (deleteConfirm.type === "course") {
                    handleDeleteCourse();
                  }
                }}
                className="rounded-md bg-danger px-5 py-2.5 text-body-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedWrapper>
  );
}


