export interface User {
  id: number;
  name: string;
  name_ne?: string;
  email?: string;
  mobile_number: string;
  national_id?: string;
  date_of_birth?: string;
  province?: string;
  district?: string;
  hib_number?: string;
  role: UserRole;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'province'
  | 'district_eo'
  | 'enrollment_assistant'
  | 'beneficiary';

export interface LoginRequest {
  identifier_type: 'mobile' | 'hib_number' | 'national_id' | 'dob';
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  name_ne?: string;
  mobile_number: string;
  national_id?: string;
  date_of_birth?: string;
  province?: string;
  district?: string;
  email?: string;
  password: string;
  password_confirmation: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  name_ne?: string;
  email?: string;
  mobile_number?: string;
  date_of_birth?: string;
  province?: string;
  district?: string;
}
