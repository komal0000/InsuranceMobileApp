# InsuranceMobileApp Current Context

Last updated: 2026-05-05

This file captures the current Ionic/Angular state so future conversations do not need to rediscover the mobile app.

## App Shape
- Root: `C:\Insurance\InsuranceMobileApp`.
- Ionic `^8.0.0`, Angular `^20.0.0`, Capacitor `8.1.0`, TypeScript `~5.9.0`.
- Main UI pages live under `src\app\pages`.
- API services live under `src\app\services`.
- Shared interfaces live under `src\app\interfaces`.
- Backend API is Laravel in `C:\Insurance\InsuranceApp`.

## Recent Auth Flow Changes
- `RegisterPage` is details-only:
  - full name
  - Nepali full name
  - mobile number
  - optional email
- Register no longer asks for OTP or password.
- After successful registration, the app navigates to login with:
  - `identifier_type=mobile`
  - registered mobile number
  - `showRegistrationSetup=true`
- `LoginPage` supports two modes:
  - direct/normal login: password-only, no OTP button.
  - registration handoff: Send OTP, Verify, Create Password on the login page.
- During registration handoff, the normal direct-login password, remember-me, forgot-password, and Sign In controls are hidden until the OTP setup path reaches its own Create Password step.
- Final setup-password and password-reset requests send the OTP code again because the backend re-checks it before changing passwords.
- Existing user login remains password-based by mobile or HIB number.
- Authenticated user payloads now include `preferred_language`.
- `AuthService` syncs backend `preferred_language` into the mobile language service on login, setup-password login, profile fetch, and language update.
- `AuthService.updateLanguage()` calls `PATCH /api/user/language` and updates the cached user.
- Mobile startup stores a local fallback language with Capacitor Preferences, but the backend user preference is authoritative after authentication.

Important auth files:
- `src\app\pages\register\register.page.ts`
- `src\app\pages\register\register.page.html`
- `src\app\pages\login\login.page.ts`
- `src\app\pages\login\login.page.html`
- `src\app\pages\forgot-password\*`
- `src\app\services\auth.service.ts`
- `src\app\services\language.service.ts`
- `src\app\components\language-toggle\language-toggle.component.ts`
- `src\app\pipes\translate.pipe.ts`
- `src\app\i18n\en.ts`
- `src\app\i18n\ne.ts`
- `src\app\interfaces\user.interface.ts`
- `src\app\app.routes.ts`

API methods added/used for login-side setup:
- `sendLoginSetupOtp()`
- `verifyLoginSetupOtp()`
- `createLoginSetupPassword()`
- Endpoints:
  - `POST /api/login/otp/send`
  - `POST /api/login/otp/verify`
  - `POST /api/login/password/create`
- Final password creation payload includes `otp`, `password`, and `password_confirmation`.

## Enrollment Wizard Redesign
- Current wizard has 3 steps:
  1. Household Head and Address
  2. Family Members
  3. Review and Submit
- Backend step state is used directly: `current_step = 2` resumes Family Members and `current_step = 3` resumes Review and Submit.
- Current file pair:
  - `src\app\pages\enrollment-wizard\enrollment-wizard.page.ts`
  - `src\app\pages\enrollment-wizard\enrollment-wizard.page.html`
- The enrollment wizard now composes standalone child components for the NID/manual gate, household-head form, address form, member form, and review/submit step while preserving the existing API payloads.
- Service:
  - `src\app\services\enrollment.service.ts`
- Interfaces:
  - `src\app\interfaces\enrollment.interface.ts`

Step 1 includes:
- household-head NID lookup
- personal information
- father/mother/grandfather names in English and Nepali
- citizenship fields
- permanent address
- temporary address
- optional Basai Sarai front/back file capture when temporary differs
- first service point
- profession ID select
- qualification ID select
- household target group
- Mobile Step 1 section order now mirrors the web enrollment form:
  1. Start with Household Head NID
  2. Personal Information
  3. Parent and Grandparent Information
  4. Citizenship Information
  5. Permanent Address
  6. Temporary Address
  7. Service Point and Additional Information
  8. Household Target Group
- Household-head English and Nepali middle-name inputs are not rendered or submitted from mobile enrollment. Existing backend/interface middle-name fields remain for compatibility with historical data only.
- The household-head mobile number is prefilled from the authenticated user's registered `mobile_number` when the enrollment field is empty. Existing saved/manual enrollment mobile numbers and NID-provided mobile numbers are not overwritten.

