import { ApiResponse } from './api-response.interface';

export interface Enrollment {
  id: number;
  consent_acceptance_id?: number | null;
  enrollment_number: string;
  household_head_id: number;
  enrolled_by: number;
  enrollment_type: 'new' | 'renewal' | 're_enrollment';
  initiated_by: 'insuree' | 'enrollment_assistant';
  status: EnrollmentStatus;
  province: string;
  district: string;
  municipality: string;
  ward_number: number;
  location_id?: number | null;
  tole_village: string;
  full_address: string;
  permanent_address_source?: PermanentAddressSource | null;
  temporary_same_as_permanent?: boolean;
  temporary_province?: string | null;
  temporary_district?: string | null;
  temporary_municipality?: string | null;
  temporary_ward_number?: string | null;
  temporary_tole_village?: string | null;
  temporary_full_address?: string | null;
  first_service_point_id?: number | null;
  first_service_point?: string | null;
  total_members: number;
  premium_amount: number;
  subsidy_amount: number;
  final_premium: number;
  policy_start_date: string;
  policy_start_date_bs?: string;
  policy_end_date: string;
  policy_end_date_bs?: string;
  current_step: 1 | 2 | 3 | 4 | 5;
  step_data: any;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  payment_date_bs?: string;
  submitted_at?: string | null;
  submitted_at_bs?: string | null;
  submitted_at_ad?: string | null;
  display_enrollment_date?: string | null;
  display_enrollment_date_bs?: string | null;
  display_enrollment_date_ad?: string | null;
  imis_sync_status?: ImisEnrollmentSyncStatus | null;
  imis_synced_at?: string | null;
  imis_last_sync_at?: string | null;
  imis_last_http_status?: number | null;
  imis_last_error?: string | null;
  rejection_reason?: string;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  household_head?: HouseholdHead;
  family_members?: FamilyMember[];
  members?: FamilyMember[];
  documents?: EnrollmentDocument[];
  pdf_path?: string | null;
  pdf_generated_at?: string | null;
  pdf_download_url?: string | null;
  card_download_url?: string | null;
}

export type PermanentAddressSource = 'nid' | 'citizenship' | 'migration';

export type ImisEnrollmentSyncStatus =
  | 'not_synced'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'dry_run';

export type EnrollmentStatus =
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'approved'
  | 'pending_payment'
  | 'active'
  | 'rejected'
  | 'expired';

