# InsuranceMobileApp Enrollment Context

Last updated: 2026-06-13

Enrollment wizard structure, child components, payload expectations, and enrollment verification notes.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

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
- optional split father/mother/grandfather first-name and last-name fields in English and Nepali, grouped compactly by Father, Mother, and Grandfather with English first/last fields followed by Nepali first/last fields
- age-aware identity document fields: citizenship for household heads 16+, birth-certificate number/issue-date/document for household heads under 16
- permanent address source (`nid`, `citizenship`, or `migration`)
- permanent address
- temporary address
- optional Basai Sarai front/back file capture when permanent address source is `migration`
- first service point dropdown loaded from backend service points after permanent province/district selection
- profession select for household heads 16+; hidden and cleared for under-16 birth-certificate household heads
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
- Returned combined NID parent/grandparent names are split into the optional first-name and last-name fields; backend-provided split fields are used directly when available.
- If NID lookup does not return an email, the wizard preserves the existing/registered household-head email instead of clearing it.
- Populated NID fields are tracked in `nidLockedHeadFields`.
- Locked household-head NID fields render as grouped `Verified From NID` label/value rows above Step 1 editable controls; their underlying model values stay in `headData`/address state and continue to be submitted in `FormData`.
- Missing NID fields remain editable.
- NID photo preview is used when `photo_url` is returned.
- For household-head NID-verified Step 1, citizenship front/back capture controls are hidden and a note explains that citizenship card images are not required. Manual fallback, family-member NID, and renewal member behavior are unchanged.
- Household-head DOB now drives identity collection. Ages 1 through 100 are accepted; under-16 heads submit `document_type=birth_certificate`, `birth_certificate_number`, `birth_certificate_issue_date`, and `birth_certificate_front_image`, while stale citizenship keys/files and profession/occupation values are removed from `FormData`. Exactly 16 and older submit `document_type=citizenship` and keep the existing citizenship details/image flow.
- Mobile birth certificate number inputs normalize pasted/typed mixed text to ASCII digits before `FormData` submission for household-head, enrollment member, renewals-tab member, and renewal-detail member saves.
- Mobile pre-submit validation mirrors the backend citizenship issue-date rule: citizenship issue dates are normalized through `DateService` and must be at least 16 years after DOB. The check runs for enrollment wizard household-head save/draft, enrollment member save, renewals-tab add-member, and renewal-detail member add/edit; birth-certificate flows are skipped.
- If household-head NID lookup fills an under-16 DOB, the wizard still requires birth-certificate details/document while keeping the NID photo behavior.
- Mobile consumes backend-mapped NID display fields directly: `province`, `district`, `municipality`, `ward_number`, `tole_village`, `citizenship_issue_district`, and JPEG `photo_url`.
- Household-head NID tests cover Bagamati/Makawanpur/Hetauda mapped address selection, locked citizenship issue/date fields, grouped verified label/value metadata, saved NID payload restoration, and JPEG photo preview.
- Member NID tests cover `citizenship_issue_district` and JPEG `photo_url` preview.
- Family-member forms render relationship before member name/photo fields. When `father`, `mother`, or `grandfather` is selected, blank or previously auto-filled member English/Nepali name fields are filled from the household-head parent/grandparent split names; manually edited and NID-locked name fields are preserved.

