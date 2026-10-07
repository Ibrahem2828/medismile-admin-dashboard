/**
 * نظام البحث المتقدم - IR (Information Retrieval) Use Case
 * يتضمن: Relevance Scoring, Field Weighting, Ranking Algorithm, Highlighting
 */

import { createElement } from "react";

/**
 * Field Weights محسّنة لكل نوع محتوى
 */
const FIELD_WEIGHTS = {
  students: {
    studentName: 12,
    first_name: 10,
    last_name: 10,
    email: 8,
    username: 7,
    student_id: 9,
    studentNumber: 9,
    specialization: 6,
    specialty: 6,
    phone_number: 5,
  },
  supervisors: {
    supervisorName: 12,
    first_name: 10,
    last_name: 10,
    email: 8,
    username: 7,
    department: 8,
    position: 7,
    license_number: 9,
    phone_number: 5,
  },
  cases: {
    title: 10,
    patient_name: 8,
    description: 5,
    student_name: 6,
    supervisor_name: 6,
    status: 3,
    priority: 4
  },
  appointments: {
    title: 10,
    patient_name: 8,
    student_name: 6,
    supervisor_name: 6,
    notes: 7,
    status: 3
  },
  evaluations: {
    title: 10,
    description: 7,
    student_name: 8,
    supervisor_name: 6,
    status: 3
  },
  sessions: {
    case_title: 10,
    notes: 8,
    description: 5
  },
  reports: {
    title: 10,
    description: 7,
    student_name: 8,
    supervisor_name: 6
  }
};

/**
 * حساب Relevance Score لعنصر واحد
 * @param {Object} item - العنصر للبحث فيه
 * @param {string} query - كلمة البحث
 * @param {Object} fieldWeights - أوزان الحقول
 * @returns {number} Relevance Score
 */
const calculateRelevanceScore = (item, query, fieldWeights) => {
  if (!item || !query || !fieldWeights) return 0;

  const searchTerm = query.toLowerCase().trim();
  const searchTerms = searchTerm.split(/\s+/).filter(t => t.length > 0);
  let totalScore = 0;

  // البحث في كل حقل
  Object.keys(fieldWeights).forEach(field => {
    const weight = fieldWeights[field];
    const value = item[field];

    if (value === null || value === undefined) return;

    const stringValue = String(value).toLowerCase();
    
    // البحث في كل كلمة من كلمات البحث
    searchTerms.forEach(term => {
      if (!stringValue.includes(term)) return;

      let fieldScore = 0;

      // 1. Field Weighting - وزن الحقل
      fieldScore += weight;

      // 2. Exact Match Bonus - مكافأة للمطابقة التامة
      if (stringValue === term) {
        fieldScore += 20; // مكافأة كبيرة للمطابقة التامة
      } else if (stringValue === term + ' ' || stringValue.startsWith(term + ' ') || stringValue.endsWith(' ' + term)) {
        fieldScore += 10; // مكافأة متوسطة
      }

      // 3. Position Bonus - مكافأة للمطابقة في بداية النص
      const position = stringValue.indexOf(term);
      if (position === 0) {
        fieldScore += 15; // في البداية
      } else if (position < stringValue.length * 0.3) {
        fieldScore += 8; // في الثلث الأول
      } else if (position < stringValue.length * 0.6) {
        fieldScore += 4; // في النصف الأول
      }

      // 4. Frequency Bonus - مكافأة لعدد مرات ظهور الكلمة
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = stringValue.match(regex);
      const frequency = matches ? matches.length : 0;
      if (frequency > 1) {
        fieldScore += Math.min(frequency * 2, 10); // حتى 10 نقاط إضافية
      }

      totalScore += fieldScore;
    });
  });

  return totalScore;
};

/**
 * حساب Date Recency Score (0-100)
 * @param {string|Date} date - التاريخ
 * @returns {number} Recency Score
 */
const calculateDateRecencyScore = (date) => {
  if (!date) return 50; // قيمة متوسطة إذا لم يكن هناك تاريخ

  try {
    const itemDate = new Date(date);
    const now = new Date();
    const diffTime = now - itemDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // الأحدث أفضل (0-30 يوم = 100, 30-90 يوم = 70, 90-180 يوم = 50, أكثر = 30)
    if (diffDays <= 30) return 100;
    if (diffDays <= 90) return 70;
    if (diffDays <= 180) return 50;
    return 30;
  } catch {
    return 50;
  }
};