NID behavior:
- Step 1 starts with the household-head NID lookup/manual fallback gate, matching the web enrollment flow; permanent and temporary address fields are not shown until lookup succeeds or the user chooses manual entry.
- Manual fallback preserves the typed NID number into the household-head `national_id` field as unverified manual data.
- `headNidLookup(id, nationalId)` calls `POST /api/enrollments/{id}/head/nid-lookup`.
- On success, returned NID fields are written into `headData` and permanent address state.
- Populated NID fields are tracked in `nidLockedHeadFields`.
- Locked fields are readonly/disabled in UI, including date picker fields.
- Missing NID fields remain editable.
- NID photo preview is used when `photo_url` is returned.
- Mobile consumes backend-mapped NID display fields directly: `province`, `district`, `municipality`, `ward_number`, `tole_village`, `citizenship_issue_district`, and JPEG `photo_url`.
- Household-head NID tests cover Bagamati/Makawanpur/Hetauda mapped address selection, locked citizenship issue district, and JPEG photo preview.
- Member NID tests cover `citizenship_issue_district` and JPEG `photo_url` preview.

Save behavior:
- `saveHouseholdHead(id, formData)` calls `POST /api/enrollments/{id}/household-head`.
- Old `saveStep1`, `saveStep2`, and generic `nidLookup` methods remain for compatibility.
- Step 1 save sends permanent address, temporary address, first service point, household-head fields, profession/qualification IDs, target-group fields, and files.

Enrollment PDF behavior:
- Backend submit responses include `pdf_generated` and `pdf_download_url`, with the URL also available as `data.pdf_download_url`.
- `EnrollmentService.submit()` returns `EnrollmentSubmitResponse`; `EnrollmentService.getPdfUrl()` requests a fresh signed PDF URL from `/api/enrollments/{id}/pdf-url`.
- After successful enrollment wizard submit, the app attempts to open the signed PDF URL with Capacitor Browser, then keeps the existing success toast and returns to the enrollments tab.
- Enrollment detail attaches `pdf_download_url` from the show response and shows a fallback `Download Enrollment PDF` action for submitted enrollments.
- The signed URL is generated by the backend and is short-lived; the enrollment detail download action always fetches a fresh PDF URL before opening instead of reusing a cached detail URL.

Member card export behavior:
- Member card export is available only when the backend enrollment status is `active`.
- `EnrollmentService` exposes:
  - `getCards(id)`
  - `getAllCardsPdfUrl(id)`
  - `getHeadCardPdfUrl(id)`
  - `getMemberCardPdfUrl(enrollmentId, memberId)`
- Enrollment detail attaches `card_download_url` from the show response and shows `Export Member Cards` only for active enrollments.
- Enrollment detail bulk card export always requests a fresh signed card URL before opening because cached detail URLs expire.
- My Policy uses the backend `enrollment_id` and active-card URL fields to show:
  - `Export All Member Cards`
  - household-head `Export Card PDF`
  - per-family-member `Export Card PDF`
- Card PDFs open with Capacitor Browser using fresh signed URLs from the backend.

Temporary address:
- `temporarySameAsPermanent` copies permanent address into temporary address locally.
- If unchecked, temporary location dropdowns and Basai Sarai front/back capture are shown.
- Backend treats Basai Sarai files as optional.

Profession options:
- `1 Government`
- `2 Self Employed`
- `3 Salaried`
- `4 House Wife`
- `5 Agriculture`
- `6 Other`
- `7 Foreign employment`

Qualification options:
- `1 Nursery`
- `2 Primary`
- `3 Secondary`
- `4 University`
- `5 Post Graduate`
- `6 PHD`
- `7 Other`
- `8 Un-Educated`

Household target group:
- Only household head target group remains.
- `senior_citizen` shows an explanatory note and does not require ID number or target card images.

Family members:
- Family-member NID lookup still exists.
- Member English and Nepali middle-name inputs are not rendered in enrollment member entry, not copied into edit form state, and not submitted in member add/update FormData even if stale keys exist locally.
- Step 2 and review name displays show first name plus last name only.
- Member target-group UI and payload collection are removed.
- Existing stale keys are skipped in FormData where relevant.
- The shared `src\app\components\member-form\member-form.component.ts` is used by enrollment member entry and renewal detail member entry.
- Enrollment member add/update uses mutation response data to update the current in-memory member list when enough state is returned; full enrollment refetches are still used where server-calculated review/subsidy state is needed.
- Backend enrollment numbers now account for soft-deleted drafts, so mobile users can delete a draft enrollment and immediately create a new one without the API reusing the deleted draft's unique enrollment number.

