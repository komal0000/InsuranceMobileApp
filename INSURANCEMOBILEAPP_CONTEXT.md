# InsuranceMobileApp Current Context

Last updated: 2026-05-14

This file captures the current Ionic/Angular state so future conversations do not need to rediscover the mobile app.

## App Shape
- Root: `C:\Insurance\InsuranceMobileApp`.
- Ionic `^8.0.0`, Angular `^20.0.0`, Capacitor `8.1.0`, TypeScript `~5.9.0`.
- Capacitor/Android display app name is `HIB`; package/application id is still `io.ionic.starter`.
- StatusBar is configured with the HIB blue background and non-overlay mode. Android API 35+ has `values-v35/styles.xml` opt out of edge-to-edge enforcement for the app launch/no-action-bar themes so the system status icons do not overlap Ionic headers where Android permits opt-out.
- Main UI pages live under `src\app\pages`.
- API services live under `src\app\services`.
- Shared interfaces live under `src\app\interfaces`.
- Backend API is Laravel in `C:\Insurance\InsuranceApp`.

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
- Backend password reset and profile change-password now reject matching the current password or the immediately previous password tracked from the next successful change onward. API validation messages are surfaced from the backend; request payloads are unchanged.
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
  - `EnrollmentConfig.relationship_blocked_by_head_marital_status` is optional and maps head marital status keys to blocked relationship keys.

Step 1 includes:
- household-head NID lookup
- personal information
- required split father/mother/grandfather first-name and last-name fields in English and Nepali, grouped compactly by Father, Mother, and Grandfather with English first/last fields followed by Nepali first/last fields
- age-aware identity document fields: citizenship for household heads 16+, birth-certificate number/issue-date/document for household heads under 16
- permanent address
- temporary address
- optional Basai Sarai front/back file capture when temporary differs
- first service point dropdown loaded from backend service points after permanent province/district selection
- profession ID select
- qualification ID select
- household target group
- Mobile Step 1 section order now mirrors the web enrollment form:
  1. Start with Household Head NID
  2. Personal Information
  3. Parent and Grandparent Information
  4. Identity Document
  5. Permanent Address
  6. Temporary Address
  7. Service Point and Additional Information
  8. Household Target Group
- Household-head English and Nepali middle-name inputs are not rendered or submitted from mobile enrollment. Existing backend/interface middle-name fields remain for compatibility with historical data only.
- Household-head contact fields are prefilled from the authenticated user when the enrollment fields are empty: registered `mobile_number` and optional registered `email`. Existing saved/manual enrollment values and NID-provided values are not overwritten.

