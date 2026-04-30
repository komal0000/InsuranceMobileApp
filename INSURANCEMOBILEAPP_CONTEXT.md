# InsuranceMobileApp Current Context

Last updated: 2026-04-30

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
- Service:
  - `src\app\services\enrollment.service.ts`
- Interfaces:
  - `src\app\interfaces\enrollment.interface.ts`

Step 1 includes:
- household-head NID lookup
- permanent address
- temporary address
- optional Basai Sarai front/back file capture when temporary differs
- personal information
- father/mother/grandfather names in English and Nepali
- citizenship fields
- first service point
- profession ID select
- qualification ID select
- household target group

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
- Member target-group UI and payload collection are removed.
- Existing stale keys are skipped in FormData where relevant.

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

## Language Toggle
- A global floating English/Nepali toggle is mounted in `AppComponent`.
- The toggle persists locally for guest/startup screens and syncs to the backend for authenticated users.
- The lightweight translation system uses `LanguageService`, `TranslatePipe`, and the dictionaries under `src\app\i18n`.
- Login, register, dashboard, enrollments, enrollment detail, and enrollment wizard step titles/messages now resolve through `LanguageService`/`TranslatePipe` instead of relying only on DOM phrase replacement.
- DOM phrase translation is still started at app root for residual standalone text and Ionic-rendered content that is not yet wired directly to keys.
- `LanguageService` now also provides locale-aware number formatting and digit localization used by mobile summaries and date displays.
- `DateService` display helpers now localize BS dates and time digits in Nepali mode.
- `BsDatePickerComponent` now renders Nepali labels and Devanagari digits in Nepali mode.
- Nepali text-entry fields using `appNepaliInput` now use the phonetic `TransliterateService` on committed Ionic input values instead of the `nepalify` keyboard-layout formatter; examples covered include `Komal Shrestha`, `Ram`, and `Shrestha`.

## Geo Loading Cache
- `src\app\services\geo.service.ts` has in-session caching using shared observable behavior for repeated geo calls.
- Backend remains the primary cache layer.
- Enrollment wizard loads cascading options in order:
  - province
  - districts
  - municipality
  - wards

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
- Backend language endpoints:
  - `PATCH /api/user/language`
  - `POST /language` for web/session language changes.
