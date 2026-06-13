# InsuranceMobileApp Consent Context

Last updated: 2026-06-13

Mobile consent requirements and localized terms handling for enrollment, renewal, payment, and KYC flows.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Consent Gate
- Mobile now blocks sensitive enrollment, renewal, payment, and KYC actions until the user accepts the shared consent copy. API payloads send `consent_accepted=true` for a fresh acceptance or reuse `consent_acceptance_id` when the backend returns one.
- Enrollment list/new-enrollment creation shows a consent checkbox before creating the backend draft. `EnrollmentService.create()` includes `consent_accepted=true`; enrollment detail shows a fallback consent checkbox before direct draft submit only when the loaded draft has no linked `consent_acceptance_id`.
- Renewal search/initiation includes consent. `RenewalSearchPage` sends `consent_accepted=true` on search, stores `data.consent_acceptance_id`, and passes it to initiation. The renewals tab and renewal detail also require the checkbox before initiation, submit, or payment fallback actions.
- Mobile KYC lookup/update requires consent. `LegacyImisService.fetchKycDemoMember()` and `updateKycDemo()` include `consent_accepted=true` or the returned `consent_acceptance_id`; direct `updateKyc()` also sends consent.
- Payment fallback includes `consent_accepted=true` in `PaymentService.createPayment()` options so existing enrollment/renewal records without linked consent can be linked before gateway initiation.
- Backend enrollment config still returns backward-compatible `terms[flow].text` for `enrollment`, `kyc`, and `renewal`, but it is now locale-selected and accompanied by additive `text_en`, `text_ne`, `label_en`, and `label_ne` fields. `TermsService` chooses `text_ne` in Nepali mode and `text_en` in English mode, with fallback to legacy `text`, so the alert body does not show mixed bilingual content after a language toggle.
- Consent translations live under `consent.title`, `consent.body`, and `consent.required` in `src\app\i18n\en.ts` and `src\app\i18n\ne.ts`.
