import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { HibProfileMemberPage } from './hib-profile-member.page';
import { EnrollmentCardHolder } from '../../interfaces/enrollment.interface';

describe('HibProfileMemberPage', () => {
  const headHolder: EnrollmentCardHolder = {
    type: 'head',
    id: 1,
    label: 'Household Head',
    name: 'Sunita Lama',
    name_ne: 'सुनिता लामा',
    date_of_birth: '1990-01-01',
    gender: 'female',
    member_number: '2026-000-001-01',
    insurance_number: '2026-000-001',
    address: 'Hetauda',
    service_point: 'Hetauda HP',
    issue_date: '2026-05-10',
    contact_number: '9800000000',
    pdf_url: 'https://example.test/head-card.pdf',
  };
  const memberHolder: EnrollmentCardHolder = {
    type: 'member',
    id: 7,
    label: 'Son',
    name: 'Amit Lama',
    date_of_birth: '2015-02-01',
    gender: 'male',
    member_number: '2026-000-001-02',
    insurance_number: '2026-000-001',
    address: 'Hetauda',
    service_point: 'Hetauda HP',
    issue_date: '2026-05-10',
    contact_number: '9811111111',
    pdf_url: 'https://example.test/member-card.pdf',
  };

  function makePage(type: 'head' | 'member', id: number) {
    const route = {
      snapshot: {
        paramMap: convertToParamMap({ type, id: String(id) }),
      },
    };
    const policyService = jasmine.createSpyObj('PolicyService', ['getMyPolicy']);
    policyService.getMyPolicy.and.returnValue(of({
      policy: {
        status: 'active',
        enrollment_id: 12,
        enrollment_number: '2026000001',
      },
      history: [],
    }));
    const enrollmentService = jasmine.createSpyObj('EnrollmentService', [
      'getCards',
      'getHeadCardPdfUrl',
      'getMemberCardPdfUrl',
    ]);
    enrollmentService.getCards.and.returnValue(of({
      success: true,
      data: { cards: [headHolder, memberHolder], all_cards_pdf_url: 'https://example.test/all.pdf' },
    }));
    enrollmentService.getHeadCardPdfUrl.and.returnValue(of({
      success: true,
      data: { card_download_url: 'https://example.test/head-fresh.pdf', card_generated: true },
    }));
    enrollmentService.getMemberCardPdfUrl.and.returnValue(of({
      success: true,
      data: { card_download_url: 'https://example.test/member-fresh.pdf', card_generated: true },
    }));
    const toast = jasmine.createSpyObj('Toast', ['present']);
    toast.present.and.returnValue(Promise.resolve());
    const toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve(toast));
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value?: string, fallback?: string) => value || fallback || '',
      translateText: (value?: string | null) => value || '',
    };

    const page = new HibProfileMemberPage(
      route as any,
      policyService,
      enrollmentService,
      { formatForDisplay: (ad?: string | null, bs?: string | null) => bs || ad || '' } as any,
      router,
      toastCtrl,
      languageService as any,
    );

    return { page, enrollmentService };
  }

  it('resolves a clicked member holder and exports the member card', async () => {
    const { page, enrollmentService } = makePage('member', 7);
    spyOn<any>(page, 'openCardPdf').and.returnValue(Promise.resolve());

    page.load();
    page.downloadCard();
    await Promise.resolve();

    expect(page.holder?.id).toBe(7);
    expect(enrollmentService.getCards).toHaveBeenCalledOnceWith(12);
    expect(enrollmentService.getMemberCardPdfUrl).toHaveBeenCalledOnceWith(12, 7);
    expect((page as any).openCardPdf).toHaveBeenCalledOnceWith('https://example.test/member-fresh.pdf');
  });

  it('resolves the household head holder and exports the head card', async () => {
    const { page, enrollmentService } = makePage('head', 1);
    spyOn<any>(page, 'openCardPdf').and.returnValue(Promise.resolve());

    page.load();
    page.downloadCard();
    await Promise.resolve();

    expect(page.holder?.type).toBe('head');
    expect(enrollmentService.getHeadCardPdfUrl).toHaveBeenCalledOnceWith(12);
    expect(enrollmentService.getMemberCardPdfUrl).not.toHaveBeenCalled();
    expect((page as any).openCardPdf).toHaveBeenCalledOnceWith('https://example.test/head-fresh.pdf');
  });

  it('treats card holder DOB as BS when the API only returns date_of_birth', () => {
    const { page } = makePage('member', 7);

    expect(page.displayCardDate('2081-01-10')).toBe('2081-01-10');
  });
});
