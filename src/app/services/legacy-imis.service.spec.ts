import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  LegacyImisFamilyMembersResponse,
  LegacyImisKycDemoResponse,
  LegacyImisKycUpdateResponse,
} from '../interfaces/legacy-imis.interface';
import { LegacyImisService } from './legacy-imis.service';
import { ApiService } from './api.service';

describe('LegacyImisService', () => {
  let api: jasmine.SpyObj<{
    get: (...args: unknown[]) => unknown;
    post: (...args: unknown[]) => unknown;
  }>;
  let service: LegacyImisService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    api = jasmine.createSpyObj('ApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(LegacyImisService);
  });

  it('fetches legacy family members through the backend by CHFID', () => {
    const response: ApiResponse<LegacyImisFamilyMembersResponse> = {
      success: true,
      message: 'Loaded.',
      data: {
        chfid: '019857364',
        members: [],
      },
    };
    api.get.and.returnValue(of(response));

    service.familyMembers('019857364', '१२३-४५६-७८९-०').subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(api.get).toHaveBeenCalledOnceWith('/legacy-imis/family-members', {
      chfid: '019857364',
      national_id: '123-456-789-0',
    });
  });

  it('submits allowlisted KYC update payload through the backend', () => {
    const response: ApiResponse<LegacyImisKycUpdateResponse> = {
      success: true,
      message: 'Updated',
      data: {
        chfid: '019857364',
        legacy_response: { message: 'Updated' },
      },
    };
    api.post.and.returnValue(of(response));

    service.updateKyc({
      chfid: '019857364',
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1980-01-15',
      gender: 'F',
      phone: '+9779800000000',
      email: 'sita.updated@example.test',
      current_address: 'Chitwan Ward 8',
      geolocation: '27.5291,84.3542',
      relationship_code: 0,
      profession_id: 6,
      occupation: 2,
      education_id: 7,
      education: 3,
      health_facility_id: 25,
      fsp: 3,
      citizenship: '1001',
      f_first_name_en: 'Hari',
      f_last_name_en: 'Sharma',
      m_first_name_en: 'Maya',
      m_last_name_en: 'Sharma',
      gf_first_name_en: 'Ram',
      gf_last_name_en: 'Sharma',
      f_first_name_loc: 'हरी',
      f_last_name_loc: 'शर्मा',
      m_first_name_loc: 'माया',
      m_last_name_loc: 'शर्मा',
      gf_first_name_loc: 'राम',
      gf_last_name_loc: 'शर्मा',
      birth_certificate: 'BC-123',
      photo: 'data:image/jpeg;base64,aW1hZ2U=',
      national_id: '१२३-४५६-७८९-०',
    } as any).subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(api.post).toHaveBeenCalledOnceWith('/legacy-imis/kyc-update', {
      chfid: '019857364',
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1980-01-15',
      gender: 'F',
      phone: '+9779800000000',
      email: 'sita.updated@example.test',
      current_address: 'Chitwan Ward 8',
      geolocation: '27.5291,84.3542',
      relationship_code: 0,
      profession_id: 6,
      occupation: 2,
      education_id: 7,
      education: 3,
      health_facility_id: 25,
      fsp: 3,
      citizenship: '1001',
      f_first_name_en: 'Hari',
      f_last_name_en: 'Sharma',
      m_first_name_en: 'Maya',
      m_last_name_en: 'Sharma',
      gf_first_name_en: 'Ram',
      gf_last_name_en: 'Sharma',
      f_first_name_loc: 'हरी',
      f_last_name_loc: 'शर्मा',
      m_first_name_loc: 'माया',
      m_last_name_loc: 'शर्मा',
      gf_first_name_loc: 'राम',
      gf_last_name_loc: 'शर्मा',
      birth_certificate: 'BC-123',
      photo: 'data:image/jpeg;base64,aW1hZ2U=',
      national_id: '123-456-789-0',
      consent_accepted: true,
    });
  });

  it('fetches a KYC demo member through the backend by member CHFID only', () => {
    const response: ApiResponse<LegacyImisKycDemoResponse> = {
      success: true,
      message: 'Loaded.',
      data: {
        household_head_chfid: 'HH001',
        member_chfid: 'M002',
        household: {
          household_head_chfid: 'HH001',
          family_id: 77,
          total_members: 2,
          head_member: null,
        },
        selected_member: null,
        members: [],
      },
    };
    api.get.and.returnValue(of(response));

    service.fetchKycDemoMember(' M002 ').subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(api.get).toHaveBeenCalledOnceWith('/legacy-imis/kyc-demo/member', {
      member_chfid: 'M002',
      consent_accepted: true,
    });
  });

  it('submits a KYC demo update through the backend with only demo fields', () => {
    const response: ApiResponse<LegacyImisKycDemoResponse> = {
      success: true,
      message: 'Updated',
      data: {
        household_head_chfid: 'HH001',
        member_chfid: 'M002',
        household: null,
        selected_member: null,
        members: [],
      },
    };
    api.post.and.returnValue(of(response));

    service.updateKycDemo({
      member_chfid: ' M002 ',
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone: '+9779800000000',
      email: 'sita.updated@example.test',
      current_address: 'Kathmandu Ward 4',
      geolocation: '27.7172,85.3240',
      relationship_code: 2,
      profession_id: 6,
      occupation: 2,
      education_id: 7,
      education: 3,
      health_facility_id: 25,
      fsp: 3,
      citizenship: 'CIT-1001',
      f_first_name_en: 'Hari',
      f_last_name_en: 'Sharma',
      m_first_name_en: 'Maya',
      m_last_name_en: 'Sharma',
      gf_first_name_en: 'Ram',
      gf_last_name_en: 'Sharma',
      f_first_name_loc: 'हरी',
      f_last_name_loc: 'शर्मा',
      m_first_name_loc: 'माया',
      m_last_name_loc: 'शर्मा',
      gf_first_name_loc: 'राम',
      gf_last_name_loc: 'शर्मा',
      birth_certificate: 'BC-123',
      national_id: '1001',
      photo: 'data:image/jpeg;base64,ZGVtbw==',
    } as any).subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(api.post).toHaveBeenCalledOnceWith('/legacy-imis/kyc-demo/update', {
      member_chfid: 'M002',
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone: '+9779800000000',
      email: 'sita.updated@example.test',
      current_address: 'Kathmandu Ward 4',
      geolocation: '27.7172,85.3240',
      relationship_code: 2,
      profession_id: 6,
      occupation: 2,
      education_id: 7,
      education: 3,
      health_facility_id: 25,
      fsp: 3,
      citizenship: 'CIT-1001',
      f_first_name_en: 'Hari',
      f_last_name_en: 'Sharma',
      m_first_name_en: 'Maya',
      m_last_name_en: 'Sharma',
      gf_first_name_en: 'Ram',
      gf_last_name_en: 'Sharma',
      f_first_name_loc: 'हरी',
      f_last_name_loc: 'शर्मा',
      m_first_name_loc: 'माया',
      m_last_name_loc: 'शर्मा',
      gf_first_name_loc: 'राम',
      gf_last_name_loc: 'शर्मा',
      birth_certificate: 'BC-123',
      national_id: '1001',
      photo: 'data:image/jpeg;base64,ZGVtbw==',
      consent_accepted: true,
    });
  });

  it('reuses a KYC demo consent acceptance id when updating', () => {
    const response: ApiResponse<LegacyImisKycDemoResponse> = {
      success: true,
      message: 'Updated',
      data: {
        consent_acceptance_id: 44,
        household_head_chfid: 'HH001',
        member_chfid: 'M002',
        household: null,
        selected_member: null,
        members: [],
      },
    };
    api.post.and.returnValue(of(response));

    service.updateKycDemo({
      member_chfid: 'M002',
      phone: '+9779800000000',
      consent_acceptance_id: 44,
    }).subscribe(result => expect(result).toEqual(response));

    expect(api.post).toHaveBeenCalledOnceWith('/legacy-imis/kyc-demo/update', jasmine.objectContaining({
      member_chfid: 'M002',
      phone: '+9779800000000',
      consent_acceptance_id: 44,
    }));
  });
});