export interface HouseholdHead {
  id: number;
  enrollment_id: number;
  member_number?: string;
  national_id?: string | null;
  nid_verified_at?: string | null;
  nid_mapping_status?: string | null;
  nid_raw_payload?: Record<string, any> | null;
  first_name: string;
  middle_name?: string;
  last_name: string;
  first_name_ne?: string;
  middle_name_ne?: string;
  last_name_ne?: string;
  father_first_name?: string | null;
  father_last_name?: string | null;
  father_first_name_ne?: string | null;
  father_last_name_ne?: string | null;
  father_name?: string | null;
  father_name_ne?: string | null;
  mother_first_name?: string | null;
  mother_last_name?: string | null;
  mother_first_name_ne?: string | null;
  mother_last_name_ne?: string | null;
  mother_name?: string | null;
  mother_name_ne?: string | null;
  grandfather_first_name?: string | null;
  grandfather_last_name?: string | null;
  grandfather_first_name_ne?: string | null;
  grandfather_last_name_ne?: string | null;
  grandfather_name?: string | null;
  grandfather_name_ne?: string | null;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  date_of_birth_bs?: string;
  blood_group?: string;
  marital_status?: string;
  relationship?: string;
  mobile_number?: string;
  email?: string;
  document_type?: 'citizenship' | 'birth_certificate';
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_date_bs?: string;
  citizenship_issue_district?: string;
  birth_certificate_number?: string;
  birth_certificate_issue_date?: string;
  birth_certificate_issue_date_bs?: string;
  birth_certificate_front_image?: string;
  is_target_group: boolean;
  target_group_type?: string;
  target_group_id_number?: string;
  occupation?: string;
  education_level?: string;
  profession_id?: number | null;
  qualification_id?: number | null;
  photo?: string;
  citizenship_front_image?: string;
  citizenship_back_image?: string;
  target_group_front_image?: string;
  target_group_back_image?: string;
  documents?: MemberDocument[];
  member_status?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: number;
  enrollment_id: number;
  household_head_id?: number;
  member_number?: string;
  national_id?: string | null;
  nid_verified_at?: string | null;
  nid_mapping_status?: string | null;
  nid_raw_payload?: Record<string, any> | null;
  first_name: string;
  middle_name?: string;
  last_name: string;
  first_name_ne?: string;
  middle_name_ne?: string;
  last_name_ne?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  date_of_birth_bs?: string;
  blood_group?: string;
  marital_status?: string;
  relationship: string;
  relationship_type?: string;
  mobile_number?: string;
  email?: string;
  first_service_point_id?: number | null;
  first_service_point?: string | null;
  document_type?: 'citizenship' | 'birth_certificate';
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_date_bs?: string;
  citizenship_issue_district?: string;
  birth_certificate_number?: string;
  birth_certificate_issue_date?: string;
  birth_certificate_issue_date_bs?: string;
  birth_certificate_front_image?: string;
  birth_certificate_back_image?: string;
  is_target_group: boolean;
  target_group_type?: string;
  target_group_id_number?: string;
  occupation?: string;
  education_level?: string;
  photo?: string;
  citizenship_front_image?: string;
  citizenship_back_image?: string;
  target_group_front_image?: string;
  target_group_back_image?: string;
  documents?: MemberDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface MemberDocument {
  id: number;
  documentable_type: string;
  documentable_id: number;
  document_type: string;
  file_path: string;
  original_name?: string;
  file_size?: number;
  mime_type?: string;
  url: string;
  created_at?: string;
}

export interface EnrollmentDocument {
  id: number;
  enrollment_id: number;
  document_type: string;
  file_path: string;
  file_name?: string;
  url?: string;
  file_url?: string;
  created_at?: string;
}

export interface EnrollmentConfig {
  max_family_members: number;
  base_premium_amount: number;
  base_premium_member_count: number;
  additional_member_premium: number;
  terms?: Record<TermsFlow, TermsConfigItem>;
  upload_limits?: {
    max_file_bytes: number;
    max_post_bytes: number;
    max_file_label?: string;
    max_post_label?: string;
  };
  relationship_types: string[] | Record<string, string>;
  relationship_gender_map?: Record<string, 'male' | 'female'>;
  relationship_blocked_by_head_marital_status?: Record<string, string[]>;
  target_group_types: string[];
  profession_options?: Record<number, string>;
  qualification_options?: Record<number, string>;
  enrollment_steps: EnrollmentStep[];
  total_steps: number;
}

export type TermsFlow = 'enrollment' | 'kyc' | 'renewal';

export interface TermsConfigItem {
  flow: TermsFlow;
  label: string;
  label_en?: string;
  label_ne?: string;
  text: string;
  text_en?: string;
  text_ne?: string;
  version: number;
}

export interface EnrollmentStep {
  step: number;
  title: string;
  description: string;
  api_endpoint?: string;
  api_endpoints?: { add: string; remove: string };
  fields?: string[];
}

export interface NidLookupData {
  national_id: string;
  nin?: string | null;
  first_name: string | null;
  last_name: string | null;
  first_name_ne?: string | null;
  last_name_ne?: string | null;
  name_ne: string | null;
  gender: string | null;
  date_of_birth: string | null;
  date_of_birth_bs?: string | null;
  dob_loc?: string | null;
  father_first_name?: string | null;
  father_last_name?: string | null;
  father_first_name_ne?: string | null;
  father_last_name_ne?: string | null;
  father_name?: string | null;
  father_name_ne?: string | null;
  mother_first_name?: string | null;
  mother_last_name?: string | null;
  mother_first_name_ne?: string | null;
  mother_last_name_ne?: string | null;
  mother_name?: string | null;
  mother_name_ne?: string | null;
  grandfather_first_name?: string | null;
  grandfather_last_name?: string | null;
  grandfather_first_name_ne?: string | null;
  grandfather_last_name_ne?: string | null;
  grandfather_name?: string | null;
  grandfather_name_ne?: string | null;
  mobile_number: string | null;
  email: string | null;
  occupation?: string | null;
  address?: string | null;
  province: string | null;
  district: string | null;
  municipality?: string | null;
  ward_number?: string | null;
  tole_village?: string | null;
  tole_village_ne?: string | null;
  mapping_status?: 'mapped' | 'partial' | 'local' | string | null;
  citizenship_number?: string | null;
  cc_number?: string | null;
  cc_number_loc?: string | null;
  citizenship_issue_date?: string | null;
  citizenship_issue_date_bs?: string | null;
  citizenship_issue_district?: string | null;
  cc_issuing_date?: string | null;
  cc_issuing_date_loc?: string | null;
  cc_issuing_district?: string | null;
  cc_issuing_district_loc?: string | null;
  nin_loc?: string | null;
  perm_state?: string | null;
  perm_district?: string | null;
  perm_rur_mun?: string | null;
  perm_ward?: string | null;
  perm_village_tol?: string | null;
  portrait_image?: string | null;
  photo_url?: string | null;
}

export interface NidLocationOption {
  id: string;
  label: string;
}

export interface NidLookupPayload {
  national_id: string;
  full_name: string;
  nid_province_id: string;
  nid_district_id: string;
  nid_municipality_id: string;
  nid_ward_number: string;
  birthdate: string;
}

export interface EnrollmentSubmitResponse extends ApiResponse<Enrollment> {
  pdf_generated?: boolean;
  pdf_download_url?: string | null;
}

export interface EnrollmentCardHolder {
  type: 'head' | 'member';
  id: number;
  label: string;
  name: string;
  name_ne?: string | null;
  date_of_birth?: string | null;
  date_of_birth_bs?: string | null;
  gender?: string | null;
  member_number: string;
  hib_number?: string | null;
  insurance_number: string;
  household_head_hib_number?: string | null;
  enrollment_number?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  ward_number?: string | number | null;
  tole_village?: string | null;
  service_point?: string | null;
  issue_date?: string | null;
  issue_date_bs?: string | null;
  contact_number?: string | null;
  verification_url?: string | null;
  pdf_url: string;
}

export interface EnrollmentCardsResponse extends ApiResponse<{
  cards: EnrollmentCardHolder[];
  all_cards_pdf_url: string;
}> {}

export interface NidLookupResponse {
  success: boolean;
  message: string;
  data?: NidLookupData;
}

export interface SubsidyResult {
  member_name: string;
  member_age: number;
  rule_name: string;
  rule_code: string;
  rule_type: string;
  benefit_type: string;
  benefit_value: number;
  benefit_label?: string;
  match_reason: string;
}

export interface SubsidySummary {
  base_premium: number;
  best_discount: number;
  final_premium: number;
  rules_matched: number;
}

export interface EnrollmentShowResponse {
  success: boolean;
  data: Enrollment;
  subsidy_results: SubsidyResult[];
  subsidy_summary: SubsidySummary;
}

export interface Step1Data {
  province: string;
  district: string;
  municipality: string;
  ward_number: string;
  tole_village: string;
  full_address: string;
}

export interface ServicePointOption {
  id: number;
  code: string;
  name: string;
}
