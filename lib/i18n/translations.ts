import type { AppLanguage } from '@/types/domain';

export const translations = {
  en: {
    home: 'Home', attendance: 'Attendance', company: 'Company', pocket: 'Pocket', settings: 'Settings', careerHistory: 'Career history', reports: 'Reports',
    skipToContent: 'Skip to page content', mainNavigation: 'Main navigation', primaryNavigation: 'Primary navigation',
    hideValues: 'Hide values', showValues: 'Show values', hideFinancialValues: 'Hide financial values', showFinancialValues: 'Show financial values',
    offlineReady: 'Offline ready', privateByDesign: 'Private by design', storedOnDevice: 'Stored on this device',
    financialValuesVisible: 'Financial values are visible.', financialValuesHidden: 'Financial values are hidden.', checkingLocalSecurity: 'Checking local security…',
    language: 'Language', english: 'English', urdu: 'Urdu', theme: 'Theme', darkNeon: 'Dark neon', light: 'Light',
    saveChanges: 'Save changes', saving: 'Saving…', savedLocally: 'Saved locally.', changesRemainLocal: 'Changes remain on this device.',
    setupFirst: 'Set up your workspace first.', startSetup: 'Start setup', lowCashThreshold: 'Low-cash threshold (PKR)', lowCashHint: 'Set zero to turn the local low-cash alert off. Alerts appear in the pocket view while the app is open.',
    privacyMode: 'Privacy mode at startup', privacyHint: 'Blurs financial figures until you reveal them.',
    lowCashAlert: 'Low cash alert', adjust: 'Adjust', udhaarReminders: 'Udhaar reminders', clearReminder: 'Clear reminder', clearing: 'Clearing…',
    savingsTransfer: 'Savings transfer', saveTransfer: 'Save transfer', transferSaved: 'Transfer saved and goal balance updated.',
    privateWorkspace: 'Private finance workspace', welcome: 'Welcome', companyBalance: 'Company balance', personalPocket: 'Personal pocket', baseSalary: 'Base salary', openReports: 'Open reports',
    localOnly: 'Local only', availableCredit: 'Available credit', perMonth: 'Per month', perDay: 'Per day',
    attendancePage: 'Attendance', companyLedger: 'Company ledger', careerPage: 'Career history', reportsPage: 'Reports',
    loadingAttendance: 'Loading your local attendance…', attendanceTitle: 'Your time, on record.', attendanceSubtitle: 'Mark each day your way. Automatic defaults never replace what you record yourself.',
    loadingCompany: 'Loading your local company ledger…', companyTitle: 'Know what’s outstanding.', companySubtitle: 'Log company movements and track each loan repayment locally. Totals always come from the full record.', currentCompanyBalance: 'Current company balance',
    loadingCareer: 'Loading your local career history…', careerTitle: 'See the long view of your work.', careerSubtitle: 'Past roles are archived here, separately from today’s live salary and personal pocket.',
    loadingReports: 'Preparing your local report data…', reportsTitle: 'Take your records with you.', reportsSubtitle: 'Exports are prepared in your browser from this device’s records. Nothing is sent to a server.',
    setupTitle: 'Set up your workspace first.', setupAttendance: 'Attendance follows the shift and weekly-off rules you choose during setup.', setupCompany: 'Your private company ledger is ready after local salary setup.', setupCareer: 'Your current role provides the starting point for a private employment history.', setupReports: 'Reports use the private records created after local salary setup.',
    availableCompanyCredit: 'Available company credit', companyDeductions: 'Company deductions exceed credits', localLedger: 'Local ledger', credits: 'Credits', deductions: 'Deductions', loansDue: 'Loans due', entries: 'Entries',
    loanTracker: 'Loan tracker', loanTrackerTitle: 'Issue and settle company loans.', newEntry: 'New entry', recentActivity: 'Recent activity',
    estimatedLifetimeEarnings: 'Estimated lifetime earnings', currentRole: 'Current role', pastEmployment: 'Past employment', yourHistory: 'Your history',
    historicalRoles: 'past roles', fromHistory: 'from history', currentPosition: 'Current position', currentRoleSince: 'current role since', estimatedMonthlySalary: 'estimated monthly salary',
    localReports: 'Local reports', csvReport: 'CSV report', pdfReport: 'PDF report', printableVoucher: 'Printable voucher', downloadCsv: 'Download CSV', downloadPdf: 'Download PDF', downloadVoucher: 'Download voucher',
  },
  ur: {
    home: 'ہوم', attendance: 'حاضری', company: 'کمپنی', pocket: 'ذاتی رقم', settings: 'ترتیبات', careerHistory: 'کیریئر کی تاریخ', reports: 'رپورٹس',
    skipToContent: 'صفحہ کے مواد پر جائیں', mainNavigation: 'مرکزی نیویگیشن', primaryNavigation: 'بنیادی نیویگیشن',
    hideValues: 'رقمیں چھپائیں', showValues: 'رقمیں دکھائیں', hideFinancialValues: 'مالی رقوم چھپائیں', showFinancialValues: 'مالی رقوم دکھائیں',
    offlineReady: 'آف لائن تیار', privateByDesign: 'رازداری کے لیے تیار', storedOnDevice: 'اسی ڈیوائس پر محفوظ',
    financialValuesVisible: 'مالی رقوم دکھائی جا رہی ہیں۔', financialValuesHidden: 'مالی رقوم چھپائی گئی ہیں۔', checkingLocalSecurity: 'مقامی سکیورٹی چیک ہو رہی ہے…',
    language: 'زبان', english: 'انگریزی', urdu: 'اردو', theme: 'تھیم', darkNeon: 'گہرا نیون', light: 'روشن',
    saveChanges: 'تبدیلیاں محفوظ کریں', saving: 'محفوظ ہو رہا ہے…', savedLocally: 'مقامی طور پر محفوظ ہو گیا۔', changesRemainLocal: 'تبدیلیاں اسی ڈیوائس پر رہیں گی۔',
    setupFirst: 'پہلے اپنا ورک اسپیس سیٹ اپ کریں۔', startSetup: 'سیٹ اپ شروع کریں', lowCashThreshold: 'کم رقم کی حد (PKR)', lowCashHint: 'مقامی کم رقم کا الرٹ بند کرنے کے لیے صفر رکھیں۔ ایپ کھلی ہونے پر یہ الرٹ ذاتی رقم کے صفحے پر دکھائی دیتا ہے۔',
    privacyMode: 'شروع میں رازداری موڈ', privacyHint: 'مالی رقوم کو دکھانے تک دھندلا رکھیں۔',
    lowCashAlert: 'کم رقم کا الرٹ', adjust: 'تبدیل کریں', udhaarReminders: 'ادھار یاد دہانیاں', clearReminder: 'یاد دہانی صاف کریں', clearing: 'صاف ہو رہا ہے…',
    savingsTransfer: 'سیونگ ٹرانسفر', saveTransfer: 'ٹرانسفر محفوظ کریں', transferSaved: 'ٹرانسفر اور گول کی رقم محفوظ ہو گئی۔',
    privateWorkspace: 'نجی مالی ورک اسپیس', welcome: 'خوش آمدید', companyBalance: 'کمپنی بیلنس', personalPocket: 'ذاتی رقم', baseSalary: 'بنیادی تنخواہ', openReports: 'رپورٹس کھولیں',
    localOnly: 'صرف مقامی', availableCredit: 'دستیاب کریڈٹ', perMonth: 'فی ماہ', perDay: 'فی دن',
    attendancePage: 'حاضری', companyLedger: 'کمپنی لیجر', careerPage: 'کیریئر کی تاریخ', reportsPage: 'رپورٹس',
    loadingAttendance: 'آپ کی مقامی حاضری لوڈ ہو رہی ہے…', attendanceTitle: 'آپ کا وقت، ریکارڈ پر۔', attendanceSubtitle: 'ہر دن کو اپنی مرضی سے درج کریں۔ خودکار ڈیفالٹس آپ کے دستی ریکارڈ کو تبدیل نہیں کرتے۔',
    loadingCompany: 'آپ کا مقامی کمپنی لیجر لوڈ ہو رہا ہے…', companyTitle: 'جانیں کتنا باقی ہے۔', companySubtitle: 'کمپنی کی نقل و حرکت درج کریں اور ہر قرض کی واپسی مقامی طور پر دیکھیں۔ کل ہمیشہ مکمل ریکارڈ سے آتے ہیں۔', currentCompanyBalance: 'موجودہ کمپنی بیلنس',
    loadingCareer: 'آپ کی مقامی کیریئر تاریخ لوڈ ہو رہی ہے…', careerTitle: 'اپنے کام کی طویل تصویر دیکھیں۔', careerSubtitle: 'گزشتہ عہدے یہاں محفوظ رہتے ہیں، آج کی تنخواہ اور ذاتی رقم سے الگ۔',
    loadingReports: 'آپ کا مقامی رپورٹ ڈیٹا تیار ہو رہا ہے…', reportsTitle: 'اپنے ریکارڈ ساتھ لے جائیں۔', reportsSubtitle: 'ایکسپورٹس اسی ڈیوائس کے ریکارڈ سے آپ کے براؤزر میں بنتی ہیں۔ کچھ سرور پر نہیں جاتا۔',
    setupTitle: 'پہلے اپنا ورک اسپیس سیٹ اپ کریں۔', setupAttendance: 'حاضری سیٹ اپ میں منتخب کی گئی شفٹ اور ہفتہ وار چھٹی کے اصولوں پر چلتی ہے۔', setupCompany: 'مقامی تنخواہ سیٹ اپ کے بعد آپ کا نجی کمپنی لیجر تیار ہے۔', setupCareer: 'آپ کا موجودہ عہدہ نجی ملازمت کی تاریخ کے لیے نقطۂ آغاز ہے۔', setupReports: 'رپورٹس مقامی تنخواہ سیٹ اپ کے بعد بنائے گئے نجی ریکارڈ استعمال کرتی ہیں۔',
    availableCompanyCredit: 'دستیاب کمپنی کریڈٹ', companyDeductions: 'کمپنی کی کٹوتیاں کریڈٹس سے زیادہ ہیں', localLedger: 'مقامی لیجر', credits: 'کریڈٹس', deductions: 'کٹوتیاں', loansDue: 'واجب الادا قرضے', entries: 'اندراجات',
    loanTracker: 'قرض ٹریکر', loanTrackerTitle: 'کمپنی کے قرضے جاری اور مکمل کریں۔', newEntry: 'نیا اندراج', recentActivity: 'حالیہ سرگرمی',
    estimatedLifetimeEarnings: 'تخمینی زندگی بھر کی آمدنی', currentRole: 'موجودہ عہدہ', pastEmployment: 'گزشتہ ملازمت', yourHistory: 'آپ کی تاریخ',
    historicalRoles: 'گزشتہ عہدے', fromHistory: 'تاریخ سے', currentPosition: 'موجودہ پوزیشن', currentRoleSince: 'موجودہ عہدہ شروع', estimatedMonthlySalary: 'تخمینی ماہانہ تنخواہ',
    localReports: 'مقامی رپورٹس', csvReport: 'CSV رپورٹ', pdfReport: 'PDF رپورٹ', printableVoucher: 'پرنٹ ایبل واؤچر', downloadCsv: 'CSV ڈاؤن لوڈ کریں', downloadPdf: 'PDF ڈاؤن لوڈ کریں', downloadVoucher: 'واؤچر ڈاؤن لوڈ کریں',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function translate(language: AppLanguage | undefined, key: TranslationKey): string {
  return translations[language === 'ur' ? 'ur' : 'en'][key];
}
