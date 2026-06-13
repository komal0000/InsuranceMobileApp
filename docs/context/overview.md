# InsuranceMobileApp Overview Context

Last updated: 2026-06-13

Mobile app shape, framework versions, platform identity, and branding rules.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## App Shape
- Root: `C:\Insurance\InsuranceMobileApp`.
- Ionic `^8.8.8`, Angular `^20.0.0`, Capacitor `8.3.4`, TypeScript `~5.9.0`.
- Capacitor/Android display app name is `HIB`; package/application id is `com.needtechnosoft.hib`.
- StatusBar is configured with the HIB blue background and non-overlay mode. Android API 35+ has `values-v35/styles.xml` opt out of edge-to-edge enforcement for the app launch/no-action-bar themes so the system status icons do not overlap Ionic headers where Android permits opt-out.
- User-facing copy should brand the system as `HIB(Health Insurance Board)` / Health Insurance Board, Nepal. Do not reintroduce the previous program-era naming in mobile copy, translations, or style comments.
- Main UI pages live under `src\app\pages`.
- API services live under `src\app\services`.
- Shared interfaces live under `src\app\interfaces`.
- Backend API is Laravel in `C:\Insurance\InsuranceApp`.
