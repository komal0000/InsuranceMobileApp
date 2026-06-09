import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { KycDemoPage } from './kyc-demo.page';
import { LegacyImisKycDemoResponse } from '../../interfaces/legacy-imis.interface';
import { LanguageService } from '../../services/language.service';
import { LegacyImisService } from '../../services/legacy-imis.service';
import { AuthService } from '../../services/auth.service';

describe('KycDemoPage', () => {
  const demoResponse = (phone = '9811111111'): LegacyImisKycDemoResponse => ({
    household_head_chfid: 'HH001',
    member_chfid: 'M002',
    household: {
      household_head_chfid: 'HH001',
      family_id: 77,
      total_members: 2,
      head_member: {
        legacy_id: 101,
        uuid: null,
        chfid: 'HH001',
        first_name: 'Hari',
        last_name: 'Lama',
        date_of_birth: '1970-01-15',
        gender: 'M',
        phone: '9800000000',
        email: 'hari@example.test',
        current_address: 'Hetauda Ward 1',
        geolocation: '27.4284,85.0322',
        family_id: 77,
        is_household_head: true,
        relationship_code: 0,
        profession_id: 5,
        education_id: 4,
        health_facility_id: 11,
        photo_id: 501,
        card_issued: true,
      },
    },
    selected_member: {
      legacy_id: 102,
      uuid: 'legacy-uuid-selected',
      chfid: 'M002',
      first_name: 'Sita',
      last_name: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone,
      email: 'sita@example.test',
      current_address: 'Kathmandu Ward 4',
      geolocation: '27.7172,85.3240',
      family_id: 77,
      is_household_head: false,
      relationship_code: 2,
      profession_id: 6,
      education_id: 7,
      health_facility_id: 25,
      citizenship: 'CIT-1001',
      national_id: '1234567890',
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
      photo_id: 7636805,
      card_issued: false,
    } as any,
    members: [],
  });

  const languageService = {
    t: (key: string) => key,
    translateText: (value?: string) => value || '',
  };

  function makePage(
    serviceOverrides: Partial<Record<'fetchKycDemoMember' | 'updateKycDemo', jasmine.Spy>> = {},
    authOverrides: Partial<Record<'getCurrentUser' | 'fetchProfile', jasmine.Spy>> = {},
  ) {
    const legacyImis = {
      fetchKycDemoMember: jasmine.createSpy('fetchKycDemoMember').and.returnValue(of({
        success: true,
        message: 'Loaded.',
        data: demoResponse(),
      })),
      updateKycDemo: jasmine.createSpy('updateKycDemo').and.returnValue(of({
        success: true,
        message: 'Updated',
        data: demoResponse('+9779800000000'),
      })),
      ...serviceOverrides,
    };
    const authService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
      fetchProfile: jasmine.createSpy('fetchProfile').and.returnValue(of({
        id: 1,
        name: 'Sita Sharma',
        mobile_number: '9800000000',
        role: 'beneficiary',
        permissions: [],
        kyc_required: true,
        kyc_submitted: true,
      })),
      ...authOverrides,
    };

    return {
      authService,
      legacyImis,
      page: (() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: AuthService, useValue: authService },
            { provide: LegacyImisService, useValue: legacyImis },
            { provide: LanguageService, useValue: languageService },
          ],
        });
        return TestBed.runInInjectionContext(() => new KycDemoPage());
      })(),
    };
  }

  it('prefills imported household identifiers from the current user HIB number', () => {
    const { page } = makePage({}, {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        id: 2,
        name: 'Sita Sharma',
        mobile_number: '9800000000',
        hib_number: 'HH001',
        role: 'beneficiary',
        permissions: [],
        kyc_required: true,
        kyc_submitted: false,
      }),
    });

    expect(page.householdHeadChfid).toBe('HH001');
    expect(page.memberChfid).toBe('HH001');
  });

  it('validates required CHFID fields before fetching', () => {
    const { authService, legacyImis, page } = makePage();

    page.fetchMember();

    expect(legacyImis.fetchKycDemoMember).not.toHaveBeenCalled();
    expect(page.errorMessage).toBe('kyc_demo.required_chfids');
  });

  it('displays fetched household and selected member data and prefills editable fields', () => {
    const { legacyImis, page } = makePage();
    page.householdHeadChfid = 'HH001';
    page.memberChfid = 'M002';
    page.consentAccepted = true;

    page.fetchMember();

    expect(legacyImis.fetchKycDemoMember).toHaveBeenCalledWith('HH001', 'M002', null);
    expect(page.demoData?.household?.total_members).toBe(2);
    expect(page.demoData?.selected_member?.chfid).toBe('M002');
    expect(page.kycForm as any).toEqual({
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone: '9811111111',
      email: 'sita@example.test',
      current_address: 'Kathmandu Ward 4',
      geolocation: '27.7172,85.3240',
      relationship_code: '2',
      profession_id: '6',
      education_id: '7',
      health_facility_id: '25',
      citizenship: 'CIT-1001',
      national_id: '1234567890',
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
      photo: '',
    });
    expect(page.editableMemberFields.map(field => field.key)).toContain('birth_certificate' as any);
    expect(page.editableMemberFields.map(field => field.key)).toContain('f_first_name_en' as any);
    expect(page.lockedMemberFields.map(field => field.key)).toEqual([
      'chfid',
      'legacy_id',
      'uuid',
      'family_id',
      'is_household_head',
      'photo_id',
      'card_issued',
    ]);
    expect(page.errorMessage).toBe('');
  });

  it('updates KYC and refreshes displayed data from the backend response', () => {
    const { authService, legacyImis, page } = makePage();
    page.householdHeadChfid = 'HH001';
    page.memberChfid = 'M002';
    page.consentAccepted = true;
    page.consentAcceptanceId = 44;
    page.demoData = demoResponse();
    page.kycForm = {
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone: '+9779800000000',
      email: 'sita.updated@example.test',
      current_address: 'Kathmandu Ward 4',
      geolocation: '27.7172,85.3240',
      relationship_code: '2',
      profession_id: '6',
      education_id: '7',
      health_facility_id: '25',
      citizenship: 'CIT-1001',
      national_id: '1001',
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
    } as any;

    page.updateKyc();

    expect(legacyImis.updateKycDemo).toHaveBeenCalledWith({
      household_head_chfid: 'HH001',
      member_chfid: 'M002',
      consent_acceptance_id: 44,
      firstname: 'Sita',
      lastname: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone: '+9779800000000',
      email: 'sita.updated@example.test',
      current_address: 'Kathmandu Ward 4',
      geolocation: '27.7172,85.3240',
      relationship_code: '2',
      profession_id: '6',
      education_id: '7',
      health_facility_id: '25',
      citizenship: 'CIT-1001',
      national_id: '1001',
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
    });
    expect(page.demoData?.selected_member?.phone).toBe('+9779800000000');
    expect(page.successMessage).toBe('Updated');
    expect(authService.fetchProfile).toHaveBeenCalled();
  });

  it('applies captured KYC photo to the update form and preview', () => {
    const { page } = makePage();

    page.applyKycPhotoDataUrl('data:image/jpeg;base64,aW1hZ2U=');

    expect(page.kycForm.photo).toBe('data:image/jpeg;base64,aW1hZ2U=');
    expect(page.photoPreview).toBe('data:image/jpeg;base64,aW1hZ2U=');
  });

  it('shows backend member CHFID validation errors clearly', () => {
    const { page } = makePage({
      fetchKycDemoMember: jasmine.createSpy('fetchKycDemoMember').and.returnValue(throwError(() => ({
        error: {
          message: 'The selected member was not found.',
          errors: {
            member_chfid: ['No member was found for the entered member CHFID.'],
          },
        },
      }))),
    });
    page.householdHeadChfid = 'HH001';
    page.memberChfid = 'UNKNOWN';
    page.consentAccepted = true;

    page.fetchMember();

    expect(page.errorMessage).toBe('No member was found for the entered member CHFID.');
    expect(page.demoData).toBeNull();
  });

  it('blocks fetch until consent is accepted', () => {
    const { legacyImis, page } = makePage();
    page.householdHeadChfid = 'HH001';
    page.memberChfid = 'M002';

    page.fetchMember();

    expect(legacyImis.fetchKycDemoMember).not.toHaveBeenCalled();
    expect(page.errorMessage).toBe('consent.required');
  });
});