NID behavior:
- Step 1 starts with the household-head NID lookup/manual fallback gate, matching the web enrollment flow; permanent and temporary address fields are not shown until lookup succeeds or the user chooses manual entry.
- User-entered NID values accept ASCII digits, Nepali/Devanagari digits, and optional hyphen/space separators; validation counts 1 to 10 actual digits after normalization. Household-head lookup, household-head manual fallback, family-member lookup, household-head save/draft validation, and renewal national-ID search enforce that rule before calling the API.
- The beneficiary dashboard includes an insurance checker card that posts normalized NID input to `POST /api/insurance-check`. Results show only whether active insurance exists plus enrollment number, status, and policy period. When active insurance is found, the UI tells the user they cannot enroll using that NID and should use renewal.
- Backend duplicate-active-NID validation from household-head lookup/save is surfaced in the enrollment wizard instead of falling back to a generic save failure.
- Manual fallback stores the household-head `national_id` as canonical ASCII digits while leaving it as unverified manual data.
- `headNidLookup(id, nationalId)` calls `POST /api/enrollments/{id}/head/nid-lookup`.
- On success, returned NID fields are written into `headData` and permanent address state.
- Returned combined NID parent/grandparent names are split into the required first-name and last-name fields; backend-provided split fields are used directly when available.
- If NID lookup does not return an email, the wizard preserves the existing/registered household-head email instead of clearing it.
- Populated NID fields are tracked in `nidLockedHeadFields`.
- Locked household-head NID fields render as grouped `Verified From NID` label/value rows above Step 1 editable controls; their underlying model values stay in `headData`/address state and continue to be submitted in `FormData`.
- Missing NID fields remain editable.
- NID photo preview is used when `photo_url` is returned.
- For household-head NID-verified Step 1, citizenship front/back capture controls are hidden and a note explains that citizenship card images are not required. Manual fallback, family-member NID, and renewal member behavior are unchanged.
- Household-head DOB now drives identity collection. Ages 1 through 100 are accepted; under-16 heads submit `document_type=birth_certificate`, `birth_certificate_number`, `birth_certificate_issue_date`, and `birth_certificate_front_image`, while stale citizenship keys/files are removed from `FormData`. Exactly 16 and older submit `document_type=citizenship` and keep the existing citizenship details/image flow.
- Mobile pre-submit validation mirrors the backend citizenship issue-date rule: citizenship issue dates are normalized through `DateService` and must be at least 16 years after DOB. The check runs for enrollment wizard household-head save/draft, enrollment member save, renewals-tab add-member, and renewal-detail member add/edit; birth-certificate flows are skipped.
- If household-head NID lookup fills an under-16 DOB, the wizard still requires birth-certificate details/document while keeping the NID photo behavior.
- Mobile consumes backend-mapped NID display fields directly: `province`, `district`, `municipality`, `ward_number`, `tole_village`, `citizenship_issue_district`, and JPEG `photo_url`.
- Household-head NID tests cover Bagamati/Makawanpur/Hetauda mapped address selection, locked citizenship issue/date fields, grouped verified label/value metadata, saved NID payload restoration, and JPEG photo preview.
- Member NID tests cover `citizenship_issue_district` and JPEG `photo_url` preview.

