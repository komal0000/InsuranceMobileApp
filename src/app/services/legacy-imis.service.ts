import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  LegacyImisFamilyMembersResponse,
  LegacyImisKycDemoResponse,
  LegacyImisKycDemoUpdatePayload,
  LegacyImisKycEditableFields,
  LegacyImisKycUpdatePayload,
  LegacyImisKycUpdateResponse,
} from '../interfaces/legacy-imis.interface';
import { nidLookupValue } from '../utils/nid-number.util';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LegacyImisService {
  constructor(private api: ApiService) {}

  familyMembers(chfid: string, nationalId?: string | null): Observable<ApiResponse<LegacyImisFamilyMembersResponse>> {
    const params: Record<string, string> = {
      chfid: chfid.trim(),
    };

    if (nationalId) {
      params['national_id'] = nidLookupValue(nationalId);
    }

    return this.api.get<ApiResponse<LegacyImisFamilyMembersResponse>>('/legacy-imis/family-members', params);
  }

  updateKyc(payload: LegacyImisKycUpdatePayload): Observable<ApiResponse<LegacyImisKycUpdateResponse>> {
    return this.api.post<ApiResponse<LegacyImisKycUpdateResponse>>('/legacy-imis/kyc-update', {
      chfid: payload.chfid.trim(),
      ...this.kycEditableFields(payload),
      ...(payload.national_id ? { national_id: nidLookupValue(payload.national_id) } : {}),
      ...this.consentPayload(payload),
    });
  }

  fetchKycDemoMember(
    householdHeadChfid: string,
    memberChfid: string,
    consentAcceptanceId?: number | null,
  ): Observable<ApiResponse<LegacyImisKycDemoResponse>> {
    return this.api.get<ApiResponse<LegacyImisKycDemoResponse>>('/legacy-imis/kyc-demo/member', {
      household_head_chfid: householdHeadChfid.trim(),
      member_chfid: memberChfid.trim(),
      ...this.consentPayload({ consent_acceptance_id: consentAcceptanceId }),
    });
  }

  updateKycDemo(payload: LegacyImisKycDemoUpdatePayload): Observable<ApiResponse<LegacyImisKycDemoResponse>> {
    return this.api.post<ApiResponse<LegacyImisKycDemoResponse>>('/legacy-imis/kyc-demo/update', {
      household_head_chfid: payload.household_head_chfid.trim(),
      member_chfid: payload.member_chfid.trim(),
      ...this.kycEditableFields(payload),
      ...this.consentPayload(payload),
    });
  }

  private consentPayload(payload: { consent_accepted?: boolean; consent_acceptance_id?: number | null }): Record<string, boolean | number> {
    if (payload.consent_acceptance_id) {
      return { consent_acceptance_id: payload.consent_acceptance_id };
    }

    return { consent_accepted: payload.consent_accepted ?? true };
  }

  private kycEditableFields(payload: LegacyImisKycEditableFields): LegacyImisKycEditableFields {
    return {
      firstname: payload.firstname,
      lastname: payload.lastname,
      date_of_birth: payload.date_of_birth,
      gender: payload.gender,
      phone: payload.phone,
      email: payload.email,
      current_address: payload.current_address,
      geolocation: payload.geolocation,
      relationship_code: payload.relationship_code,
      profession_id: payload.profession_id,
      education_id: payload.education_id,
      health_facility_id: payload.health_facility_id,
    };
  }
}
