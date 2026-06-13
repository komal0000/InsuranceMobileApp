# InsuranceMobileApp Context Summary

Last updated: 2026-06-13

This is the token-efficient entrypoint for mobile work. Use `INSURANCEMOBILEAPP_CONTEXT.md` as a router, then open only the relevant file under `docs/context/`.

## Current Shape

- Ionic 8, Angular 20, Capacitor 8 mobile app for HIB(Health Insurance Board), Nepal.
- Main UI pages: `src/app/pages`
- Shared components: `src/app/components`
- API services: `src/app/services`
- API interfaces: `src/app/interfaces`
- Backend API provider: `../InsuranceApp`

## High-Value Entrypoints

- Routing: `src/app/app.routes.ts`
- Auth and API transport: `src/app/services/auth.service.ts`, `src/app/services/api.service.ts`
- Enrollment: `src/app/pages/enrollment-wizard`, `src/app/services/enrollment.service.ts`
- Renewal: `src/app/pages/renewals`, `src/app/pages/renewal-detail`, `src/app/services/renewal.service.ts`
- Policy/card surfaces: `src/app/pages/my-policy`, `src/app/pages/hib-profile`
- Localization: `src/app/i18n/en.ts`, `src/app/i18n/ne.ts`

## Domain Context

- `docs/context/auth-profile.md`: auth, profile locks, language preference, dashboard profile.
- `docs/context/enrollment.md`: enrollment wizard and payload expectations.
- `docs/context/renewal.md`: renewal behavior and policy-period impacts.
- `docs/context/consent.md`: consent requirements and localized terms.
- `docs/context/profile-policy.md`: policy/card surfaces and insurance checker.
- `docs/context/kyc-nid-imis.md`: KYC, legacy IMIS, geo cache.
- `docs/context/payments.md`: payment gateway and fallback behavior.
- `docs/context/notifications.md`: notification behavior.
- `docs/context/localization-performance.md`: language toggle, translations, runtime, bundle notes.
- `docs/context/verification-history.md`: historical mobile verification runs and known local constraints.
- `docs/context/deployment.md`: deployment notes and backend references.

## Current Risk Areas

- Backend API response shapes and mobile TypeScript interfaces must stay aligned.
- Consent must be sent for enrollment, renewal, KYC, and payment fallback actions.
- NID/manual enrollment paths have field-locking, upload, and validation behavior.
- Renewal member add/edit/remove behavior mirrors backend member rules.
- Profile identity fields can be locked by backend `profile_locked_fields`.

## Token-Saving Guidance

- Avoid `.angular`, `node_modules`, `www`, `android/.gradle`, `android/**/build`, generated native assets, logs, screenshots, and `package-lock.json` unless the task specifically needs them.
- Start from services/interfaces before opening large page files.
- For enrollment, inspect child components under `src/app/pages/enrollment-wizard/components` before reading the whole page file.

## Verification Defaults

- Build: `npm run build`
- Focused test: `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/path/to/file.spec.ts`
- Full tests: `npm test -- --watch=false --browsers=ChromeHeadless`