Save behavior:
- `saveHouseholdHead(id, formData)` calls `POST /api/enrollments/{id}/household-head`.
- Old `saveStep1`, `saveStep2`, and generic `nidLookup` methods remain for compatibility.
- Step 1 save sends permanent address, temporary address, selected `first_service_point_id`, household-head fields, required split parent/grandparent name fields, profession/qualification IDs, target-group fields, and files. Legacy combined parent/grandparent name fields are composed from the split fields before submit for compatibility. The backend resolves the selected ID to the service-point name snapshot.
- Backend API save/submit endpoints now also accept an enrollment in `rejected` status when the rejection actor was `district_eo` or `province` and the authenticated user is the household head or original enroller. Resubmission returns the enrollment to `pending_verification` and clears stale rejection/verification fields; response shapes are unchanged.

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
- `temporarySameAsPermanent` defaults to `false`; users must explicitly toggle same-as-permanent.
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
- Enrollment Step 2 shows the household head and existing members first. The Add Family Member button/form is below the list and the form is hidden until the user chooses to add or edit a member.
- Member birth certificate capture now collects a single `birth_certificate_front_image` document labeled as the birth certificate document. Active enrollment and renewal member UI/FormData paths no longer collect `birth_certificate_back_image`; the optional interface field remains only for legacy backend payload compatibility.
- Member English and Nepali middle-name inputs are not rendered in enrollment member entry, not copied into edit form state, and not submitted in member add/update FormData even if stale keys exist locally.
- Step 2 and review name displays show first name plus last name only.
- Member target-group UI and payload collection are removed.
- Mobile consumes backend `/api/enrollment-config.relationship_blocked_by_head_marital_status` for assistive relationship filtering and stale-value blocking in enrollment wizard, renewals list add-member, and renewal-detail member forms. If config is unavailable, `src\app\utils\relationship-marital-status.util.ts` falls back to the backend matrix: `single` blocks spouse, descendants, and all in-laws; `divorced`/`widowed`/`separated` block spouse plus spouse-side in-laws while allowing child-side in-laws.
- Relationship filtering remains active for enrollment, renewals-tab add-member, and renewal-detail member forms, but the visible helper text explaining hidden relationship options has been removed for consistency with the web member forms.
- Relationship selection now auto-fills and locks member gender when the backend `relationship_gender_map` marks the relationship as deterministic. Son/father/brother/grandfather/grandson/father-in-law/brother-in-law/son-in-law map to male; daughter/mother/sister/grandmother/granddaughter/mother-in-law/sister-in-law/daughter-in-law map to female. Spouse, other, self, and unknown relationships remain manual.
- Mobile relationship and marital labels include `brother_in_law`, `sister_in_law`, and `separated`.
- Backend enrollment/renewal member saves enforce relationship DOB hierarchy across household members. Mobile remains UI-assistive only and now surfaces backend member-save validation errors, including `date_of_birth` hierarchy failures, in the enrollment wizard toast.
- Backend enrollment/renewal member saves also enforce `citizenship_issue_date` as DOB + 16 years or later. Mobile performs the same pre-submit check for clearer feedback but still treats the backend as authoritative.
- Backend enrollment/renewal member saves also enforce English last-name surname matching for bloodline relationships against both the household-head father and grandfather surnames when those surnames are available; mobile surfaces the backend `last_name` validation message.
- Member removal in enrollment and renewal detail uses the backend-mirrored `requiresRemovalDocument()` helper. Approved/covered members still require a selected death/removal supporting file, while draft, pending, district-verified, rejected, or current-renewal newly added members can be removed without selecting a file. `EnrollmentService.removeMember()` sends multipart `FormData` with `_method=DELETE` and includes `death_document` only when a file is required/provided.
- Existing stale keys are skipped in FormData where relevant.
- The shared `src\app\components\member-form\member-form.component.ts` is used by enrollment member entry and renewal detail member entry.
- Enrollment member add/update uses mutation response data to update the current in-memory member list when enough state is returned; full enrollment refetches are still used where server-calculated review/subsidy state is needed.
- Backend enrollment numbers now account for soft-deleted drafts, so mobile users can delete a draft enrollment and immediately create a new one without the API reusing the deleted draft's unique enrollment number.

## Renewal Mobile Changes
- Renewal member add/edit no longer collects target-group fields.
- Renewal member add/edit no longer collects a birth certificate back image; birth certificate is one document capture.
- Renewal member add/edit uses the same backend `relationship_gender_map` behavior as enrollment: deterministic relationships auto-fill and lock gender, while spouse/other/custom relationships stay manual.
- Renewal member relationship pickers and stale-value validation use the same backend-provided marital-status relationship block matrix as enrollment, with the local fallback matrix if config is unavailable.
- Renewal detail keeps Add Family Member below the member list. Removing an approved/covered renewal member requires a death/removal supporting file, while newly added unapproved renewal members skip the file picker and post multipart `_method=DELETE` without `death_document`.
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
- Renewals tab re-entry now uses cached-content refresh: existing enrollment/renewal content stays visible while background requests refresh the data, and the full-page spinner is reserved for first/empty loads.

## Notification Mobile Changes
- Alerts/notifications tab re-entry now keeps the existing notification list visible while page 1 and the unread count refresh in the background. First empty load still shows the full-page spinner, and pull-to-refresh remains the explicit fresh-data interaction.

## Dashboard Insurance Checker
- Beneficiary dashboard only:
  - `DashboardDataService.checkInsurance()` calls `POST /api/insurance-check`.
  - `DashboardPage` validates NID input with `src\app\utils\nid-number.util.ts` before calling the API.
  - The dashboard card shows a minimal result and policy summary; admin/staff/enrollment-assistant dashboards do not show the checker.
  - A beneficiary-only quick action opens `/kyc-demo` for the legacy IMIS KYC testing workflow.
