export interface Renewal {
  id: number;
  renewal_number?: string;
  enrollment_id: number;
  enrollment_number?: string;
  status: string;
  total_members?: number;
  premium_amount?: number;
  discount_amount?: number;
  penalty_amount?: number;
  final_amount?: number;
  renewal_start_date?: string;
  renewal_start_date_bs?: string;
  renewal_end_date?: string;
  renewal_end_date_bs?: string;
  previous_policy_start?: string;
  previous_policy_end?: string;
  is_within_grace_period?: boolean;
  members?: any[];
  imis_data?: any;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  enrollment?: any;
}

export interface RenewalSearchRequest {
  search_type: 'enrollment_number' | 'mobile_number' | 'hib_number' | 'national_id';
  search_value: string;
}
