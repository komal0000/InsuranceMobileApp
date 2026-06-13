# InsuranceMobileApp Renewal Context

Last updated: 2026-06-13

Policy-period impact and mobile renewal add/edit/remove/review behavior.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Backend Policy Period Impact
- Backend policy and renewal period dates now use BS-calendar anniversaries minus one day. Example: BS start `2084/02/03` returns BS end `2085/02/02`, not `2085/02/03`.
- Mobile API field names are unchanged for enrollment, dashboard profile, my-policy, and renewal payloads. Existing date display code should consume the corrected `policy_*`, `policy_*_bs`, and `renewal_*` values as before.
## Renewal Mobile Changes
- Renewal member add/edit no longer collects target-group fields.
- Renewal detail and the Renewals tab direct-add member form load first-service-point options from the renewal enrollment province/district and submit optional `first_service_point_id` for member add/edit, including an empty `first_service_point_id` when the user clears the optional member service point. Both renewal member forms also load profession options and submit the selected occupation label as `occupation` only for citizenship-mode members; birth-certificate members clear that value.
- Renewal member add/edit no longer collects a birth certificate back image; birth certificate is one document capture.
- Renewal member add/edit uses the same backend `relationship_gender_map` behavior as enrollment: deterministic relationships auto-fill and lock gender, while spouse/other/custom relationships stay manual.
- Renewal member relationship pickers and stale-value validation use the same backend-provided marital-status relationship block matrix as enrollment, with the local fallback matrix if config is unavailable.
- Renewal detail keeps Add Family Member below the member list. Removing an approved/covered existing renewal member requires a death/removal supporting file, while newly added unapproved renewal members skip the file picker and post multipart `_method=DELETE` without `death_document`.
- Relevant files:
  - `src\app\pages\renewal-detail\renewal-detail.page.ts`
  - `src\app\pages\renewal-detail\renewal-detail.page.html`
  - `src\app\pages\renewals\renewals.page.ts`
  - `src\app\pages\renewals\renewals.page.html`
- Renewal member FormData builders skip stale `target_group*` and `is_target_group` keys.
- Admin/staff management roles no longer see renewal search/initiation entry points.
- `RenewalsPage.canInitiateRenewal` permits renewal initiation only for `beneficiary` and `enrollment_assistant`.
- `RenewalSearchPage` also blocks direct renewal search/initiation for management roles and shows a management-safe notice.
- Official-role API consumers now receive backend-filtered review queues from `/api/enrollments`, `/api/renewals`, and `/api/dashboard`: draft/pre-submit records stay hidden from district/province users, and province renewal/enrollment queues start after district verification. Response shapes and mobile interfaces are unchanged.
- Official-role renewal detail API responses may now include additive `review_dossier` data for `district_eo`, `province`, and `super_admin` clients: policy/payment/household/member/document evidence plus added/updated/removed member groups. Existing beneficiary/mobile fields are unchanged, and normal mobile renewal screens do not need to consume this field.
- Backend renewal approval now blocks `district_eo` server-side with `403` even if an old role record still has `renewal.approve`; district EOs can verify or reject `pending_review`, while province/super-admin users approve or reject only `verified` renewals.
- Dashboard enrollment creation now permits only `beneficiary` and `enrollment_assistant`.
- Renewal detail uses the shared member form component. It still refetches renewal detail after member mutations because the backend response does not include enough updated premium/renewal aggregate state.
- Renewal detail follows the backend payment-first renewal flow: paid draft/eligible renewals route directly to the payment page and successful renewal payment copy says the renewal was sent for official review; zero-pay/subsidized renewals still call the submit endpoint and enter official review without a gateway payment.
- Renewals tab re-entry now uses cached-content refresh: existing enrollment/renewal content stays visible while background requests refresh the data, and the full-page spinner is reserved for first/empty loads.