Save behavior:
- `saveHouseholdHead(id, formData)` calls `POST /api/enrollments/{id}/household-head`.
- Old `saveStep1`, `saveStep2`, and generic `nidLookup` methods remain for compatibility.
- Step 1 save sends permanent address, temporary address, selected household `first_service_point_id`, household-head fields, optional split parent/grandparent name fields, qualification ID, target-group fields, and files. For household heads 16+, it also sends profession ID when selected. Legacy combined parent/grandparent name fields are composed from the split fields before submit for compatibility when values are provided. The backend resolves the selected household service-point ID to the service-point name snapshot.
- The wizard consumes optional `/api/enrollment-config.upload_limits` and falls back to `2 MB` per file / `20 MB` total. Before household-head save it clears inactive uploads, skips files not applicable to the current NID/document/target-group/temporary-address mode, blocks oversized selected/captured files locally, and surfaces backend `413` upload messages when a direct oversized request still reaches the API.
- Mobile upload preparation uses `src/app/utils/upload-file.util.ts` for enrollment, renewal, renewal-detail, profile image, and death/removal evidence paths. Camera/file images are compressed to WebP client-side before per-file size checks when browser canvas/WebP support is available; PDFs are renamed only and not converted. FormData filenames use `keyword[_side]_YYYYMMDD_HHmmss.ext`, with household target-group evidence using the sanitized selected target-group type as the keyword.
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
- My Policy no longer exposes card export controls. It keeps policy details, household head details, covered members, renewal, and history only.
- `PolicyService.getMyPolicy()` centralizes the `GET /my-policy` call and normalizes missing `policy`/`history` payload fields. My Policy, HIB Profile, and HIB Profile Member consume this service instead of repeating the raw API call and response shaping.
- HIB Profile is the mobile card export surface:
  - `/tabs/hib-profile` loads `/my-policy`, then calls `EnrollmentService.getCards(enrollment_id)` only when the policy is `active`.
  - The page shows the household head card first, then family member card rows. Dashboard and Profile expose beneficiary-only HIB Profile shortcuts; the bottom tab bar is unchanged.
  - `Export All Cards PDF` uses `getAllCardsPdfUrl(enrollment_id)` for a fresh signed URL.
  - Tapping a holder opens `/hib-profile/member/:type/:id`, reloads the active enrollment cards, shows that holder's card/profile details, and exports via `getHeadCardPdfUrl(enrollment_id)` or `getMemberCardPdfUrl(enrollmentId, memberId)`.
- Card holder `insurance_number` and `member_number` values returned by the backend are display-formatted for the card/profile surface, for example `2026-000-001` / `2026-000-001-01` in English mode and Nepali-digit equivalents in Nepali mode. Canonical enrollment records still use digit-only API fields such as `2026000001`.
- Card PDFs open with Capacitor Browser using fresh signed URLs from the backend.

Temporary address:
- `temporarySameAsPermanent` defaults to `false`; users must explicitly toggle same-as-permanent.
- `temporarySameAsPermanent` copies permanent address into temporary address locally.
- If unchecked, temporary location dropdowns are shown.
- Migration-based permanent address review shows `Basai Sarai (permanent address is changed)` and Basai Sarai front/back evidence in the mobile review step; backend officer review uses the same migration address source and documents.

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
- Enrollment member add/edit uses the shared member form's optional `First Service Point` select populated from the enrollment's permanent province/district service-point options. Selected member values are submitted as `first_service_point_id`, blank values are submitted as an empty `first_service_point_id` so the backend can clear a saved member-level service point, and editing an existing member preselects the saved member-level service point.
- Enrollment and renewal member add/edit forms include an optional `Occupation` dropdown sourced from `/api/enrollment-config.profession_options` for citizenship-mode members; it is hidden and cleared for birth-certificate members. The selected label is submitted as the existing `occupation` field because family members do not have a separate `profession_id` column.
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
- Member removal in enrollment and renewal detail uses the backend-mirrored `requiresRemovalDocument()` helper. Members from covered enrollments (`approved`, `active`, `expired`, `pending_payment`, or enrollment `approved_at`) require a selected death/removal supporting file even when the member row still has stale `pending_verification`/`verified` status. Draft, pending, district-verified, rejected, or current-renewal newly added members can be removed without selecting a file. `EnrollmentService.removeMember()` sends multipart `FormData` with `_method=DELETE` and includes `death_document` only when a file is required/provided.
- Existing stale keys are skipped in FormData where relevant.
- The shared `src\app\components\member-form\member-form.component.ts` is used by enrollment member entry and renewal detail member entry.
- Enrollment member add/update uses mutation response data to update the current in-memory member list when enough state is returned; full enrollment refetches are still used where server-calculated review/subsidy state is needed.
- Backend enrollment numbers now account for soft-deleted drafts, so mobile users can delete a draft enrollment and immediately create a new one without the API reusing the deleted draft's unique enrollment number.
