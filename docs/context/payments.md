# InsuranceMobileApp Payments Context

Last updated: 2026-06-13

Gateway initiation, fallback, result polling, and payment-service expectations.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Payment Gateway Flow
- Payment return handling treats `status=pending` as a first-class result instead of showing a failed payment.
- The payment page polls backend status longer after gateway return. If the backend still reports pending after polling, the app routes to the payment result page with `status=pending` and a verification-pending reason.
- The payment result page can display pending verification, lets the user check again, and moves to success/failed only when `/api/payments/status/{referenceId}` returns a settled state.
- No-pay renewal payment creation may return `requires_payment=false` with `reference_id` and `payment_method=subsidy`; the app treats this as success and passes the returned reference to the payment result page without expecting a `payment_id`.
- Enrollment detail, renewal detail, and My Policy display saved subsidy/payment references when the backend includes `payment_reference`.
- Payment result pending copy is translated through the English/Nepali dictionaries.
- `GET /api/my-payments` payment rows may include `gateway_label`; `MyPaymentsPage` displays that label when present so imported legacy HIB contribution payments show as `Legacy HIB` instead of raw `legacy_imis`, while existing gateway rows still fall back to the uppercased `gateway` value.
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
