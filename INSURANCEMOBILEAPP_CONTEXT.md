# InsuranceMobileApp Context

Last updated: 2026-06-13

This file is now a lightweight router. Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first, then open only the domain context file that matches the task. The detailed historical notes were split into `docs/context/` so agents can update the touched domain without editing one bulk file.

## Domain Context

- `docs/context/overview.md`: Mobile app shape, framework versions, platform identity, and branding rules.
- `docs/context/auth-profile.md`: Authorization impact, registration/login setup, profile locks, language preference, and dashboard profile.
- `docs/context/enrollment.md`: Enrollment wizard structure, child components, payload expectations, and enrollment verification notes.
- `docs/context/renewal.md`: Policy-period impact and mobile renewal add/edit/remove/review behavior.
- `docs/context/consent.md`: Mobile consent requirements and localized terms handling for enrollment, renewal, payment, and KYC flows.
- `docs/context/profile-policy.md`: Policy/card surfaces and beneficiary insurance checker behavior.
- `docs/context/kyc-nid-imis.md`: Legacy IMIS/KYC integration and geo loading cache behavior.
- `docs/context/payments.md`: Gateway initiation, fallback, result polling, and payment-service expectations.
- `docs/context/notifications.md`: Mobile notification behavior and push-related notes.
- `docs/context/localization-performance.md`: Language toggle behavior, translations, runtime, and bundle optimization.
- `docs/context/verification-history.md`: Historical mobile verification runs, build/test results, and known local browser constraints.
- `docs/context/deployment.md`: Mobile deployment notes and backend reference pointers.

## Shared Cross-App Context

- `../docs/context/api-contracts.md`: backend/mobile API contract routing and update rules.
- `../docs/context/cross-app-risk-areas.md`: contract-sensitive areas that require checking both apps.

## Update Rule

For meaningful route, API, interface, flow, service, config, command, or verification changes, update the smallest relevant file under `docs/context/`. If a mobile expectation changes an API contract, also update `../docs/context/api-contracts.md` and check the matching backend route/controller/service.
