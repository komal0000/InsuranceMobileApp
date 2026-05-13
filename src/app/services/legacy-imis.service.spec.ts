import { of } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { LegacyImisFamilyMembersResponse, LegacyImisKycUpdateResponse } from '../interfaces/legacy-imis.interface';
import { LegacyImisService } from './legacy-imis.service';

describe('LegacyImisService', () => {
  let api: jasmine.SpyObj<{
    get: (...args: unknown[]) => unknown;
    post: (...args: unknown[]) => unknown;
  }>;
  let service: LegacyImisService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post']);
    service = new LegacyImisService(api as any);
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
      phone: '+9779800000000',
      national_id: '१२३-४५६-७८९-०',
    }).subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(api.post).toHaveBeenCalledOnceWith('/legacy-imis/kyc-update', {
      chfid: '019857364',
      firstname: 'Sita',
      lastname: 'Sharma',
      phone: '+9779800000000',
      national_id: '123-456-789-0',
    });
  });
});
