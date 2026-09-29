'use client';

import { useEffect } from 'react';
import type { AppLanguage } from '@/types/domain';

const urdu: Record<string, string> = {
  'PRIVATE FINANCE WORKSPACE': 'نجی مالی ورک اسپیس', 'LIVE SALARY TICKER': 'لائیو سیلری ٹِکر', 'ATTENDANCE': 'حاضری', 'COMPANY LEDGER': 'کمپنی لیجر', 'PERSONAL POCKET': 'ذاتی رقم', 'CAREER HISTORY': 'کیریئر کی تاریخ', 'LOCAL REPORTS': 'مقامی رپورٹس', 'SETTINGS': 'ترتیبات',
  'LOAN TRACKER': 'قرض ٹریکر', 'NEW ENTRY': 'نیا اندراج', 'POCKET LEDGER': 'ذاتی لیجر', 'SAVINGS GOALS': 'سیونگ گولز', 'SAVINGS TRANSFER': 'سیونگ ٹرانسفر', 'UDHAAR REMINDERS': 'ادھار یاد دہانیاں', 'CURRENT ROLE': 'موجودہ عہدہ', 'PAST EMPLOYMENT': 'گزشتہ ملازمت',
  'NET LIVE EARNINGS': 'خالص لائیو آمدنی', 'CURRENT COMPANY BALANCE': 'موجودہ کمپنی بیلنس', 'AVAILABLE CASH': 'دستیاب نقد رقم', 'ESTIMATED LIFETIME EARNINGS': 'تخمینی زندگی بھر کی آمدنی',
  'Entry type': 'اندراج کی قسم', 'Amount (PKR)': 'رقم (PKR)', 'Date': 'تاریخ', 'Note': 'نوٹ', 'Category': 'زمرہ', 'Status': 'حالت', 'Check in': 'چیک اِن', 'Check out': 'چیک آؤٹ', 'Overtime (hours)': 'اوور ٹائم (گھنٹے)',
  'Loan name': 'قرض کا نام', 'Principal (PKR)': 'اصل رقم (PKR)', 'Issue date': 'اجرا کی تاریخ', 'Repayment (PKR)': 'واپسی (PKR)', 'Company': 'کمپنی', 'Designation': 'عہدہ', 'Start date': 'شروع کی تاریخ', 'End date': 'اختتامی تاریخ', 'Monthly salary (PKR)': 'ماہانہ تنخواہ (PKR)',
  'Language': 'زبان', 'Theme': 'تھیم', 'Low-cash threshold (PKR)': 'کم رقم کی حد (PKR)', 'Company entry': 'کمپنی اندراج', 'Direction': 'سمت', 'Savings goal': 'سیونگ گول', 'Reminder date': 'یاد دہانی کی تاریخ',
  'Save changes': 'تبدیلیاں محفوظ کریں', 'Saving…': 'محفوظ ہو رہا ہے…', 'Add entry': 'اندراج شامل کریں', 'Issue loan': 'قرض جاری کریں', 'Record repayment': 'واپسی درج کریں', 'Save day': 'دن محفوظ کریں', 'Save role': 'عہدہ محفوظ کریں', 'Create goal': 'گول بنائیں', 'Update': 'تبدیل کریں', 'Save transfer': 'ٹرانسفر محفوظ کریں',
  'Download CSV': 'CSV ڈاؤن لوڈ کریں', 'Download PDF': 'PDF ڈاؤن لوڈ کریں', 'Download voucher': 'واؤچر ڈاؤن لوڈ کریں', 'Open reports': 'رپورٹس کھولیں', 'Start setup': 'سیٹ اپ شروع کریں', 'Adjust': 'تبدیل کریں', 'Clear reminder': 'یاد دہانی صاف کریں', 'Remove': 'حذف کریں', 'Close': 'بند کریں',
  'Present': 'حاضر', 'Absent': 'غیر حاضر', 'Half day': 'آدھا دن', 'Leave': 'چھٹی', 'Weekly off': 'ہفتہ وار چھٹی', 'Cash in': 'رقم وصول', 'Expense': 'خرچ', 'Receipt': 'رسید', 'Udhaar given': 'ادھار دیا', 'Udhaar received': 'ادھار وصول', 'To savings': 'سیونگ میں', 'From savings': 'سیونگ سے',
  'Company credit': 'کمپنی کریڈٹ', 'Withdrawal': 'رقم نکلوائی', 'Voucher': 'واؤچر', 'Advance': 'ایڈوانس', 'Loan issued': 'قرض جاری', 'Loan repayment': 'قرض کی واپسی', 'Deduction': 'کٹوتی',
  'Credits': 'کریڈٹس', 'Deductions': 'کٹوتیاں', 'Loans due': 'واجب الادا قرضے', 'Entries': 'اندراجات', 'Money in': 'رقم اندر', 'Money out': 'رقم باہر', 'Saved toward goals': 'گولز کے لیے محفوظ',
  'Recent activity': 'حالیہ سرگرمی', 'Your history': 'آپ کی تاریخ', 'Issue and settle company loans.': 'کمپنی کے قرضے جاری اور مکمل کریں۔', 'Move money without losing the trail.': 'ریکارڈ برقرار رکھتے ہوئے رقم منتقل کریں۔', 'Give every saving a purpose.': 'ہر بچت کو مقصد دیں۔',
  'CSV report': 'CSV رپورٹ', 'PDF report': 'PDF رپورٹ', 'Printable voucher': 'پرنٹ ایبل واؤچر', 'SPREADSHEET READY': 'اسپریڈشیٹ کے لیے تیار', 'PRINTABLE SUMMARY': 'پرنٹ ایبل خلاصہ', 'VOUCHER IMAGE': 'واؤچر تصویر', 'INCLUDED IN PDF': 'PDF میں شامل',
  'No company entries yet.': 'ابھی کوئی کمپنی اندراج نہیں۔', 'No tracked loans yet.': 'ابھی کوئی ٹریک شدہ قرض نہیں۔', 'No pocket entries yet.': 'ابھی کوئی ذاتی رقم کا اندراج نہیں۔', 'No savings goals yet.': 'ابھی کوئی سیونگ گول نہیں۔', 'No past roles added yet.': 'ابھی کوئی گزشتہ عہدہ شامل نہیں۔',
  'Set up your workspace first.': 'پہلے اپنا ورک اسپیس سیٹ اپ کریں۔', 'Loading local settings…': 'مقامی ترتیبات لوڈ ہو رہی ہیں…', 'Checking local security…': 'مقامی سکیورٹی چیک ہو رہی ہے…', 'You’re offline.': 'آپ آف لائن ہیں۔',
  'Optional detail': 'اختیاری تفصیل', 'Optional explanation': 'اختیاری وضاحت', 'Optional repayment note': 'اختیاری واپسی نوٹ', 'Optional reference or explanation': 'اختیاری حوالہ یا وضاحت', 'Company name': 'کمپنی کا نام', 'Your role': 'آپ کا عہدہ',
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatableAttributes = ['aria-label', 'placeholder', 'title'] as const;

export function LocalizedSurface({ language }: { language: AppLanguage | undefined }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-localized-surface]');
    if (!root) return;
    const translate = (value: string) => language === 'ur' ? urdu[value] ?? value : value;
    const updateText = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || parent.closest('[data-user-content]') || ['SCRIPT', 'STYLE', 'OPTION'].includes(parent.tagName)) return;
      const source = originalText.get(node) ?? node.nodeValue ?? '';
      originalText.set(node, source);
      const next = translate(source);
      if (node.nodeValue !== next) node.nodeValue = next;
    };
    const updateElement = (element: Element) => {
      if (element.closest('[data-user-content]')) return;
      translatableAttributes.forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value === null) return;
        const originals = originalAttributes.get(element) ?? new Map<string, string>();
        if (!originalAttributes.has(element)) originalAttributes.set(element, originals);
        const source = originals.get(attribute) ?? value;
        originals.set(attribute, source);
        const next = translate(source);
        if (value !== next) element.setAttribute(attribute, next);
      });
    };
    const updateTree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) updateText(node as Text);
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as Element;
      updateElement(element);
      element.querySelectorAll('*').forEach(updateElement);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let current: Node | null = walker.nextNode();
      while (current) { updateText(current as Text); current = walker.nextNode(); }
    };
    updateTree(root);
    const observer = new MutationObserver((records) => records.forEach((record) => {
      if (record.type === 'characterData') updateText(record.target as Text);
      record.addedNodes.forEach(updateTree);
    }));
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
