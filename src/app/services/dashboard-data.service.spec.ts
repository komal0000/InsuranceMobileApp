import { of } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { DashboardData } from '../interfaces/dashboard.interface';
import { DashboardDataService } from './dashboard-data.service';

describe('DashboardDataService', () => {
  let api: jasmine.SpyObj<{
    get: (...args: unknown[]) => unknown;
    post: (...args: unknown[]) => unknown;
  }>;
  let authService: jasmine.SpyObj<{ getCurrentUser: () => { id: number } | null }>;
  let service: DashboardDataService;

  const response: ApiResponse<DashboardData> = {
    success: true,
    message: 'Loaded.',
    data: { active_policies: 1 },
  };

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post']);
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authService.getCurrentUser.and.returnValue({ id: 42 });
    api.get.and.returnValue(of(response));
    service = new DashboardDataService(api as any, authService as any);
  });

  it('uses the in-session dashboard cache for repeated normal reads', () => {
    service.getDashboard().subscribe(result => expect(result).toEqual(response));
    service.getDashboard().subscribe(result => expect(result).toEqual(response));

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/dashboard', undefined);
  });

  it('passes refresh flag when force refreshing dashboard data', () => {
    service.getDashboard(true).subscribe(result => expect(result).toEqual(response));

    expect(api.get).toHaveBeenCalledOnceWith('/dashboard', { refresh: 1 });
  });

  it('posts a normalized NID to the insurance checker endpoint', () => {
    const checkerResponse: ApiResponse<any> = {
      success: true,
      message: 'Checked.',
      data: {
        national_id: '1234567890',
        has_active_insurance: false,
        can_enroll: true,
        message: 'Available.',
        summary: null,
      },
    };
    api.post.and.returnValue(of(checkerResponse));

    service.checkInsurance('१२३-४५६-७८९-०').subscribe(result => {
      expect(result).toEqual(checkerResponse);
    });

    expect(api.post).toHaveBeenCalledOnceWith('/insurance-check', {
      national_id: '123-456-789-0',
    });
  });
});
