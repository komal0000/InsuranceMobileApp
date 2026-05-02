import { of } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { EnrollmentConfig } from '../interfaces/enrollment.interface';
import { EnrollmentService } from './enrollment.service';

describe('EnrollmentService', () => {
  let api: jasmine.SpyObj<{ get: (...args: unknown[]) => unknown }>;
  let service: EnrollmentService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get']);
    service = new EnrollmentService(api as any, {} as any);
  });

  it('shares enrollment config requests during one app session', () => {
    const response: ApiResponse<EnrollmentConfig> = {
      success: true,
      message: 'Loaded.',
      data: {
        max_family_members: 10,
        base_premium_amount: 3500,
        base_premium_member_count: 5,
        additional_member_premium: 700,
        enrollment_steps: [],
      } as unknown as EnrollmentConfig,
    };
    api.get.and.returnValue(of(response));

    service.getConfig().subscribe(result => expect(result).toEqual(response));
    service.getConfig().subscribe(result => expect(result).toEqual(response));

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/enrollment-config');
  });

  it('can clear the in-session enrollment config cache', () => {
    api.get.and.returnValue(of({
      success: true,
      message: 'Loaded.',
      data: {} as EnrollmentConfig,
    }));

    service.getConfig().subscribe();
    service.clearConfigCache();
    service.getConfig().subscribe();

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