/**
 * حساب Status Priority Score (0-100)
 * @param {string} status - الحالة
 * @param {string} type - نوع المحتوى
 * @returns {number} Status Score
 */
const calculateStatusPriorityScore = (status, type) => {
  if (!status) return 50;

  const statusLower = status.toLowerCase();

  // الحالات المهمة تحصل على نقاط أعلى
  const priorityStatuses = {
    cases: {
      'in_progress': 100,
      'assigned': 90,
      'needs_assignment_approval': 85,
      'new': 80,
      'accepted': 75,
      'completed': 70,
      'closed': 50,
      'rejected': 40
    },
    appointments: {
      'scheduled': 100,
      'rescheduled': 90,
      'completed': 80,
      'cancelled': 30,
      'no_show': 20
    },
    evaluations: {
      'submitted': 100,
      'draft': 80,
      'final': 90,
      'pending': 70
    }
  };

  const typeStatuses = priorityStatuses[type] || {};
  return typeStatuses[statusLower] || 50;
};

/**
 * حساب Final Score للترتيب
 * @param {number} relevanceScore - Relevance Score
 * @param {number} dateRecencyScore - Date Recency Score
 * @param {number} statusPriorityScore - Status Priority Score
 * @returns {number} Final Score
 */
const calculateFinalScore = (relevanceScore, dateRecencyScore, statusPriorityScore) => {
  // Normalize relevance score to 0-100 range (نقوم بتطبيعها)
  const normalizedRelevance = Math.min(relevanceScore / 10, 100);

  // Ranking Algorithm:
  // Relevance Score (70%) + Date Recency (20%) + Status Priority (10%)
  const finalScore = 
    (normalizedRelevance * 0.70) +
    (dateRecencyScore * 0.20) +
    (statusPriorityScore * 0.10);

  return finalScore;
};

/**
 * البحث المتقدم مع Relevance Scoring
 * @param {Array} array - المصفوفة للبحث فيها
 * @param {string} query - كلمة البحث
 * @param {Object} fieldWeights - أوزان الحقول
 * @param {Object} options - خيارات إضافية
 * @returns {Array} النتائج مع Relevance Score ومرتبة
 */
