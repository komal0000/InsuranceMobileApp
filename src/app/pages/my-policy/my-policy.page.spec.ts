import { of } from 'rxjs';
import { MyPolicyPage } from './my-policy.page';

describe('MyPolicyPage', () => {
  function makePage(policy: any = null) {
    const api = jasmine.createSpyObj('ApiService', ['get']);
    api.get.and.returnValue(of({
      success: true,
      data: { policy, history: [] },
    }));

    const enrollmentService = jasmine.createSpyObj('EnrollmentService', [
      'getAllCardsPdfUrl',
      'getHeadCardPdfUrl',
      'getMemberCardPdfUrl',
    ]);
    enrollmentService.getAllCardsPdfUrl.and.returnValue(of({
      success: true,
      data: { card_download_url: 'https://example.test/all-cards.pdf', card_generated: true },
    }));
    enrollmentService.getHeadCardPdfUrl.and.returnValue(of({
      success: true,
      data: { card_download_url: 'https://example.test/head-card.pdf', card_generated: true },
    }));
    enrollmentService.getMemberCardPdfUrl.and.returnValue(of({
      success: true,
      data: { card_download_url: 'https://example.test/member-card.pdf', card_generated: true },
    }));

    const toast = jasmine.createSpyObj('Toast', ['present']);
    toast.present.and.returnValue(Promise.resolve());
    const toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve(toast));

    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value: string) => value,
      formatNumber: (value: string | number) => String(value),
      translateText: (value: string) => value,
    };

    const page = new MyPolicyPage(
      api,
      { formatForDisplay: () => '', toApiDate: () => '' } as any,
      enrollmentService,
      toastCtrl,
      languageService as any,
    );

    return { page, api, enrollmentService };
  }

  it('allows card export only for active policies with an enrollment id', () => {
    const { page } = makePage({
      status: 'active',
      enrollment_id: 12,
    });

    page.load();

    expect(page.canExportCards).toBeTrue();

    page.policy.status = 'verified';
    expect(page.canExportCards).toBeFalse();
  });

  it('opens bulk, head, and member card PDFs from fresh signed URLs', async () => {
    const { page, enrollmentService } = makePage({
      status: 'active',
      enrollment_id: 12,
      household_head: { id: 1 },
      members: [{ id: 7 }],
    });
    spyOn<any>(page, 'openCardPdf').and.returnValue(Promise.resolve());

    page.load();
    page.downloadAllCards();
    page.downloadHeadCard();
    page.downloadMemberCard(7);
    await Promise.resolve();

    expect(enrollmentService.getAllCardsPdfUrl).toHaveBeenCalledWith(12);
    expect(enrollmentService.getHeadCardPdfUrl).toHaveBeenCalledWith(12);
    expect(enrollmentService.getMemberCardPdfUrl).toHaveBeenCalledWith(12, 7);
    expect((page as any).openCardPdf).toHaveBeenCalledWith('https://example.test/all-cards.pdf');
    expect((page as any).openCardPdf).toHaveBeenCalledWith('https://example.test/head-card.pdf');
    expect((page as any).openCardPdf).toHaveBeenCalledWith('https://example.test/member-card.pdf');
  });
});
