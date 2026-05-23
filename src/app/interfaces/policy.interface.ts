export interface HibPolicyPerson {
  name?: string | null;
  name_ne?: string | null;
  first_name?: string | null;
  full_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  date_of_birth_bs?: string | null;
  document_type?: string | null;
  birth_certificate_number?: string | null;
  citizenship_number?: string | null;
  mobile_number?: string | null;
  relationship?: string | null;
  is_target_group?: boolean | null;
  target_group_type?: string | null;
}

export interface HibPolicyRenewal {
  renewal_number?: string | null;
  status?: string | null;
  renewal_start?: string | null;
  renewal_start_bs?: string | null;
  renewal_end?: string | null;
  renewal_end_bs?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
}

export interface HibPolicySummary {
  enrollment_id?: number | string | null;
  enrollment_number?: string | null;
  policy_number?: string | null;
  status?: string | null;
  total_members?: number | string | null;
  premium_amount?: number | string | null;
  subsidy_amount?: number | string | null;
  start_date?: string | null;
  start_date_bs?: string | null;
  end_date?: string | null;
  end_date_ad?: string | null;
  end_date_bs?: string | null;
  enrollment_date?: string | null;
  enrollment_date_bs?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  ward_number?: number | string | null;
  tole_village?: string | null;
  full_address?: string | null;
  household_head?: HibPolicyPerson | null;
  members?: HibPolicyPerson[];
  renewal?: HibPolicyRenewal | null;
}

export interface MyPolicyPayload {
  policy: HibPolicySummary | null;
  history: any[];
}
