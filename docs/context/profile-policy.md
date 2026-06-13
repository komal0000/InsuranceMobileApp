# InsuranceMobileApp Profile Policy And Checker Context

Last updated: 2026-06-13

Policy/card surfaces and beneficiary insurance checker behavior.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Dashboard Insurance Checker
- Beneficiary dashboard only:
  - `DashboardDataService.checkInsurance()` calls `POST /api/insurance-check`.
  - `DashboardPage` validates NID input with `src\app\utils\nid-number.util.ts` before calling the API.
  - The dashboard card shows a minimal result and policy summary; admin/staff/enrollment-assistant dashboards do not show the checker.
  - A beneficiary-only quick action opens `/kyc` for the KYC update workflow.
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
