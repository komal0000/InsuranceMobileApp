export interface Renewal {
  id: number;
  enrollment_id: number;
  enrollment_number?: string;
  status: string;
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
