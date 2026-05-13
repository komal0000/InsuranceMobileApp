import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  LegacyImisFamilyMembersResponse,
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
      firstname: payload.firstname,
      lastname: payload.lastname,
      phone: payload.phone,
      ...(payload.national_id ? { national_id: nidLookupValue(payload.national_id) } : {}),
    });
  }
}
