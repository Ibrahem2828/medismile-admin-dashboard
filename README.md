# 🏥 Medismile-UniversityAdmin

> واجهة أمامية حديثة تربط الطلاب والمشرفين وإداري الجامعة بخدمة خلفية واحدة لإدارة التعليم السريري والأكاديمي.

---

## 🎯 وظيفة المشروع (باختصار)

المشروع **بوابة ويب** لبيئة تعليم طبي/أسنان جامعية: يعرض لوحات ومعلومات حسب **دور المستخدم**، ويربط الواجهة بـ **REST API** للمصادقة، الحالات السريرية، المرفقات، التقييمات، التقارير، المجتمع، المواعيد، والإشعارات. الهدف هو **تنظيم سير العمل الأكاديمي** (متابعة الحالات، التقييم، التوثيق، التواصل) في مكان واحد مع واجهة **عربية/إنجليزية** و**وضع ليلي** و**RTL**.

---

## ✨ ما الذي يقدمه؟

| | |
|--|--|
| 🔐 | تسجيل دخول آمن، صلاحيات حسب الدور، وجلسة مع تجديد التوكن |
| 📚 | حالات سريرية، مرفقات، تقييمات، تقارير، وهيكل أكاديمي |
| 👥 | إدارة طلاب ومشرفين ولوحات إدارية جامعية |
| 💬 | مجتمع، موافقات، بحث، إشعارات، وسجل تدقيق |
| 🌐 | لغتان (AR/EN)، اتجاه RTL، ثيم فاتح/داكن |

---

## 📋 المتطلبات

- [Node.js](https://nodejs.org/) 18 أو أحدث (يُفضَّل LTS)
- npm أو yarn أو pnpm

## 🚀 التثبيت والتشغيل

```bash
git clone <repository-url>
cd My-next15-project
npm install
```

### 💻 وضع التطوير

```bash
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000).

### 🏗️ البناء للإنتاج

```bash
npm run build
npm start
```

### 🔍 فحص الكود

```bash
npm run lint
```

---

## 🔧 متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع (لا ترفعه إلى Git):

| المتغير | الوصف |
|---------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | عنوان REST API الكامل (يتضمن `/api` إن كان مطلوباً من الخادم). إذا لم يُضبط، يُستخدم العنوان الافتراضي المعرَّف في الكود. |

مثال:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.medismile.xn--mgbaab0cxheq.tech/api
```

---

## 🛠️ التقنيات المستخدمة

| الفئة | الأدوات |
|-------|---------|
| ⚛️ الإطار | Next.js 15، React 19 |
| 🗃️ الحالة | Redux Toolkit، React Redux |
| 🌐 الطلبات | Axios (مع اعتراض للتوكن وتحديثه) |
| 🎨 التنسيق | Tailwind CSS 4 |
| 🔷 الأيقونات | Heroicons، Lucide |
| 📊 الرسوم والحركة | Recharts، Framer Motion |
| 🌍 الترجمة | i18next، react-i18next، next-intl |
| 📄 التصدير | jsPDF، xlsx |
| 🔔 الإشعارات | react-hot-toast |

---

## 📁 هيكل المشروع (مختصر)

```
src/
├── app/              # صفحات وتوجيه App Router
├── components/       # مكوّنات واجهة مشتركة
├── hooks/            # خطافات (مثل useRole، useRtl)
├── lib/              # إعدادات الأدوار والبحث والمصادقة
├── redux/            # مخازن Redux والـ slices
├── services/         # استدعاءات API حسب المجال
└── middleware/       # مزامنة المصادقة
public/locales/       # ملفات الترجمة (ar، en)
```

---

## 📌 الميزات الرئيسية (من الوحدات)

- 🔑 تسجيل الدخول والملف الشخصي والإعدادات
- 📊 لوحات وإدارة حسب الدور (طلاب، مشرفون، إداري جامعي)
- 🦷 الحالات السريرية والمرفقات الجامعية والمواعيد
- ✅ التقييمات والتقارير
- 👋 المجتمع وسجل الموافقات
- 🔎 البحث والإشعارات وسجل التدقيق
- 🌙 دعم الوضع الداكن والاتجاه من اليمين لليسار

---

## 📄 الترخيص

هذا المستودع خاص (`private: true` في `package.json`). حدِّد الترخيص المناسب عند نشر المشروع علناً.

---

## 🌍 English summary

**My Next 15 Project** is a Next.js 15 + React 19 **frontend** for academic/clinical workflows: it connects students, supervisors, and university admins to one **REST API** for cases, attachments, evaluations, reports, community, appointments, and notifications—with **AR/EN** i18n, **dark mode**, and **RTL**. Configure **`NEXT_PUBLIC_API_BASE_URL`** as in **Environment variables** above.
