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
  household_head_chfid: string;
  member_chfid: string;
  household: LegacyImisKycDemoHousehold | null;
  selected_member: LegacyImisMember | null;
  members: LegacyImisMember[];
}

export interface LegacyImisKycUpdatePayload {
  chfid: string;
  national_id?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  phone?: string | null;
}

export interface LegacyImisKycUpdateResponse {
  chfid: string;
  legacy_response: Record<string, unknown>;
}

export interface LegacyImisKycDemoUpdatePayload {
  household_head_chfid: string;
  member_chfid: string;
  firstname?: string | null;
  lastname?: string | null;
  phone?: string | null;
}