## Renewal Mobile Changes
- Renewal member add/edit no longer collects target-group fields.
- Relevant files:
  - `src\app\pages\renewal-detail\renewal-detail.page.ts`
  - `src\app\pages\renewal-detail\renewal-detail.page.html`
  - `src\app\pages\renewals\renewals.page.ts`
  - `src\app\pages\renewals\renewals.page.html`
- Renewal member FormData builders skip stale `target_group*` and `is_target_group` keys.
- Admin/staff management roles no longer see renewal search/initiation entry points.
- `RenewalsPage.canInitiateRenewal` permits renewal initiation only for `beneficiary` and `enrollment_assistant`.
- `RenewalSearchPage` also blocks direct renewal search/initiation for management roles and shows a management-safe notice.
- Dashboard enrollment creation now permits only `beneficiary` and `enrollment_assistant`.
- Renewal detail uses the shared member form component. It still refetches renewal detail after member mutations because the backend response does not include enough updated premium/renewal aggregate state.

## Payment Gateway Flow
- Payment return handling treats `status=pending` as a first-class result instead of showing a failed payment.
- The payment page polls backend status longer after gateway return. If the backend still reports pending after polling, the app routes to the payment result page with `status=pending` and a verification-pending reason.
- The payment result page can display pending verification, lets the user check again, and moves to success/failed only when `/api/payments/status/{referenceId}` returns a settled state.
- Payment result pending copy is translated through the English/Nepali dictionaries.
- Relevant files:
  - `src\app\pages\payment\payment.page.ts`
  - `src\app\pages\payment\payment.page.spec.ts`
  - `src\app\pages\payment-result\payment-result.page.ts`
  - `src\app\pages\payment-result\payment-result.page.html`
  - `src\app\pages\payment-result\payment-result.page.scss`
  - `src\app\pages\payment-result\payment-result.page.spec.ts`
  - `src\app\i18n\en.ts`
  - `src\app\i18n\ne.ts`

## Language Toggle
- `LanguageToggleComponent` supports `floating` and `toolbar` placements.
- Header-based pages render the compact English/Nepali toggle in the primary `ion-toolbar`; `AppComponent` only shows the floating fallback on no-header auth pages that need it, while Login keeps its existing language control.
- The toggle persists locally for guest/startup screens and syncs to the backend for authenticated users.
- The lightweight translation system uses `LanguageService`, `TranslatePipe`, and the dictionaries under `src\app\i18n`.
- Login, register, dashboard, enrollments, enrollment detail, and enrollment wizard step titles/messages now resolve through `LanguageService`/`TranslatePipe` instead of relying only on DOM phrase replacement.
- Enrollments list search and status filter labels have Nepali keyed translations for the title, search placeholder, all/draft/verified/approved/rejected tabs, and related list messages.
- DOM phrase translation is default-off. Keyed translations and locale helpers are the primary path; legacy DOM translation can be opted in with an explicit container only.
- `LanguageService` now also provides locale-aware number formatting, digit localization, `translateText()` for backend/display messages, `label()` for enum-like values, and residual DOM attribute translation for `placeholder`, `title`, `aria-label`, `label`, and `alt`.
- `DateService` display helpers now localize BS dates and time digits in Nepali mode.
- `BsDatePickerComponent` now renders Nepali labels and Devanagari digits in Nepali mode.
- Nepali text-entry fields using `appNepaliInput` now use the phonetic `TransliterateService` on committed Ionic input values instead of the `nepalify` keyboard-layout formatter; examples covered include `Komal Shrestha`, `Ram`, and `Shrestha`.
- As of 2026-05-01, the remaining high-traffic mobile UI was moved to keyed translations or locale helpers: home, tabs, login/register/forgot password, profile, dashboard labels, enrollment list/detail/wizard, policy, payments, payment result, notifications, subsidies, renewal search, renewals, and renewal detail.
- A static scan of mobile HTML templates on 2026-05-01 found no unmatched static user-facing English text/placeholder/title/aria-label/alt strings outside keyed translation bindings or dictionary-backed residual translations.

## Geo Loading Cache
- `src\app\services\geo.service.ts` has in-session caching using shared observable behavior for repeated geo calls.
- Backend remains the primary cache layer.
- Enrollment wizard loads cascading options in order:
  - province
  - districts
  - municipality
  - wards

