# InsuranceMobileApp Auth And Profile Context

Last updated: 2026-06-13

Authorization impact, registration/login setup, profile locks, language preference, and dashboard profile.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Backend Authorization Impact
- Backend API review decisions are now officer-only: `super_admin` and `admin` are view-only for enrollment, renewal, and KYC official decisions.
- Enrollment verify/approve/reject, renewal verify/approve/reject, KYC approve/reject/retry-sync, member-level verify/approve/reject, and subsidy management API routes return `403` for admin/super-admin clients. District EO keeps verification/KYC decision access; province keeps approval access.
- Admin/super-admin API enrollment visibility now excludes draft enrollments: `/api/enrollments?status=draft` returns no draft rows and `/api/enrollments/{draftId}` returns `403`; non-draft enrollment response shapes are unchanged.
- No mobile interface shape changed, but any staff/official mobile workflow should hide decision controls when these endpoints return `403`.
## Beneficiary Dashboard Profile
- The beneficiary dashboard is profile-first. It consumes optional `profile` data from `GET /api/dashboard` and shows the household head photo/avatar, HIB number, enrollment/status/policy/address details, plus compact rows for all other members with HIB/member numbers.
- `src\app\interfaces\dashboard.interface.ts` defines `BeneficiaryDashboardProfile`, `BeneficiaryDashboardProfileEnrollment`, and person/member shapes. Missing profile data renders a safe empty state.
- The mobile Renewals tab remains unchanged. Dashboard quick actions label the KYC action as `KYC` / `Update household KYC details` and open the primary `/kyc` route. Beneficiary quick actions also expose HIB Profile at `/tabs/hib-profile`.
- Existing beneficiary insurance checker remains below the profile card.
- Verification includes `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/dashboard/dashboard.page.spec.ts`, full `npm test -- --watch=false --browsers=ChromeHeadless`, and `npm run build`.
- Important files:
  - `src\app\pages\dashboard\dashboard.page.ts`
  - `src\app\pages\dashboard\dashboard.page.html`
  - `src\app\pages\dashboard\dashboard.page.scss`
  - `src\global.scss`
  - `src\app\interfaces\dashboard.interface.ts`
  - `src\app\i18n\en.ts`
  - `src\app\i18n\ne.ts`
## Recent Auth Flow Changes
- `RegisterPage` is details-only:
  - full name
  - full name (नेपाली)
  - mobile number
  - optional email
- Register shows the language switch as a login-style top-right pill over the blue header. The app-level floating language toggle is no longer shown on `/register`; it remains available on `/forgot-password`.
- Register keeps Nepali full-name transliteration on the Nepali name input through `appNepaliInput`.
- Register now validates names before calling the API:
  - English full name must be at least two Latin-letter words.
  - Nepali full name must be at least two Devanagari-script words.
  - Extra spaces are normalized before submit.
- `src\app\utils\auth-validation.ts` also exposes `isNepaliNamePart()` for optional split Nepali-name fields. Profile, enrollment household-head/parent/grandparent fields, enrollment members, renewal members, and registration now reject English letters, mixed English/Nepali, digits, Nepali digits, and punctuation before API submit; Laravel remains authoritative and returns `422` for invalid API payloads.
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
- Login setup-password, forgot-password reset, and profile change-password now use the backend-aligned strong-password rule: 8+ characters with uppercase, lowercase, number, and symbol. The mobile validator counts Unicode code points, not JavaScript UTF-16 code units, to match Laravel `Str::length()`.
- Password inputs on normal login, login setup-password, forgot-password OTP reset, and profile change-password have per-field `eye-outline` / `eye-off-outline` reveal buttons. Each page keeps independent visibility state per input and leaves the existing form models/API payloads unchanged.
- Backend password reset and profile change-password now reject matching the current password or the immediately previous password tracked from the next successful change onward. API validation messages are surfaced from the backend; request payloads are unchanged.
- Existing user login remains password-based by mobile or approved household HIB number.
- Mobile request payloads are unchanged for HIB login/setup (`identifier_type=hib_number`, `identifier`, password/OTP fields), but the backend now normalizes formatted/Nepali-digit household HIB input and only accepts it after the linked enrollment is approved/active. Unapproved HIB numbers return the existing credential/setup validation errors.
- Authenticated user payloads now include `preferred_language`.
- Authenticated user payloads now include additive `profile_locked_fields`. When the backend returns `date_of_birth`, `province`, or `district` in this array, `ProfilePage` renders those identity fields read-only and omits them from `/api/profile` updates because they are managed from the verified enrollment.
- `AuthService` syncs backend `preferred_language` into the mobile language service on login, setup-password login, profile fetch, and language update.
- `AuthService.updateLanguage()` calls `PATCH /api/user/language` and updates the cached user.
- Mobile startup stores a local fallback language with Capacitor Preferences, but the backend user preference is authoritative after authentication.

Important auth files:
- `src\app\pages\register\register.page.ts`
- `src\app\pages\register\register.page.html`
- `src\app\pages\login\login.page.ts`
- `src\app\pages\login\login.page.html`
- `src\app\pages\forgot-password\*`
- `src\app\pages\profile\profile.page.ts`
- `src\app\utils\auth-validation.ts`
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
- Password visibility verification includes `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/login/login.page.spec.ts --include=src/app/pages/forgot-password/forgot-password.page.spec.ts --include=src/app/pages/profile/profile.page.spec.ts`, plus the full app build/test commands in the Verification section.
