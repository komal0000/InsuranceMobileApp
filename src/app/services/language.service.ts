import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { User } from '../interfaces/user.interface';
import { ApiService } from './api.service';
import { EN_TRANSLATIONS } from '../i18n/en';
import { NE_TRANSLATIONS } from '../i18n/ne';

export type AppLanguage = 'en' | 'ne';

const LANGUAGE_KEY = 'preferred_language';
const NEPALI_DIGITS = '०१२३४५६७८९';

const DYNAMIC_PHRASE_REPLACEMENTS: Array<[string, string]> = [
  ['Health Insurance Board, Nepal', 'स्वास्थ्य बीमा बोर्ड, नेपाल'],
  ['All rights reserved.', 'सर्वाधिकार सुरक्षित।'],
  ['Password confirmation does not match.', 'पासवर्ड पुष्टि मेल खाएन।'],
  ['Please sign in.', 'कृपया लगइन गर्नुहोस्।'],
  ['Payment Result', 'भुक्तानी परिणाम'],
  ['Payment Successful!', 'भुक्तानी सफल भयो!'],
  ['Payment Failed', 'भुक्तानी असफल भयो'],
  ['Payment Status Pending', 'भुक्तानी स्थिति बाँकी छ'],
  ['Status Pending', 'स्थिति बाँकी छ'],
  ['Processing...', 'प्रक्रिया हुँदैछ...'],
  ['Redirecting...', 'अगाडि बढाइँदैछ...'],
  ['Checking with gateway', 'भुक्तानी माध्यमसँग जाँच हुँदैछ'],
  ['Verifying payment...', 'भुक्तानी प्रमाणीकरण हुँदैछ...'],
  ['Proceed to Pay', 'भुक्तानी गर्न अगाडि बढ्नुहोस्'],
  ['Select Payment Gateway', 'भुक्तानी माध्यम छान्नुहोस्'],
  ['Premium Amount', 'प्रिमियम रकम'],
  ['Policy:', 'पोलिसी:'],
  ['Policy Renewal', 'पोलिसी नवीकरण'],
  ['New Policy', 'नयाँ पोलिसी'],
  ['New Enrollment', 'नयाँ नामांकन'],
  ['Renewal #', 'नवीकरण #'],
  ['Enrollment #', 'नामांकन #'],
  ['Subsidy #', 'अनुदान #'],
  ['Draft #', 'मस्यौदा #'],
  ['HIB #', 'HIB #'],
  ['Txn:', 'कारोबार:'],
  ['Ref:', 'सन्दर्भ:'],
  ['DOB:', 'जन्म मिति:'],
  ['ID:', 'आईडी:'],
  ['Age', 'उमेर'],
  ['yrs', 'वर्ष'],
  ['years', 'वर्ष'],
  ['Days Left', 'दिन बाँकी'],
  ['Expired', 'म्याद सकिएको'],
  ['Members', 'सदस्यहरू'],
  ['Member', 'सदस्य'],
  ['Head', 'घरमूली'],
  ['FREE (Targeted Group)', 'निःशुल्क (लक्षित समूह)'],
  ['FREE', 'निःशुल्क'],
  ['Targeted Group', 'लक्षित समूह'],
  ['Reason:', 'कारण:'],
  ['Discount:', 'छुट:'],
  ['rule(s) matched', 'नियम मिल्यो'],
  ['Pending Verification', 'प्रमाणीकरण बाँकी'],
  ['Verified - Awaiting Approval', 'प्रमाणित - स्वीकृति बाँकी'],
];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageSubject = new BehaviorSubject<AppLanguage>('en');
  private readonly textOriginals = new WeakMap<Text, string>();
  private readonly attributeOriginals = new WeakMap<Element, Record<string, string>>();
  private observer?: MutationObserver;

  readonly language$ = this.languageSubject.asObservable();

  constructor(private api: ApiService) {}

  get currentLanguage(): AppLanguage {
    return this.languageSubject.value;
  }

  async init(userPreference?: string | null): Promise<void> {
    const stored = userPreference ? null : await Preferences.get({ key: LANGUAGE_KEY });
    const language = this.normalizeLanguage(userPreference)
      ?? this.normalizeLanguage(stored?.value)
      ?? 'en';

    await this.setLocalLanguage(language);
  }

  useUserPreference(language?: string | null): void {
    const normalized = this.normalizeLanguage(language);
    if (normalized) {
      void this.setLocalLanguage(normalized);
    }
  }

  setLanguage(language: AppLanguage): Observable<User> {
    return from(this.setLocalLanguage(language)).pipe(
      switchMap(() => this.api.patch<ApiResponse<User>>('/user/language', { preferred_language: language })),
      map(res => res.data),
      tap(user => {
        const serverLanguage = this.normalizeLanguage(user?.preferred_language);
        if (serverLanguage && serverLanguage !== this.currentLanguage) {
          void this.setLocalLanguage(serverLanguage);
        }
      })
    );
  }

  async setLocalLanguage(language: AppLanguage): Promise<void> {
    this.languageSubject.next(language);
    await Preferences.set({ key: LANGUAGE_KEY, value: language });

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      this.translateDocument();
    }
  }

  toggleLanguage(): AppLanguage {
    return this.currentLanguage === 'en' ? 'ne' : 'en';
  }

  t(key: string): string {
    const currentMap = this.getTranslationMap(this.currentLanguage);
    if (currentMap[key]) {
      return currentMap[key];
    }

    if (this.currentLanguage === 'ne') {
      const englishSource = EN_TRANSLATIONS[key] ?? key;
      return NE_TRANSLATIONS[key]
        ?? NE_TRANSLATIONS[this.normalizePhrase(englishSource)]
        ?? NE_TRANSLATIONS[this.normalizePhrase(key)]
        ?? englishSource;
    }

    return EN_TRANSLATIONS[key] ?? key;
  }

  localizeDigits(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const source = String(value);
    if (this.currentLanguage !== 'ne') {
      return source;
    }

    return source.replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)] ?? digit);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric)) {
      return this.localizeDigits(String(value));
    }

    const locale = this.currentLanguage === 'ne' ? 'ne-NP-u-nu-deva' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numeric);

    return this.currentLanguage === 'ne' ? this.localizeDigits(formatted) : formatted;
  }

  translateText(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return this.translateString(value);
  }

  label(namespace: string, value: string | null | undefined, fallback?: string): string {
    const normalized = this.normalizeKey(value);
    if (!normalized) {
      return fallback ? this.translateText(fallback) : '';
    }

    const key = `${namespace}.${normalized}`;
    const currentMap = this.getTranslationMap(this.currentLanguage);
    if (currentMap[key] || EN_TRANSLATIONS[key]) {
      return this.t(key);
    }

    return this.translateText(fallback ?? this.humanize(normalized));
  }

  startDomTranslator(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined' || this.observer) {
      this.translateDocument();
      return;
    }

    this.translateDocument();
    this.observer = new MutationObserver(() => this.translateDocument());
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'label', 'alt'],
    });
  }

  private translateDocument(): void {
    if (typeof document === 'undefined' || !document.body) {
      return;
    }

    this.walk(document.body);
  }

  private walk(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(node as Text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    if (['script', 'style', 'noscript'].includes(tag)) {
      return;
    }

    this.translateAttributes(element);
    Array.from(element.childNodes).forEach(child => this.walk(child));
  }

  private translateTextNode(node: Text): void {
    const original = this.textOriginals.get(node) ?? node.nodeValue ?? '';
    if (!this.textOriginals.has(node)) {
      this.textOriginals.set(node, original);
    }

    const translated = this.translateString(original);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  private translateAttributes(element: Element): void {
    const tracked = ['placeholder', 'title', 'aria-label', 'label', 'alt'];
    const originals = this.attributeOriginals.get(element) ?? {};

    tracked.forEach(attribute => {
      const value = element.getAttribute(attribute);
      if (value === null) {
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(originals, attribute)) {
        originals[attribute] = value;
      }

      const translated = this.translateString(originals[attribute]);
      if (value !== translated) {
        element.setAttribute(attribute, translated);
      }
    });

    this.attributeOriginals.set(element, originals);
  }

  private translateString(value: string): string {
    if (this.currentLanguage === 'en') {
      return value;
    }

    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    const normalized = this.normalizePhrase(value);
    const translated = NE_TRANSLATIONS[normalized] ?? this.translateDynamicPhrase(normalized);

    return translated ? `${leading}${this.localizeDigits(translated)}${trailing}` : this.localizeDigits(value);
  }

  private translateDynamicPhrase(value: string): string | null {
    let translated = value;

    for (const [english, nepali] of DYNAMIC_PHRASE_REPLACEMENTS) {
      translated = translated.replace(new RegExp(this.escapeRegExp(english), 'g'), nepali);
    }

    translated = translated
      .replace(/\bNPR\b/g, 'रु.')
      .replace(/\bRs\./g, 'रु.')
      .replace(/\bOK\b/g, 'ठिक छ');

    return translated !== value ? translated : null;
  }

  private normalizePhrase(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeKey(value?: string | null): string {
    return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  private humanize(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getTranslationMap(language: AppLanguage): Record<string, string> {
    return language === 'ne' ? NE_TRANSLATIONS : EN_TRANSLATIONS;
  }

  private normalizeLanguage(value?: string | null): AppLanguage | null {
    return value === 'ne' || value === 'en' ? value : null;
  }
}