## Runtime And Bundle Optimization
- Global jQuery and `nepali-date-picker` assets were removed from `angular.json`; the existing Angular `BsDatePickerComponent` remains the active date-picker path.
- `LanguageService.startDomTranslator()` now requires a specific root element/string and does nothing without one. `startLegacyDomTranslator()` is available for legacy containers that still need DOM phrase replacement.
- `EnrollmentWizardPage` implements `OnDestroy` and uses `destroy$` / `takeUntil()` for the language subscription.
- Angular router preloading uses `src\app\strategies\selective-preloading.strategy.ts`, preloading only routes with `data.preload = true`; the authenticated tabs shell is marked for preload while heavier enrollment/renewal detail chunks remain lazy.
- `ApiService` remembers a working development API base URL in `sessionStorage` for the browser session only. Production continues to use the single configured HTTPS API URL.
- `EnrollmentService.getConfig()` has in-session `shareReplay` caching with `clearConfigCache()` for invalidation.

Important optimization files:
- `angular.json`
- `src\main.ts`
- `src\app\app.routes.ts`
- `src\app\app.component.ts`
- `src\app\strategies\selective-preloading.strategy.ts`
- `src\app\services\api.service.ts`
- `src\app\services\enrollment.service.ts`
- `src\app\services\language.service.ts`
- `src\app\pages\enrollment-wizard\enrollment-wizard.page.ts`
- `src\app\pages\enrollment-wizard\enrollment-wizard.page.html`
- `src\app\pages\enrollment-wizard\components\*.component.ts`
- `src\app\pages\enrollment-wizard\components\*.component.html`
- `src\app\components\member-form\member-form.component.ts`

## Verification
Commands run successfully on 2026-04-25:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Current results:
- Build passes.
- Tests pass: `17 SUCCESS`.
- Build warning remains:
- `src/app/pages/renewals/renewals.page.scss exceeded maximum budget`
- Budget is 4.00 kB, file is about 5.80 kB.

Additional verification on 2026-04-27:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npm run build` passes.
- `npx tsc -p tsconfig.spec.json --noEmit` passes.
- Existing SCSS budget warning remains for `src/app/pages/renewals/renewals.page.scss`.
- `npm test` could not launch ChromeHeadless in this local sandbox: Karma fails with `spawn EPERM` before executing browser tests.

Additional verification on 2026-04-27 after mobile enrollment/Nepali input fixes:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npx tsc -p tsconfig.spec.json --noEmit` passes.
- `npm run build` passes.
- Existing SCSS budget warning remains for `src/app/pages/renewals/renewals.page.scss`.
- `npm test` is still blocked locally because Karma cannot spawn ChromeHeadless (`spawn EPERM`) before executing tests.

Additional localization verification on 2026-04-30:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npx tsc -p tsconfig.spec.json --noEmit` passes after updating page specs for the newer `LanguageService` constructor usage.
- `npm run build` passes after wiring localized step titles, toasts, BS date picker labels, and locale-aware number/date rendering.
- New focused coverage exists in:
  - `src\app\services\language.service.spec.ts`
  - `src\app\services\date.service.spec.ts`
  - `src\app\pages\enrollment-wizard\enrollment-wizard.page.spec.ts`
  - updated login/register/dashboard specs
- Existing SCSS budget warning remains for `src/app/pages/renewals/renewals.page.scss`.
- `npm test` is still blocked locally because Karma cannot spawn ChromeHeadless (`spawn EPERM`) before executing browser tests.

Additional full mobile Nepali localization verification on 2026-05-01:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- `npx tsc -p tsconfig.spec.json --noEmit` passes.
- `npm test -- --watch=false --browsers=ChromeHeadless` passes: `35 SUCCESS`.
- `npm run build` passes.
- Existing SCSS budget warning remains for `src/app/pages/renewals/renewals.page.scss`.
- Static HTML localization scan reports: `No unmatched static HTML user-facing English strings found.`

Optimization roadmap verification on 2026-05-02:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- TypeScript spec compile succeeds.
- Karma/ChromeHeadless tests pass: `43 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Existing warning remains: `src/app/pages/renewals/renewals.page.scss exceeded maximum budget` by about `1.80 kB`.
- Focused optimization coverage now includes enrollment wizard teardown, DOM translator default-off/opt-in behavior, development API fallback session preference, selective route preloading, and enrollment config caching.

