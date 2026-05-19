import { of } from 'rxjs';
import { MyPolicyPage } from './my-policy.page';

describe('MyPolicyPage', () => {
  function makePage(policy: any = null, history: any[] = []) {
    const api = jasmine.createSpyObj('ApiService', ['get']);
    api.get.and.returnValue(of({
      success: true,
      data: { policy, history },
    }));

    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value: string) => value,
      formatNumber: (value: string | number) => String(value),
      translateText: (value: string) => value,
    };

    const page = new MyPolicyPage(
      api,
      {
        formatForDisplay: (adDate?: string | null, bsDate?: string | null) => bsDate || adDate || '',
        toApiDate: () => '',
      } as any,
      languageService as any,
    );

    return { page, api };
  }

  it('loads policy details without exposing card export actions', () => {
    const { page } = makePage({
      status: 'active',
      enrollment_id: 12,
      household_head: { id: 1 },
      members: [{ id: 7 }],
    });

    page.load();

    expect(page.policy?.enrollment_id).toBe(12);
    expect((page as any).canExportCards).toBeUndefined();
    expect((page as any).downloadAllCards).toBeUndefined();
    expect((page as any).downloadHeadCard).toBeUndefined();
    expect((page as any).downloadMemberCard).toBeUndefined();
  });

  it('formats enrollment history from submitted date before created date', () => {
    const { page } = makePage(null, [{
      enrollment_number: 'HIB-HIST-000001',
      status: 'pending_verification',
      created_at: '2026-05-01',
      created_at_bs: '2083-01-18',
      submitted_at: '2026-05-11',
      submitted_at_bs: '2083-01-28',
    }]);

    page.load();

    expect(page.historyDisplayDate(page.history[0])).toBe('2083-01-28');
  });
});
