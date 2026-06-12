export interface DashboardData {
  my_enrollments?: number;
  active_policies?: number;
  my_renewals?: number;
  my_subsidies?: number;
  total_families?: number;
  pending_verifications?: number;
  renewals_due?: number;
  enrollments_today?: number;
  total_enrollments?: number;
  completed_renewals?: number;
  can_perform_kyc?: boolean;
  profile?: BeneficiaryDashboardProfile | null;
}

export interface BeneficiaryDashboardProfile {
  enrollment: BeneficiaryDashboardProfileEnrollment | null;
  household_head: BeneficiaryDashboardProfilePerson | null;
  members: BeneficiaryDashboardProfileMember[];
}

export interface BeneficiaryDashboardProfileEnrollment {
  id: number;
  enrollment_number?: string | null;
  status?: string | null;
  total_members?: number | null;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  ward_number?: string | number | null;
  tole_village?: string | null;
  full_address?: string | null;
  policy_start_date?: string | null;
  policy_start_date_bs?: string | null;
  policy_end_date?: string | null;
  policy_end_date_bs?: string | null;
  first_service_point?: string | null;
}

export interface BeneficiaryDashboardProfilePerson {
  id: number;
  name?: string | null;
  name_ne?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  date_of_birth_bs?: string | null;
  blood_group?: string | null;
  relationship?: string | null;
  hib_number?: string | null;
  member_number?: string | null;
  photo_url?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  citizenship_number?: string | null;
  birth_certificate_number?: string | null;
  document_type?: string | null;
  is_target_group?: boolean;
  target_group_type?: string | null;
}

export interface BeneficiaryDashboardProfileMember extends BeneficiaryDashboardProfilePerson {
  relationship?: string | null;
}

export interface InsuranceCheckSummary {
  enrollment_number: string;
  status: string;
  policy_start_date: string | null;
  policy_end_date: string | null;
}

export interface InsuranceCheckResult {
  national_id: string;
  has_active_insurance: boolean;
  can_enroll: boolean;
  message: string;
  summary: InsuranceCheckSummary | null;
}