Renewals style budget follow-up on 2026-05-02:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm run build
```

Result:
- `src\app\pages\renewals\renewals.page.scss` was trimmed by consolidating duplicated card/avatar/form styles and removing deeply nested decorative rules.
- `npx tsc -p tsconfig.spec.json --noEmit` passes.
- `npm run build` passes with no component style budget warning.
- `renewals-page` lazy chunk decreased from about `57.38 kB` raw to about `54.32 kB` raw.

Dashboard refresh optimization on 2026-05-02:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- `DashboardDataService.getDashboard(true)` now passes `refresh=1` to `/api/dashboard` so mobile force-refresh paths bypass the backend's short dashboard cache.
- New focused coverage lives in `src\app\services\dashboard-data.service.spec.ts`.
- `npx tsc -p tsconfig.spec.json --noEmit` passes.
- `npm test -- --watch=false --browsers=ChromeHeadless` passes: `45 SUCCESS`.
- `npm run build` passes with no component style budget warning.

Language toggle header placement and enrollments localization on 2026-05-02:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npm run build` passes and writes to `C:\Insurance\InsuranceMobileApp\www`.
- `npm test -- --watch=false --browsers=ChromeHeadless` passes: `46 SUCCESS`.

Payment pending-state verification on 2026-05-02:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- TypeScript spec compile succeeds.
- Karma/ChromeHeadless tests pass: `49 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Focused coverage includes payment polling exhausting to a pending result, pending deep links rendering as pending, and refresh moving a pending result to success when the backend reports paid.

Registration handoff password UI verification on 2026-05-02:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Karma/ChromeHeadless tests pass: `51 SUCCESS`.
- Focused login coverage confirms direct login keeps the normal password controls, while registration setup mode hides the normal password, remember-me, forgot-password, and Sign In controls.

Mobile enrollment web-order and middle-name removal verification on 2026-05-03:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Karma/ChromeHeadless tests pass: `56 SUCCESS`.
- Focused coverage confirms household/member middle-name controls are not rendered, stale household middle-name values are excluded from household FormData, and stale member middle-name values are excluded from add/edit member FormData.

Registered mobile prefill verification on 2026-05-03:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Karma/ChromeHeadless tests pass: `58 SUCCESS`.
- Focused coverage confirms the enrollment wizard fills an empty household-head mobile field from the authenticated user's registered mobile number and does not overwrite an existing enrollment mobile number.

Enrollment PDF mobile verification on 2026-05-05:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- TypeScript spec compile succeeds.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Karma/ChromeHeadless tests pass: `62 SUCCESS`.
- Focused coverage confirms submit opens the generated PDF URL when present, still completes when the URL is missing, and the enrollment service exposes submit/download PDF URL contracts.

Member card mobile verification on 2026-05-05:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- TypeScript spec compile succeeds.
- Karma/ChromeHeadless tests pass: `65 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Focused coverage confirms My Policy only allows card export for active policies and requests fresh signed bulk/head/member card URLs before opening PDFs.

Enrollment detail signed URL refresh fix on 2026-05-06:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- TypeScript spec compile succeeds.
- Karma/ChromeHeadless tests pass: `65 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Enrollment detail PDF and card export buttons now request fresh signed URLs before opening, avoiding expired cached links from the detail payload.

## Deployment Notes
- Environment API URL is configured in:
  - `src\environments\environment.ts`
  - `src\environments\environment.prod.ts`
- Before production release, replace LAN API URLs with public HTTPS backend URL.
- Capacitor app id may still be starter value and should be aligned with Firebase/package name before production.
- Mobile release flow:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npx cap sync android
```

## Backend References
- Backend root: `C:\Insurance\InsuranceApp`.
- Backend current context: `C:\Insurance\InsuranceApp\INSURANCEAPP_CONTEXT.md`.
- Backend endpoints used by enrollment:
  - `POST /api/enrollments/{enrollment}/head/nid-lookup`
  - `POST /api/enrollments/{enrollment}/household-head`
  - `POST /api/enrollments/{enrollment}/members`
  - `PUT /api/enrollments/{enrollment}/members/{member}`
  - `POST /api/enrollments/{enrollment}/submit`
  - `GET /api/enrollments/{enrollment}/pdf-url`
- Backend verification on 2026-05-03 covered the mobile draft delete/recreate path through `POST /api/enrollments`, `DELETE /api/enrollments/{id}`, and a second `POST /api/enrollments`; the second draft receives a new enrollment number instead of reusing the soft-deleted one.
- Backend language endpoints:
  - `PATCH /api/user/language`
  - `POST /language` for web/session language changes.