export const searchWithRelevance = (array, query, fieldWeights, options = {}) => {
  if (!query || !array || !Array.isArray(array)) return [];
  
  const searchTerm = query.trim();
  if (searchTerm === "") return [];

  const { 
    dateField = 'created_at', 
    statusField = 'status',
    type = 'general' 
  } = options;

  // حساب Relevance Score لكل عنصر
  const itemsWithScore = array
    .map(item => {
      if (!item) return null;

      const relevanceScore = calculateRelevanceScore(item, query, fieldWeights);
      
      // إذا كان Score = 0، لا نعيد العنصر
      if (relevanceScore === 0) return null;

      const dateRecencyScore = calculateDateRecencyScore(item[dateField]);
      const statusPriorityScore = calculateStatusPriorityScore(item[statusField], type);
      const finalScore = calculateFinalScore(relevanceScore, dateRecencyScore, statusPriorityScore);

      return {
        ...item,
        _relevanceScore: relevanceScore,
        _dateRecencyScore: dateRecencyScore,
        _statusPriorityScore: statusPriorityScore,
        _finalScore: finalScore
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => b._finalScore - a._finalScore); // ترتيب تنازلي حسب Final Score

  return itemsWithScore;
};

/**
 * البحث في الطلاب مع Relevance Scoring
 */
export const searchStudents = (students, query) => {
  return searchWithRelevance(
    students || [],
    query,
    FIELD_WEIGHTS.students,
    { type: 'students' }
  );
};

/**
 * البحث في المشرفين مع Relevance Scoring
 */
export const searchSupervisors = (supervisors, query) => {
  return searchWithRelevance(
    supervisors || [],
    query,
    FIELD_WEIGHTS.supervisors,
    { type: 'supervisors' }
  );
};

/**
 * البحث في الحالات السريرية مع Relevance Scoring
 */
export const searchCases = (cases, query) => {
  return searchWithRelevance(
    cases || [],
    query,
    FIELD_WEIGHTS.cases,
    { 
      type: 'cases',
      dateField: 'created_at',
      statusField: 'status'
    }
  );
};

/**
 * البحث في المواعيد مع Relevance Scoring
 */
export const searchAppointments = (appointments, query) => {
  return searchWithRelevance(
    appointments || [],
    query,
    FIELD_WEIGHTS.appointments,
    { 
      type: 'appointments',
      dateField: 'appointment_date',
      statusField: 'status'
    }
  );
};

/**
 * البحث في التقييمات مع Relevance Scoring
 */
export const searchEvaluations = (evaluations, query) => {
  return searchWithRelevance(
    evaluations || [],
    query,
    FIELD_WEIGHTS.evaluations,
    { 
      type: 'evaluations',
      dateField: 'created_at',
      statusField: 'status'
    }
  );
};

/**
 * البحث في الجلسات مع Relevance Scoring
 */
export const searchSessions = (sessions, query) => {
  return searchWithRelevance(
    sessions || [],
    query,
    FIELD_WEIGHTS.sessions,
    { 
      type: 'sessions',
      dateField: 'session_date',
      statusField: 'status'
    }
  );
};

/**
 * البحث في التقارير مع Relevance Scoring
 */
export const searchReports = (reports, query) => {
  return searchWithRelevance(
    reports || [],
    query,
    FIELD_WEIGHTS.reports,
    { 
      type: 'reports',
      dateField: 'created_at',
      statusField: 'status'
    }
  );
};

/**
 * البحث الموحد في جميع أنواع البيانات مع Relevance Scoring
 * @param {string} query - كلمة البحث
 * @param {Object} data - البيانات من Redux Store
 * @returns {Object} النتائج منظمة حسب النوع ومرتبة
 */
export const unifiedSearch = (query, data) => {
  if (!query || query.trim() === "") {
    return {
      students: [],
      supervisors: [],
      cases: [],
      appointments: [],
      evaluations: [],
      sessions: [],
      reports: [],
      total: 0
    };
  }

  const students = searchStudents(data.students || [], query);
  const supervisors = searchSupervisors(data.supervisors || [], query);
  const cases = searchCases(data.cases || [], query);
  const appointments = searchAppointments(data.appointments || [], query);
  const evaluations = searchEvaluations(data.evaluations || [], query);
  const sessions = searchSessions(data.sessions || [], query);
  const reports = searchReports(data.reports || [], query);

  const total = students.length + supervisors.length + cases.length + 
                appointments.length + evaluations.length + sessions.length + reports.length;

  return {
    students,
    supervisors,
    cases,
    appointments,
    evaluations,
    sessions,
    reports,
    total
  };
};

/**
 * دالة مساعدة لتحديد ما إذا كانت النتيجة مطابقة
 * تستخدم لتلوين الكلمات المطابقة (Highlight)
 * @param {string} text - النص
 * @param {string} query - كلمة البحث
 * @returns {string} النص مع تمييز الكلمات المطابقة
 */
export const highlightMatch = (text, query) => {
  if (!text || !query) return text;
  
  // Escape special regex characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>');
};

/**
 * دالة مساعدة لعرض النص مع Highlighting (للاستخدام في React)
 * @param {string} text - النص
 * @param {string} query - كلمة البحث
 * @returns {Array} Array of React elements
 */
export const highlightMatchReact = (text, query) => {
  if (!text || !query) return text;

  const escapedQuery = String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escapedQuery})`, "gi"));
  const matcher = new RegExp(`^${escapedQuery}$`, "i");

  return parts.map((part, index) => {
    if (part && matcher.test(part)) {
      return createElement(
        "mark",
        {
          key: index,
          className: "rounded-sm bg-warning/30 px-0.5 text-text",
        },
        part
      );
    }
    return part;
  });
};

/**
 * دالة البحث القديمة (للتوافق مع الكود القديم)
 * @deprecated استخدم searchWithRelevance بدلاً منها
 */
export const searchInArray = (array, query, fields) => {
  if (!query || !array || !Array.isArray(array)) return [];
  
  const searchTerm = query.toLowerCase().trim();
  if (searchTerm === "") return [];
  
  return array.filter(item => {
    if (!item) return false;
    
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      
      const stringValue = String(value).toLowerCase();
      return stringValue.includes(searchTerm);
    });
  });
};
