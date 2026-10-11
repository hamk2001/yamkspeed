import type { TranslationSchema } from './en';

export const ar: TranslationSchema = {
  app: {
    name: 'YamkSpeed',
    tagline: 'مقياس سرعة صادق وخالٍ من الإعلانات',
    version: '1.0',
  },
  nav: {
    themeDark: 'الوضع الداكن',
    themeLight: 'الوضع الفاتح',
    langArabic: 'العربية',
    langEnglish: 'English',
    auditRtl: 'فحص الاتجاه (RTL)',
    history: 'السجل',
    settings: 'الإعدادات',
  },
  metrics: {
    download: 'التنزيل',
    upload: 'الرفع',
    latency: 'الاستجابة',
    jitter: 'تقلب الإشارة',
    mbps: 'م.بت/ث',
    ms: 'مللي ثانية',
    bytes: 'البيانات المستهلكة',
    server: 'الخادم',
    engine: 'محرك الفحص',
  },
  phases: {
    idle: 'جاهز لبدء الفحص',
    locating: 'جارٍ تحديد أقرب خادم قياس...',
    latency: 'جارٍ قياس زمن الاستجابة والتقلب...',
    download: 'جارٍ فحص سرعة التنزيل...',
    upload: 'جارٍ فحص سرعة الرفع...',
    completed: 'اكتمل الفحص بنجاح',
    aborted: 'تم إلغاء الفحص',
    error: 'فشل الفحص',
  },
  actions: {
    start: 'ابدأ',
    abort: 'إلغاء',
    retest: 'إعادة الفحص',
    share: 'مشاركة النتيجة',
    copyLink: 'نسخ الملخص',
    clearHistory: 'مسح السجل',
  },
  errors: {
    offline: 'يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك.',
    captivePortal: 'تم اكتشاف بوابة تسجيل دخول للشبكة! يرجى تسجيل الدخول أولاً.',
    rateLimited: 'نظام الكبح مفعّل. يرجى الانتظار {seconds} ثانية قبل إعادة الفحص.',
    timeout: 'انتهت مهلة الفحص. لم يستجب الخادم في الوقت المحدد.',
    serverUnreachable: 'تعذر الوصول إلى خوادم القياس.',
    multiTab: 'يوجد فحص يعمل حالياً في علامة تبويب أخرى.',
  },
  settings: {
    lightTestMode: 'وضع الفحص الخفيف (توفير البيانات ≤10م.ب)',
    lightTestDesc: 'تقليل مدة الفحص وحجم البيانات المستهلكة للشبكات المحدودة.',
    soundEffects: 'المؤثرات الصوتية',
  },
  footer: {
    attribution: 'مدعوم بشبكات قياس عامة ومستقلة.',
    license: 'مفتوح المصدر بموجب رخصة MIT.',
  },
};
