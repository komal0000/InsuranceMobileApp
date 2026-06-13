# InsuranceMobileApp Verification History Context

Last updated: 2026-06-13

Historical mobile verification runs, build/test results, known local browser constraints, and command transcripts.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Verification
Policy service cleanup verification on 2026-05-22:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm test -- --watch=false --browsers=ChromeHeadless --include src/app/services/policy.service.spec.ts --include src/app/pages/my-policy/my-policy.page.spec.ts --include src/app/pages/hib-profile/hib-profile.page.spec.ts --include src/app/pages/hib-profile-member/hib-profile-member.page.spec.ts
npm run build
```

Local macOS result:
- Focused policy/HIB profile tests pass: `12 SUCCESS`.
- `npm run build` passes and writes to `www`.
- Existing SCSS budget warning remains for `src/app/components/bs-date-picker/bs-date-picker.component.ts` (`4.13 kB` total against `4.00 kB`).

Nepali translation refresh verification on 2026-05-16:
```powershell
cd C:\Insurance\InsuranceMobileApp
$env:CHROME_BIN="C:\Path\To\Chrome.exe"; npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/services/language.service.spec.ts
npm run build
```

Local macOS result:
- Focused language-service suite passes with Brave as `CHROME_BIN`: `7 SUCCESS`.
- `npm run build` passes and writes to `www`; the existing BS date-picker SCSS budget warning remains (`4.05 kB` total against `4.00 kB`).

Consent gate verification on 2026-05-16:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Local macOS result:
- `npm run build` passes and writes to `www`.
- Full mobile Karma suite passes: `166 SUCCESS`.
- Existing SCSS budget warning remains for `src/app/components/bs-date-picker/bs-date-picker.component.ts` (`4.05 kB` total against `4.00 kB`).

Development API URL QA verification on 2026-05-14:
```powershell
cd C:\Insurance\InsuranceMobileApp
$env:CHROME_BIN="C:\Path\To\Chrome.exe"; npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Local macOS result:
- Browser QA verified mobile registration -> login setup OTP -> create password -> dashboard against Laravel at `127.0.0.1:8000`.
- Focused regression passes: `CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include src/app/services/api.service.regression-1.spec.ts` => `2 SUCCESS`.
- Full suite passes: `CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless` => `145 SUCCESS`.
- `npm run build` passes; existing SCSS budget warning remains for `src/app/components/bs-date-picker/bs-date-picker.component.ts`.

Citizenship issue-date verification on 2026-05-13:
```powershell
cd C:\Insurance\InsuranceMobileApp
$env:CHROME_BIN="C:\Path\To\Chrome.exe"; npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Local macOS result:
- `CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless` passes: `138 SUCCESS`.
- `npm run build` passes.
- Plain `ChromeHeadless` without `CHROME_BIN` is unavailable on this Mac because Google Chrome is not installed at `/Applications/Google Chrome.app/...`.
- Build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Nepali localization verification on 2026-05-12:
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run check:i18n
npm run build
$env:CHROME_BIN="C:\Path\To\Chrome.exe"; npm test -- --watch=false --browsers=ChromeHeadless
```

Local macOS result:
- `npm run check:i18n` passes: no hardcoded English template strings found.
- `npm run build` passes.
- `CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless` passes: `123 SUCCESS`.
- Plain `ChromeHeadless` without `CHROME_BIN` is unavailable on this Mac because Google Chrome is not installed at `/Applications/Google Chrome.app/...`.
- Build warning: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

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

Enrollment UI/member-removal/date/radio verification on 2026-05-07:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- TypeScript spec compile passes.
- Karma suite passes: `71 SUCCESS`.
- `npm run build` succeeds.
- Build warning: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).
- Source radio scan under `src` finds no live mobile radio instances, only the global native/`ion-radio` styling rules.
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

NID-verified enrollment refactor on 2026-05-07:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- `tsc` passed.
- Karma/ChromeHeadless tests pass: `67 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.

Enrollment detail/NID/birth-certificate/verification UI follow-up on 2026-05-07:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- TypeScript spec compile passes.
- Karma/ChromeHeadless tests pass: `73 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).
- Focused coverage now includes household NID lookup/manual fallback validation.

