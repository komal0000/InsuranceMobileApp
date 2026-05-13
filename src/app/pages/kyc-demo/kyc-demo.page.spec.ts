import { of, throwError } from 'rxjs';
import { KycDemoPage } from './kyc-demo.page';
import { LegacyImisKycDemoResponse } from '../../interfaces/legacy-imis.interface';

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
        email: null,
        current_address: null,
        geolocation: null,
        family_id: 77,
        is_household_head: true,
        relationship_code: 0,
        profession_id: null,
        education_id: null,
        health_facility_id: null,
        photo_id: null,
        card_issued: false,
      },
    },
    selected_member: {
      legacy_id: 102,
      uuid: null,
      chfid: 'M002',
      first_name: 'Sita',
      last_name: 'Sharma',
      date_of_birth: '1992-04-20',
      gender: 'F',
      phone,
      email: null,
      current_address: null,
      geolocation: null,
      family_id: 77,
      is_household_head: false,
      relationship_code: null,
      profession_id: null,
      education_id: null,
      health_facility_id: null,
      photo_id: null,
      card_issued: false,
    },
    members: [],
  });

  const languageService = {
    t: (key: string) => key,
    translateText: (value?: string) => value || '',
  };

  function makePage(serviceOverrides: Partial<Record<'fetchKycDemoMember' | 'updateKycDemo', jasmine.Spy>> = {}) {
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

    return {
      legacyImis,
      page: new KycDemoPage(legacyImis as any, languageService as any),
    };
  }

  it('validates required CHFID fields before fetching', () => {
    const { legacyImis, page } = makePage();

    page.fetchMember();

    expect(legacyImis.fetchKycDemoMember).not.toHaveBeenCalled();
    expect(page.errorMessage).toBe('kyc_demo.required_chfids');
  });

  it('displays fetched household and selected member data and prefills editable fields', () => {
    const { legacyImis, page } = makePage();
    page.householdHeadChfid = 'HH001';
    page.memberChfid = 'M002';

    page.fetchMember();

    expect(legacyImis.fetchKycDemoMember).toHaveBeenCalledWith('HH001', 'M002');
    expect(page.demoData?.household?.total_members).toBe(2);
    expect(page.demoData?.selected_member?.chfid).toBe('M002');
    expect(page.kycForm).toEqual({
      firstname: 'Sita',
      lastname: 'Sharma',
      phone: '9811111111',
    });
    expect(page.errorMessage).toBe('');
  });

  it('updates KYC and refreshes displayed data from the backend response', () => {
    const { legacyImis, page } = makePage();
    page.householdHeadChfid = 'HH001';
    page.memberChfid = 'M002';
    page.demoData = demoResponse();
    page.kycForm = {
      firstname: 'Sita',
      lastname: 'Sharma',
      phone: '+9779800000000',
    };

    page.updateKyc();

    expect(legacyImis.updateKycDemo).toHaveBeenCalledWith({
      household_head_chfid: 'HH001',
      member_chfid: 'M002',
      firstname: 'Sita',
      lastname: 'Sharma',
      phone: '+9779800000000',
    });
    expect(page.demoData?.selected_member?.phone).toBe('+9779800000000');
    expect(page.successMessage).toBe('Updated');
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

    page.fetchMember();

    expect(page.errorMessage).toBe('No member was found for the entered member CHFID.');
    expect(page.demoData).toBeNull();
  });
});
