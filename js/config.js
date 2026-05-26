// ============================================================
// Frontend configuration
// English keys internally — Arabic only in display labels
// ============================================================

var CONFIG = {
  // Google Apps Script Web App URL — fill after deployment
  API_URL: 'https://script.google.com/macros/s/AKfycbx9lF2YXQJWV_bbYvgtkwzQFkjaw2PifFDQ5ouVu4BJI-BVC2K5DYD75GwkkteO_p9UYg/exec',

  // ---- Brand colors (Saudi Energy logo) ----
  BRAND: {
    primary:   '#0066B3',
    secondary: '#00AEEF',
    accent:    '#00C5A3',
    dark:      '#004A8F',
    light:     '#E8F4FF'
  },

  // ---- Shift status display colors ----
  // Status values from API: 'morning' | 'evening' | 'off'
  STATUS: {
    morning: { bg:'#E3F2FD', text:'#0D47A1', badge:'#1976D2', icon:'☀',  label:'صباح'  },
    evening: { bg:'#EDE7F6', text:'#4527A0', badge:'#5E35B1', icon:'🌙', label:'مساء'  },
    off:     { bg:'#F5F5F5', text:'#616161', badge:'#9E9E9E', icon:'—',  label:'إجازة' }
  },

  // ---- Shift letter colors (A/B/C/D) ----
  SHIFTS: {
    a: { label:'أ', bg:'#DBEAFE', border:'#1565C0', text:'#1E3A8A', solid:'#1565C0' },
    b: { label:'ب', bg:'#CCFBF1', border:'#00695C', text:'#134E4A', solid:'#00838F' },
    c: { label:'ج', bg:'#DCFCE7', border:'#166534', text:'#14532D', solid:'#2E7D32' },
    d: { label:'د', bg:'#F3E8FF', border:'#6B21A8', text:'#581C87', solid:'#6A1B9A' }
  },

  // ---- Card expiry color thresholds ----
  EXPIRY: {
    safe:   { min:180, bg:'#C8E6C9', text:'#1B5E20' },  // > 180 days
    warn:   { min:85,  bg:'#FFE0B2', text:'#E65100' },  // 85-179
    alert:  { min:10,  bg:'#FFF9C4', text:'#F57F17' },  // 10-84
    danger: { min:-999,bg:'#FFCDD2', text:'#B71C1C' }   // < 10 or expired
  },

  // ---- Leave types (internal key: Arabic label) ----
  LEAVE_TYPES: [
    { key:'annual',    label:'سنوية' },
    { key:'sick',      label:'مرضية' },
    { key:'marriage',  label:'زواج' },
    { key:'birth',     label:'مولود' },
    { key:'death',     label:'وفاة' },
    { key:'exam',      label:'اختبارات' },
    { key:'shift_sub', label:'بدل دورة عمل' }
  ],

  // ---- Overtime hours options ----
  OT_HOURS: [0.25, 0.5, 1, 2, 3, 4, 5, 6],

  // ---- Regions ----
  REGIONS: [
    { key:'north', label:'شمال' },
    { key:'south', label:'جنوب' },
    { key:'east',  label:'شرق' },
    { key:'west',  label:'غرب' },
    { key:'center',label:'وسط' }
  ],

  // ---- Roles ----
  ROLES: [
    { key:'admin',      label:'مدير' },
    { key:'supervisor', label:'مشرف' },
    { key:'employee',   label:'موظف' },
    { key:'viewer',     label:'اداري' }
  ],

  // ---- Arabic display labels for employee fields ----
  FIELD_LABELS: {
    empId:         'الرقم الوظيفي',
    name:          'الاسم',
    phone:         'رقم الجوال',
    shift:         'الوردية',
    role:          'الصلاحية',
    region:        'المنطقة',
    center:        'اسم المركز',
    car:           'رقم السيارة',
    cat2:          'مقاس CAT 2',
    pants:         'مقاس البنطلون CAT 2',
    shoes:         'مقاس السفتي شوز',
    cat4:          'مقاس CAT 4',
    workExpDate:   'تاريخ انتهاء بطاقة العمل',
    srcExpDate:    'تاريخ انتهاء بطاقة المصدر',
    recvExpDate:   'تاريخ انتهاء بطاقة المستلم',
    annLeave:      'رصيد الاجازات السنوية',
    schedLeave:    'الاجازة المجدولة',
    remLeave:      'المتبقي من الاجازات',
    sickLeave:     'رصيد مرضي',
    marriageLeave: 'رصيد زواج',
    birthLeave:    'رصيد مولود',
    deathLeave:    'رصيد وفاة',
    examLeave:     'رصيد اختبارات',
    shiftSubLeave: 'رصيد بدل دورة عمل',
    regDate:       'تاريخ التسجيل'
  },

  // ---- Status label map ----
  STATUS_LABELS: {
    pending_review: 'قيد المراجعة',
    approved:       'معتمد',
    rejected:       'مرفوض',
    unread:         'غير مقروء',
    read:           'مقروء'
  },

  // ---- Days and months (Arabic) ----
  DAYS_AR:   ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
  MONTHS_AR: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  HIJRI_MONTHS: ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'],

  // Helper: get expiry color class based on days left
  expiryColor: function(daysLeft) {
    if (daysLeft === null) return null;
    if (daysLeft > 180) return CONFIG.EXPIRY.safe;
    if (daysLeft >= 85) return CONFIG.EXPIRY.warn;
    if (daysLeft >= 10) return CONFIG.EXPIRY.alert;
    return CONFIG.EXPIRY.danger;
  },

  // Helper: translate internal shift key to Arabic label
  shiftLabel: function(key) {
    var s = CONFIG.SHIFTS[key];
    return s ? 'وردية ' + s.label : (key || '');
  },

  // Helper: translate status key to Arabic label
  statusLabel: function(key) {
    return CONFIG.STATUS_LABELS[key] || key;
  }
};
