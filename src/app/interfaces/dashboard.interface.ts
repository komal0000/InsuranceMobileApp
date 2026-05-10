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
