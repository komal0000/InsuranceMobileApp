import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { User } from '../interfaces/user.interface';
import { ApiService } from './api.service';
import { NE_TRANSLATIONS } from '../i18n/ne';

export type AppLanguage = 'en' | 'ne';

const LANGUAGE_KEY = 'preferred_language';

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
    if (this.currentLanguage === 'en') {
      return key;
    }

    return NE_TRANSLATIONS[this.normalizePhrase(key)] ?? key;
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
      attributeFilter: ['placeholder', 'title', 'aria-label', 'label'],
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
    const tracked = ['placeholder', 'title', 'aria-label', 'label'];
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
    const translated = NE_TRANSLATIONS[normalized];

    return translated ? `${leading}${translated}${trailing}` : value;
  }

  private normalizePhrase(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeLanguage(value?: string | null): AppLanguage | null {
    return value === 'ne' || value === 'en' ? value : null;
  }
}
