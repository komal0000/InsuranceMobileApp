export interface User {
  id: number;
  name: string;
  name_ne?: string;
  email?: string;
  mobile_number: string;
  mobile_verified_at?: string | null;
  national_id?: string;
  date_of_birth?: string;
  date_of_birth_bs?: string;
  province?: string;
  district?: string;
  profile_image?: string;
  hib_number?: string;
  registration_status?: RegistrationStatus;
  preferred_language?: 'en' | 'ne';
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
  identifier_type: 'mobile' | 'hib_number';
  identifier: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  name_ne: string;
  mobile_number: string;
  email?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export type RegistrationStatus = 'pending_otp' | 'pending_password' | 'active';

export interface PendingRegistrationData {
  registration_status: RegistrationStatus;
  mobile_number: string;
  email?: string | null;
  expires_at?: string;
}

export interface SendOtpRequest {
  mobile_number: string;
}

export interface VerifyOtpRequest {
  mobile_number: string;
  otp: string;
}

export interface SetPasswordRequest {
  mobile_number: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface LoginSetupOtpSendRequest {
  identifier_type: 'mobile' | 'hib_number';
  identifier: string;
}

export interface LoginSetupOtpVerifyRequest extends LoginSetupOtpSendRequest {
  otp: string;
}

export interface LoginSetupPasswordCreateRequest extends LoginSetupOtpSendRequest {
  otp: string;
  password: string;
  password_confirmation: string;
  remember?: boolean;
}

export interface PasswordOtpSendRequest extends SendOtpRequest {}

export interface PasswordOtpVerifyRequest extends VerifyOtpRequest {}

export interface PasswordOtpResetRequest extends SetPasswordRequest {}

export interface PasswordEmailResetRequest {
  mobile_number: string;
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
  date_of_birth_bs?: string;
  province?: string;
  district?: string;
  preferred_language?: 'en' | 'ne';
}
