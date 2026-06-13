# InsuranceMobileApp KYC NID And IMIS Context

Last updated: 2026-06-13

Legacy IMIS/KYC integration and geo loading cache behavior.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Legacy IMIS Integration
- `LegacyImisService` wraps the new backend proxy endpoints instead of calling `imislegacy.hib.gov.np` directly from mobile.
- `familyMembers(chfid, nationalId?)` calls `GET /api/legacy-imis/family-members` with `chfid` and optional normalized `national_id`; the backend enforces staff-vs-beneficiary access and returns normalized member rows.
- `updateKyc(payload)` calls `POST /api/legacy-imis/kyc-update` with `chfid`, optional normalized `national_id`, and allowlisted mutable KYC fields: `firstname`, `lastname`, `date_of_birth`, `gender`, `phone`, `email`, `current_address`, `geolocation`, `relationship_code`, `profession_id`, `occupation`, `education_id`, `education`, `health_facility_id`, `fsp`, `citizenship`, `citizenship_number`, `national_id`, split parent/grandparent names (`f_*`, `m_*`, `gf_*` English/local first/last fields), `birth_certificate`, and `photo`. The backend maps those fields to the legacy update payload and never forwards locked/system fields.
- `KycDemoPage` is the user-facing mobile KYC page at `/kyc`; `/kyc-demo` redirects to `/kyc` for compatibility. Beneficiaries can open KYC from the dashboard quick action or the Profile shortcut. Users enter `household_head_chfid` and `member_chfid`, `fetchKycDemoMember()` calls `GET /api/legacy-imis/kyc-demo/member`, the page displays household data separately from the selected member, shows normalized selected-member fields plus optional citizenship/NID, split parent/grandparent name, and birth-certificate inputs, supports camera/file profile photo capture stored as a `data:image/...;base64,...` `photo` payload, keeps `chfid`, `legacy_id`, `uuid`, `family_id`, `is_household_head`, `photo_id`, and `card_issued` readonly, and `updateKycDemo()` calls `POST /api/legacy-imis/kyc-demo/update` with only mutable KYC fields; the backend updates the selected member's `chfid` and returns refreshed data.
- Relevant files:
  - `src\app\services\legacy-imis.service.ts`
  - `src\app\interfaces\legacy-imis.interface.ts`
  - `src\app\pages\kyc-demo\kyc-demo.page.*`
## Geo Loading Cache
- `src\app\services\geo.service.ts` has in-session caching using shared observable behavior for repeated geo calls.
- Backend remains the primary cache layer.
- Enrollment wizard loads cascading options in order:
  - province
  - districts
  - municipality
  - wards
- `GeoService.servicePoints(province, district)` calls `/geo/service-points/{province}/{district}` and caches the in-session response; the enrollment wizard clears and reloads service-point options whenever the permanent province/district changes.
- Renewal detail and Renewals direct-add load member service-point options through the API service from `/geo/service-points/{province}/{district}` using the enrollment's stored province/district.