- Response data expected from backend:
  - `national_id`
  - `has_active_insurance`
  - `can_enroll`
  - `message`
  - `summary` with enrollment number, status, policy start date, and policy end date.
- Relevant files:
  - `src\app\pages\dashboard\dashboard.page.*`
  - `src\app\services\dashboard-data.service.ts`
  - `src\app\interfaces\dashboard.interface.ts`

## Legacy IMIS Integration
- `LegacyImisService` wraps the new backend proxy endpoints instead of calling `imislegacy.hib.gov.np` directly from mobile.
- `familyMembers(chfid, nationalId?)` calls `GET /api/legacy-imis/family-members` with `chfid` and optional normalized `national_id`; the backend enforces staff-vs-beneficiary access and returns normalized member rows.
- `updateKyc(payload)` calls `POST /api/legacy-imis/kyc-update` with `chfid`, optional normalized `national_id`, and allowlisted mutable KYC fields: `firstname`, `lastname`, `date_of_birth`, `gender`, `phone`, `email`, `current_address`, `geolocation`, `relationship_code`, `profession_id`, `education_id`, and `health_facility_id`. The backend maps those fields to the legacy update payload and never forwards locked/system fields.
- `KycDemoPage` at `/kyc-demo` mirrors the web demo: users enter `household_head_chfid` and `member_chfid`, `fetchKycDemoMember()` calls `GET /api/legacy-imis/kyc-demo/member`, the page displays household data separately from the selected member, shows all normalized selected-member fields in input-style controls, keeps `chfid`, `legacy_id`, `uuid`, `family_id`, `is_household_head`, `photo_id`, and `card_issued` readonly, and `updateKycDemo()` calls `POST /api/legacy-imis/kyc-demo/update` with only mutable KYC fields; the backend updates the selected member's `chfid` and returns refreshed data.
- Relevant files:
  - `src\app\services\legacy-imis.service.ts`
  - `src\app\interfaces\legacy-imis.interface.ts`
  - `src\app\pages\kyc-demo\kyc-demo.page.*`

## Payment Gateway Flow
- Payment return handling treats `status=pending` as a first-class result instead of showing a failed payment.
- The payment page polls backend status longer after gateway return. If the backend still reports pending after polling, the app routes to the payment result page with `status=pending` and a verification-pending reason.
- The payment result page can display pending verification, lets the user check again, and moves to success/failed only when `/api/payments/status/{referenceId}` returns a settled state.
- No-pay renewal payment creation may return `requires_payment=false` with `reference_id` and `payment_method=subsidy`; the app treats this as success and passes the returned reference to the payment result page without expecting a `payment_id`.
- Enrollment detail, renewal detail, and My Policy display saved subsidy/payment references when the backend includes `payment_reference`.
- Payment result pending copy is translated through the English/Nepali dictionaries.
- Relevant files:
  - `src\app\pages\payment\payment.page.ts`
  - `src\app\pages\payment\payment.page.spec.ts`
  - `src\app\pages\enrollment-detail\enrollment-detail.page.*`
  - `src\app\pages\renewal-detail\renewal-detail.page.*`
  - `src\app\pages\my-policy\my-policy.page.*`
  - `src\app\pages\payment-result\payment-result.page.ts`
  - `src\app\pages\payment-result\payment-result.page.html`
  - `src\app\pages\payment-result\payment-result.page.scss`
  - `src\app\pages\payment-result\payment-result.page.spec.ts`
  - `src\app\interfaces\payment.interface.ts`
  - `src\app\interfaces\renewal.interface.ts`
  - `src\app\i18n\en.ts`
  - `src\app\i18n\ne.ts`

