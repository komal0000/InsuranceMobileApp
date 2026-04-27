# InsuranceMobileApp Agent Notes

Use this file first when starting mobile work in `C:\Insurance\InsuranceMobileApp`.

## Project
- Ionic 8 + Angular 20 + Capacitor 8 mobile client.
- Main source: `src\app`.
- Builds web output into `www`.
- Consumes Laravel API from sibling backend: `C:\Insurance\InsuranceApp`.

## Working Rules
- Read `INSURANCEMOBILEAPP_CONTEXT.md` before broad code searches.
- After meaningful mobile changes, update `INSURANCEMOBILEAPP_CONTEXT.md` before finishing.
- If mobile work depends on or changes backend API expectations, also update `C:\Insurance\InsuranceApp\INSURANCEAPP_CONTEXT.md` with a short backend/API note.
- If API contracts change, check backend files and `C:\Insurance\InsuranceApp\INSURANCEAPP_CONTEXT.md`.
- Prefer `npm run build` after template/TypeScript changes.
- Prefer `npm test -- --watch=false --browsers=ChromeHeadless` after service/page test changes.
- Keep direct login password-only unless a registration handoff explicitly requests OTP setup UI.
- Do not reintroduce family-member target-group controls in enrollment or renewal member forms.
- Context updates are required for meaningful route, API, interface, flow, service, config, command, or verification changes; skip them for trivial formatting-only edits.

## Current Important Architecture
- Registration page is details-only.
- Login page shows OTP/password setup only when navigated from successful registration with setup state/query flag.
- Enrollment wizard is 3 steps:
  1. Household Head and Address
  2. Family Members
  3. Review and Submit
- Household-head NID lookup pre-fills returned fields and marks NID-filled fields readonly/disabled in UI.
- Member target-group collection is removed.
- Renewal member add/edit screens do not collect target-group fields.

## Key Verification Commands
```powershell
cd C:\Insurance\InsuranceMobileApp
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected current result:
- `npm run build` passes, with an existing SCSS budget warning for `src/app/pages/renewals/renewals.page.scss`.
- Headless tests pass: `17 SUCCESS`.

## Cross-Project Dependency
- Backend root: `C:\Insurance\InsuranceApp`.
- Backend context file: `C:\Insurance\InsuranceApp\INSURANCEAPP_CONTEXT.md`.
- Relevant backend endpoints for enrollment are in `routes\api.php` and `app\Http\Controllers\Api\EnrollmentController.php`.