NID normalization fix on 2026-05-07:
```powershell
cd C:\Insurance\InsuranceMobileApp
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- Added shared `src/app/utils/nid-number.util.ts` for Devanagari digit normalization, separator-aware validation, canonical digit storage, and normalized lookup payloads.
- NID inputs and messages now accept values such as `898-414-375-3`, `८९८-४१४-३७५-३`, and `८९८४१४३७५३` while still rejecting letters, unsupported symbols, and more than 10 actual digits.
- TypeScript spec compile passes.
- Karma/ChromeHeadless tests pass: `73 SUCCESS`.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Beneficiary dashboard insurance checker verification on 2026-05-10:
```powershell
cd C:\Insurance\InsuranceMobileApp
node node_modules/typescript/bin/tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- Direct TypeScript spec compile passes. Local `npx tsc` shim is not executable on this machine (`Permission denied`), so the equivalent TypeScript binary was run through `node`.
- `npm test -- --watch=false --browsers=ChromeHeadless` compiles the browser test bundle but cannot launch Chrome because `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` is missing and `CHROME_BIN` is unset.
- `npm run build` succeeds and writes to `C:\Insurance\InsuranceMobileApp\www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Under-16 household-head birth-certificate verification on 2026-05-11:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Result:
- Focused enrollment wizard tests pass: `22 SUCCESS`.
- Full mobile Karma suite passes: `93 SUCCESS`.
- `npm run build` succeeds and writes to `www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Service-point dropdown verification on 2026-05-11:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/services/geo.service.spec.ts --include=src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts
npm run build
```

Result:
- Targeted geo/enrollment wizard tests pass: `28 SUCCESS`.
- `npm run build` succeeds and writes to `www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Temporary-address default verification on 2026-05-11:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts
npm run build
```

Result:
- Focused enrollment wizard tests pass: `26 SUCCESS`.
- `npm run build` succeeds and writes to `www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Single-head relationship verification on 2026-05-12:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts' --include='src/app/pages/renewals/renewals.page.spec.ts'
npm run build
```

Result:
- Focused enrollment wizard and renewals tests pass: `35 SUCCESS`.
- `npm run build` succeeds and writes to `www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Marital-status relationship matrix verification on 2026-05-12:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
npm run build
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --karma-config=/private/tmp/insurance-mobile-karma-ci.conf.js --include='src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts' --include='src/app/pages/renewals/renewals.page.spec.ts' --include='src/app/pages/renewal-detail/renewal-detail.page.spec.ts' --include='src/app/components/member-form/member-form.component.spec.ts'
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --karma-config=/private/tmp/insurance-mobile-karma-ci.conf.js
```

Result:
- `npm run build` succeeds and writes to `www`.
- Focused marital-status relationship specs pass: `47 SUCCESS`.
- Full Karma suite passes with the Brave-backed headless config: `TOTAL: 246 SUCCESS`.
- Plain `ChromeHeadless` without Google Chrome remains unavailable on this Mac; the temp Karma config points the Chrome launcher at installed Brave and uses port `9877`.
- `git diff --check` passed.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Renewals/alerts cached-refresh verification on 2026-05-12:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/renewals/renewals.page.spec.ts' --include='src/app/pages/notifications/notifications.page.spec.ts'
npm run build
```

Result:
- Focused renewals and notifications tests pass: `11 SUCCESS`.
- `npm run build` succeeds and writes to `www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Registration language-toggle verification on 2026-05-12:
```bash
cd /Users/rahkehs/Downloads/Insurance/InsuranceMobileApp
npm run build
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless
```

Result:
- `npm run build` succeeds and writes to `www`.
- Full mobile Karma suite passes: `114 SUCCESS`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).

Upload file type rules verification on 2026-05-26:
```bash
cd /Users/rahkehs/Downloads/Other/2026/Insurance/InsuranceMobileApp
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/profile/profile.page.spec.ts
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts
CHROME_BIN="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/renewals/renewals.page.spec.ts --include=src/app/pages/renewal-detail/renewal-detail.page.spec.ts --include=src/app/services/enrollment.service.spec.ts
npm run build
```

Result:
- Profile, enrollment wizard, renewal list/detail, and enrollment service specs passed with picker assertions for `image/*` photo uploads and `image/*,application/pdf` document uploads.
- Upload utility coverage verifies deterministic `citizen_*`, target-group, and PDF pass-through filenames. Enrollment, renewal, renewal-detail, profile, and enrollment-service paths now send deterministic FormData filenames; PDFs stay PDF bytes while images are compressed to WebP when supported.
- `npm run build` succeeds and writes to `www`.
- Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 131 bytes (`4.13 kB` total against `4.00 kB`).

Upload compression and filename verification on 2026-06-13:
```bash
cd /Users/rahkehs/Downloads/Other/2026/Insurance/InsuranceMobileApp
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/utils/upload-file.util.spec.ts --include=src/app/services/enrollment.service.spec.ts --include=src/app/pages/enrollment-wizard/enrollment-wizard.page.spec.ts --include=src/app/pages/renewals/renewals.page.spec.ts --include=src/app/pages/renewal-detail/renewal-detail.page.spec.ts --include=src/app/pages/profile/profile.page.spec.ts
npm run build
```

Result:
- Focused upload/service/page specs passed (`133 SUCCESS`) after adding WebP preparation and deterministic filename coverage.
- `npm run build` succeeds and writes to `www`; current warnings are the existing BS date-picker style budget warning and an unused `IonLabel` warning in `RenewalsPage`.