## Language Toggle
- `LanguageToggleComponent` supports `floating` and `toolbar` placements.
- Header-based pages render the compact English/Nepali toggle in the primary `ion-toolbar`; `AppComponent` only shows the floating fallback on no-header auth pages that need it, while Login keeps its existing language control.
- The toggle persists locally for guest/startup screens and syncs to the backend for authenticated users.
- The lightweight translation system uses `LanguageService`, `TranslatePipe`, and the dictionaries under `src\app\i18n`.
- Login, register, dashboard, enrollments, enrollment detail, and enrollment wizard step titles/messages now resolve through `LanguageService`/`TranslatePipe` instead of relying only on DOM phrase replacement.
- Nepali-name field labels use the mixed-script convention in English UI (`Full Name (नेपाली)`, `First Name (नेपाली)`, `Last Name (नेपाली)`) while Nepali UI keeps natural labels such as `पूरा नाम (नेपाली)`, `पहिलो नाम (नेपाली)`, and `थर (नेपाली)` across registration, profile, enrollment, and renewal/member forms.
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
- `scripts/check-localized-templates.cjs` and `npm run check:i18n` guard against new hardcoded English text/label/placeholder/alt/title/aria-label values in mobile HTML templates, with expected exceptions for technical notation such as blood groups and IDs.

## Geo Loading Cache
- `src\app\services\geo.service.ts` has in-session caching using shared observable behavior for repeated geo calls.
- Backend remains the primary cache layer.
- Enrollment wizard loads cascading options in order:
  - province
  - districts
  - municipality
  - wards
- `GeoService.servicePoints(province, district)` calls `/geo/service-points/{province}/{district}` and caches the in-session response; the enrollment wizard clears and reloads service-point options whenever the permanent province/district changes.

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

## Verification
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
npm run android:release:apk
npm run android:release:aab
```
- Release npm scripts use `scripts/android-gradle.cjs` to choose the Gradle wrapper by platform: `gradlew.bat` on Windows and `sh ./gradlew` on macOS/Linux.
- `npm run android:release:apk` runs Gradle `installRelease`, so it builds the release APK artifact and installs it on the connected Android device. Use `npm run android:gradle -- assembleRelease` when only an APK artifact is needed.
- macOS release script verified on 2026-05-13:
  - `npm run android:release:apk` succeeds, creates `android/app/build/outputs/apk/release/app-release.apk`, and installs it on connected device `CPH2569 - 15`.
  - `npm run android:install:release` remains an explicit connected-device install command for release APKs.
  - `npm run android:gradle -- bundleRelease` succeeds and creates the release AAB through the same platform-aware helper.
  - Existing build warning remains: `src/app/components/bs-date-picker/bs-date-picker.component.ts` style budget exceeded by 55 bytes (`4.05 kB` total against `4.00 kB`).
- Header/status-bar overlap fix verified on 2026-05-12:
  - `npm run build`, `npx cap sync android`, and `npm run android:release:apk` succeeded after StatusBar/native resource changes; the resulting release APK was installed on connected Android 15 device `CPH2569`.
  - Generated `android/app/src/main/assets/capacitor.config.json` includes `StatusBar.overlaysWebView=false`, `backgroundColor="#003087"`, and `style="DARK"`.
  - Android header spacing depends on Capacitor StatusBar non-overlay config plus the API 35 edge-to-edge opt-out resource; no hardcoded toolbar padding is used to avoid double spacing on devices with correct safe-area handling.
  - Final acceptance remains a visual check on the affected phone/emulator: status icons above the Dashboard title, language toggle inside the toolbar, primary toolbars spaced correctly, and bottom tabs clear of the navigation area.
- macOS local release/device install verified on 2026-05-11:
  - Android SDK path: `/opt/homebrew/share/android-commandlinetools`
  - `npm run build:prod`, `npx cap sync android`, `sh ./gradlew assembleRelease`, `apksigner verify`, and `adb install -r` succeeded.
  - Direct `./gradlew` execution may be blocked by macOS quarantine metadata on copied files; running the wrapper through `sh ./gradlew ...` works.
  - Installed package on device `ba72a8a0` is `io.ionic.starter`, `versionCode=1`, `versionName=1.0`.

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
