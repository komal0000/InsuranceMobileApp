export interface Enrollment {
  id: number;
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
  tole_village: string;
  full_address: string;
  total_members: number;
  premium_amount: number;
  subsidy_amount: number;
  final_premium: number;
  policy_start_date: string;
  policy_end_date: string;
  current_step: 1 | 2 | 3 | 4;
  step_data: any;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  household_head?: HouseholdHead;
  family_members?: FamilyMember[];
  members?: FamilyMember[];
  documents?: EnrollmentDocument[];
}

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
  first_name: string;
  middle_name?: string;
  last_name: string;
  first_name_ne?: string;
  middle_name_ne?: string;
  last_name_ne?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  blood_group?: string;
  marital_status?: string;
  relationship?: string;
  mobile_number?: string;
  email?: string;
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_district?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: number;
  enrollment_id: number;
  household_head_id?: number;
  member_number?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  first_name_ne?: string;
  middle_name_ne?: string;
  last_name_ne?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  blood_group?: string;
  marital_status?: string;
  relationship: string;
  relationship_type?: string;
  mobile_number?: string;
  email?: string;
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_district?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface EnrollmentDocument {
  id: number;
  enrollment_id: number;
  document_type: string;
  file_path: string;
  file_name?: string;
  created_at?: string;
}

export interface EnrollmentConfig {
  max_family_members: number;
  base_premium_amount: number;
  base_premium_member_count: number;
  additional_member_premium: number;
  relationship_types: string[];
  target_group_types: string[];
  enrollment_steps: EnrollmentStep[];
  total_steps: number;
}

export interface EnrollmentStep {
  step: number;
  title: string;
  description: string;
  api_endpoint?: string;
  api_endpoints?: { add: string; remove: string };
  fields?: string[];
}

export interface NidLookupResponse {
  success: boolean;
  message: string;
  data?: {
    first_name: string | null;
    last_name: string | null;
    name_ne: string | null;
    gender: string | null;
    date_of_birth: string | null;
    mobile_number: string | null;
    email: string | null;
    national_id: string;
    province: string | null;
    district: string | null;
  };
}

export interface Step1Data {
  province: string;
  district: string;
  municipality: string;
  ward_number: string;
  tole_village: string;
  full_address: string;
}
