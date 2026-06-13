# InsuranceMobileApp Localization And Performance Context

Last updated: 2026-06-13

Language toggle behavior, translations, runtime, and bundle optimization.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Language Toggle
- `LanguageToggleComponent` supports `floating` and `toolbar` placements.
- Header-based pages render the compact English/Nepali toggle in the primary `ion-toolbar`; `AppComponent` only shows the floating fallback on no-header auth pages that need it, while Login keeps its existing language control.
- The toggle persists locally for guest/startup screens and syncs to the backend for authenticated users.
- The lightweight translation system uses `LanguageService`, `TranslatePipe`, and the dictionaries under `src\app\i18n`.
- Login, register, dashboard, enrollments, enrollment detail, and enrollment wizard step titles/messages now resolve through `LanguageService`/`TranslatePipe` instead of relying only on DOM phrase replacement.
- Nepali-name field labels use the mixed-script convention in English UI (`Full Name (नेपाली)`, `First Name (नेपाली)`, `Last Name (नेपाली)`) while Nepali UI keeps natural labels such as `पूरा नाम (नेपाली)`, `पहिलो नाम (नेपाली)`, and `थर (नेपाली)` across registration, profile, enrollment, and renewal/member forms.
- All editable Ionic fields labeled as Nepali names use `appNepaliInput` where the user types names, including profile and renewal direct-add inputs. Transliteration is only a typing aid; pre-submit validation still requires Devanagari-only values.
- Enrollments list search and status filter labels have Nepali keyed translations for the title, search placeholder, all/draft/verified/approved/rejected tabs, and related list messages.
- DOM phrase translation is default-off. Keyed translations and locale helpers are the primary path; legacy DOM translation can be opted in with an explicit container only.
- `LanguageService` now also provides locale-aware number formatting, digit localization, `translateText()` for backend/display messages, `label()` for enum-like values, and residual DOM attribute translation for `placeholder`, `title`, `aria-label`, `label`, and `alt`.
- `DateService` display helpers now localize BS dates and time digits in Nepali mode.
- `DateService` display helpers now show BS dates as numeric `YYYY/MM/DD`; slash-separated typed BS dates are accepted and normalized back to AD `YYYY-MM-DD` for API payloads.
- `DateService.isCitizenshipIssueDateValid()` converts BS/AD inputs to comparable AD dates and checks DOB + 16 years for citizenship issue-date validation.
- `BsDatePickerComponent` now uses an editable numeric BS input plus a calendar button. Valid typed `YYYY/MM/DD` input updates the model, invalid input is visibly rejected, and calendar selection still works.
- Global radio styling gives native radios, Ionic `ion-radio`, and fallback radio inputs a visible green unchecked outline and matching green selected/focus states.
- Nepali text-entry fields using `appNepaliInput` now use the phonetic `TransliterateService` on committed Ionic input values instead of the `nepalify` keyboard-layout formatter; examples covered include `Komal Shrestha`, `Ram`, and `Shrestha`.
- As of 2026-05-01, the remaining high-traffic mobile UI was moved to keyed translations or locale helpers: home, tabs, login/register/forgot password, profile, dashboard labels, enrollment list/detail/wizard, policy, payments, payment result, notifications, subsidies, renewal search, renewals, and renewal detail.
- A static scan of mobile HTML templates on 2026-05-01 found no unmatched static user-facing English text/placeholder/title/aria-label/alt strings outside keyed translation bindings or dictionary-backed residual translations.
- On 2026-05-12, Nepali mode was tightened to strict keyed UI coverage: every English dictionary key has a Nepali dictionary entry, the language toggle no longer shows raw `English`/`EN` while Nepali is active, login derived placeholders recompute from `language$`, and `AppComponent` schedules a root change-detection pass on language changes so cached tab/page views re-render.
- On 2026-05-16, `src\app\i18n\ne.ts` was refreshed from `/Users/rahkehs/Downloads/nepali_translations.json` by applying exact flat-key matches, phrase-key matches, English-source phrase matches, and the verified `My Enrollments` plural alias while preserving all existing mobile-only keys. JSON phrases that were not already keys were added as phrase fallbacks for `LanguageService.translateString()`, and every English dictionary key remains covered by Nepali.
- `scripts/check-localized-templates.cjs` and `npm run check:i18n` guard against new hardcoded English text/label/placeholder/alt/title/aria-label values in mobile HTML templates, with expected exceptions for technical notation such as blood groups and IDs.
## Runtime And Bundle Optimization
- Global jQuery and `nepali-date-picker` assets were removed from `angular.json`; the existing Angular `BsDatePickerComponent` remains the active date-picker path.
- `LanguageService.startDomTranslator()` now requires a specific root element/string and does nothing without one. `startLegacyDomTranslator()` is available for legacy containers that still need DOM phrase replacement.
- `EnrollmentWizardPage` implements `OnDestroy` and uses `destroy$` / `takeUntil()` for the language subscription.
- Angular router preloading uses `src\app\strategies\selective-preloading.strategy.ts`, preloading only routes with `data.preload = true`; the authenticated tabs shell is marked for preload while heavier enrollment/renewal detail chunks remain lazy.
- `ApiService` remembers a working development API base URL in `sessionStorage` for the browser session only. When the app is served by `ng serve` on localhost/127.0.0.1 ports 4200 or 8100, it now tries the same browser host on port 8000 first so local Ionic registration/login setup reaches the sibling Laravel dev server before stale LAN URLs. Production continues to use the single configured HTTPS API URL.
- `EnrollmentService.getConfig()` has in-session `shareReplay` caching with `clearConfigCache()` for invalidation.

Important optimization files:
- `angular.json`
- `src\main.ts`
- `src\app\app.routes.ts`
- `src\app\app.component.ts`
- `src\app\strategies\selective-preloading.strategy.ts`
- `src\app\services\api.service.ts`
- `src\app\services\date.service.ts`
- `src\app\services\enrollment.service.ts`
- `src\app\services\language.service.ts`
- `src\app\pages\enrollment-wizard\enrollment-wizard.page.ts`
- `src\app\pages\enrollment-wizard\enrollment-wizard.page.html`
- `src\app\pages\enrollment-wizard\components\*.component.ts`
- `src\app\pages\enrollment-wizard\components\*.component.html`
- `src\app\components\member-form\member-form.component.ts`
- `src\app\pages\renewals\renewals.page.ts`
- `src\app\pages\renewal-detail\renewal-detail.page.ts`
