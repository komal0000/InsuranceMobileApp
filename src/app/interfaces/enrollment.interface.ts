export interface Enrollment {
  id: number;
  enrollment_number?: string;
  enrollment_type: string;
  status: EnrollmentStatus;
  province?: string;
  district?: string;
  municipality?: string;
  ward_number?: string;
  tole_village?: string;
  full_address?: string;
  household_head?: FamilyMember;
  members?: FamilyMember[];
  documents?: EnrollmentDocument[];
  subsidy_result?: any;
  premium_amount?: number;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  verified_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  user_id?: number;
  user?: any;
}

export type EnrollmentStatus =
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'expired';

export interface FamilyMember {
  id: number;
  enrollment_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  relationship_type: string;
  mobile_number?: string;
  email?: string;
  citizenship_number?: string;
  photo?: string;
  citizenship_front_image?: string;
  citizenship_back_image?: string;
  is_household_head: boolean;
  target_group_type?: string;
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
  relationship_types: string[];
  target_group_types: string[];
  max_family_members: number;
  base_premium_amount: number;
}

export interface Step1Data {
  province: string;
  district: string;
  municipality: string;
  ward_number: string;
  tole_village?: string;
  full_address?: string;
}
