export interface BeneficiaryDashboard {
  my_enrollments: number;
  active_policies: number;
  my_renewals: number;
  my_subsidies: number;
}

export interface AdminDashboard {
  total_families: number;
  pending_verifications: number;
  renewals_due: number;
  enrollments_today: number;
}

export type DashboardData = BeneficiaryDashboard | AdminDashboard;
