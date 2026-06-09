export interface LegacyImisMember {
  legacy_id: number | null;
  uuid: string | null;
  chfid: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  current_address: string | null;
  geolocation: string | null;
  family_id: number | null;
  is_household_head: boolean;
  relationship_code: number | null;
  profession_id: number | null;
  education_id: number | null;
  health_facility_id: number | null;
  citizenship?: string | null;
  national_id?: string | null;
  f_first_name_loc?: string | null;
  f_last_name_loc?: string | null;
  m_first_name_loc?: string | null;
  m_last_name_loc?: string | null;
  gf_first_name_loc?: string | null;
  gf_last_name_loc?: string | null;
  f_first_name_en?: string | null;
  f_last_name_en?: string | null;
  m_first_name_en?: string | null;
  m_last_name_en?: string | null;
  gf_first_name_en?: string | null;
  gf_last_name_en?: string | null;
  birth_certificate?: string | null;
  photo_id: number | null;
  card_issued: boolean;
}

export interface LegacyImisFamilyMembersResponse {
  chfid: string;
  members: LegacyImisMember[];
}

export interface LegacyImisKycDemoHousehold {
  household_head_chfid: string;
  family_id: number | null;
  total_members: number;
  head_member: LegacyImisMember | null;
}

export interface LegacyImisKycDemoResponse {
  consent_acceptance_id?: number | null;
  kyc_request_id?: number | null;
  kyc_request_number?: string | null;
  kyc_submitted?: boolean;
  redirect_to?: string | null;
  household_head_chfid: string;
  member_chfid: string;
  household: LegacyImisKycDemoHousehold | null;
  selected_member: LegacyImisMember | null;
  members: LegacyImisMember[];
}

export interface LegacyImisKycUpdateResponse {
  chfid: string;
  consent_acceptance_id?: number | null;
  legacy_response: Record<string, unknown>;
}

export interface LegacyImisKycEditableFields {
  firstname?: string | null;
  lastname?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  current_address?: string | null;
  geolocation?: string | null;
  relationship_code?: string | number | null;
  profession_id?: string | number | null;
  occupation?: string | number | null;
  education_id?: string | number | null;
  education?: string | number | null;
  health_facility_id?: string | number | null;
  fsp?: string | number | null;
  citizenship?: string | null;
  citizenship_number?: string | null;
  national_id?: string | null;
  f_first_name_loc?: string | null;
  f_last_name_loc?: string | null;
  m_first_name_loc?: string | null;
  m_last_name_loc?: string | null;
  gf_first_name_loc?: string | null;
  gf_last_name_loc?: string | null;
  f_first_name_en?: string | null;
  f_last_name_en?: string | null;
  m_first_name_en?: string | null;
  m_last_name_en?: string | null;
  gf_first_name_en?: string | null;
  gf_last_name_en?: string | null;
  birth_certificate?: string | null;
  photo?: string | null;
}

export interface LegacyImisKycUpdatePayload extends LegacyImisKycEditableFields {
  chfid: string;
  consent_accepted?: boolean;
  consent_acceptance_id?: number | null;
}

export interface LegacyImisKycDemoUpdatePayload extends LegacyImisKycEditableFields {
  household_head_chfid?: string | null;
  member_chfid: string;
  consent_accepted?: boolean;
  consent_acceptance_id?: number | null;
}
