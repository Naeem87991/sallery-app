import type { AppLanguage } from '@/types/domain';

export const translations = {
  en: {
    home: 'Home', attendance: 'Attendance', company: 'Company', pocket: 'Pocket', settings: 'Settings', careerHistory: 'Career history', reports: 'Reports',
    skipToContent: 'Skip to page content', mainNavigation: 'Main navigation', primaryNavigation: 'Primary navigation',
    hideValues: 'Hide values', showValues: 'Show values', hideFinancialValues: 'Hide financial values', showFinancialValues: 'Show financial values',
    offlineReady: 'Offline ready', privateByDesign: 'Private by design', storedOnDevice: 'Stored on this device',
    financialValuesVisible: 'Financial values are visible.', financialValuesHidden: 'Financial values are hidden.', checkingLocalSecurity: 'Checking local security…',
    language: 'Language', english: 'English', urdu: 'Urdu', theme: 'Theme', darkNeon: 'Dark neon', light: 'Light',
    saveChanges: 'Save changes', saving: 'Saving…', savedLocally: 'Saved locally.', localOnly: 'Changes remain on this device.',
    setupFirst: 'Set up your workspace first.', startSetup: 'Start setup', lowCashThreshold: 'Low-cash threshold (PKR)', lowCashHint: 'Set zero to turn the local low-cash alert off. Alerts appear in the pocket view while the app is open.',
    privacyMode: 'Privacy mode at startup', privacyHint: 'Blurs financial figures until you reveal them.',
    lowCashAlert: 'Low cash alert', adjust: 'Adjust', udhaarReminders: 'Udhaar reminders', clearReminder: 'Clear reminder', clearing: 'Clearing…',
    savingsTransfer: 'Savings transfer', saveTransfer: 'Save transfer', transferSaved: 'Transfer saved and goal balance updated.',
  },
  ur: {
    home: 'ہوم', attendance: 'حاضری', company: 'کمپنی', pocket: 'ذاتی رقم', settings: 'ترتیبات', careerHistory: 'کیریئر کی تاریخ', reports: 'رپورٹس',
    skipToContent: 'صفحہ کے مواد پر جائیں', mainNavigation: 'مرکزی نیویگیشن', primaryNavigation: 'بنیادی نیویگیشن',
    hideValues: 'رقمیں چھپائیں', showValues: 'رقمیں دکھائیں', hideFinancialValues: 'مالی رقوم چھپائیں', showFinancialValues: 'مالی رقوم دکھائیں',
    offlineReady: 'آف لائن تیار', privateByDesign: 'رازداری کے لیے تیار', storedOnDevice: 'اسی ڈیوائس پر محفوظ',
    financialValuesVisible: 'مالی رقوم دکھائی جا رہی ہیں۔', financialValuesHidden: 'مالی رقوم چھپائی گئی ہیں۔', checkingLocalSecurity: 'مقامی سکیورٹی چیک ہو رہی ہے…',
    language: 'زبان', english: 'انگریزی', urdu: 'اردو', theme: 'تھیم', darkNeon: 'گہرا نیون', light: 'روشن',
    saveChanges: 'تبدیلیاں محفوظ کریں', saving: 'محفوظ ہو رہا ہے…', savedLocally: 'مقامی طور پر محفوظ ہو گیا۔', localOnly: 'تبدیلیاں اسی ڈیوائس پر رہیں گی۔',
    setupFirst: 'پہلے اپنا ورک اسپیس سیٹ اپ کریں۔', startSetup: 'سیٹ اپ شروع کریں', lowCashThreshold: 'کم رقم کی حد (PKR)', lowCashHint: 'مقامی کم رقم کا الرٹ بند کرنے کے لیے صفر رکھیں۔ ایپ کھلی ہونے پر یہ الرٹ ذاتی رقم کے صفحے پر دکھائی دیتا ہے۔',
    privacyMode: 'شروع میں رازداری موڈ', privacyHint: 'مالی رقوم کو دکھانے تک دھندلا رکھیں۔',
    lowCashAlert: 'کم رقم کا الرٹ', adjust: 'تبدیل کریں', udhaarReminders: 'ادھار یاد دہانیاں', clearReminder: 'یاد دہانی صاف کریں', clearing: 'صاف ہو رہا ہے…',
    savingsTransfer: 'سیونگ ٹرانسفر', saveTransfer: 'ٹرانسفر محفوظ کریں', transferSaved: 'ٹرانسفر اور گول کی رقم محفوظ ہو گئی۔',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function translate(language: AppLanguage | undefined, key: TranslationKey): string {
  return translations[language === 'ur' ? 'ur' : 'en'][key];
}
