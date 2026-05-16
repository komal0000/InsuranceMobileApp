import { of } from 'rxjs';
import { HibProfilePage } from './hib-profile.page';
import { EnrollmentCardHolder } from '../../interfaces/enrollment.interface';

describe('HibProfilePage', () => {
  const headHolder: EnrollmentCardHolder = {
    type: 'head',
    id: 1,
    label: 'Household Head',
    name: 'Sunita Lama',
    name_ne: 'सुनिता लामा',
    date_of_birth: '1990-01-01',
    gender: 'female',
    member_number: 'HIB-2026-000001-01',
    insurance_number: 'INS-HEAD',
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
    member_number: 'HIB-2026-000001-02',
    insurance_number: 'INS-MEMBER',
    pdf_url: 'https://example.test/member-card.pdf',
  };

  function makePage(options: { policy?: any; cards?: EnrollmentCardHolder[] } = {}) {
    const api = jasmine.createSpyObj('ApiService', ['get']);
    api.get.and.returnValue(of({
      success: true,
      data: {
        policy: options.policy ?? {
          status: 'active',
          enrollment_id: 12,
          enrollment_number: 'HIB-2026-000001',
          total_members: 2,
          start_date: '2026-05-10',
          end_date: '2027-05-09',
        },
        history: [],
      },
    }));

    const enrollmentService = jasmine.createSpyObj('EnrollmentService', [
      'getCards',
      'getAllCardsPdfUrl',
    ]);
    enrollmentService.getCards.and.returnValue(of({
      success: true,
      data: {
        cards: options.cards ?? [memberHolder, headHolder],
        all_cards_pdf_url: 'https://example.test/all-cards-cached.pdf',
      },
    }));
    enrollmentService.getAllCardsPdfUrl.and.returnValue(of({
      success: true,
      data: { card_download_url: 'https://example.test/all-cards-fresh.pdf', card_generated: true },
    }));

    const toast = jasmine.createSpyObj('Toast', ['present']);
    toast.present.and.returnValue(Promise.resolve());
    const toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.returnValue(Promise.resolve(toast));
    const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value?: string, fallback?: string) => value || fallback || '',
      formatNumber: (value: string | number | null | undefined) => String(value ?? ''),
      translateText: (value?: string | null) => value || '',
    };

    const page = new HibProfilePage(
      api,
      enrollmentService,
      { formatForDisplay: (ad?: string | null, bs?: string | null) => bs || ad || '' } as any,
      router,
      toastCtrl,
      languageService as any,
    );

    return { page, api, enrollmentService, router };
  }

  it('loads active policy cards and renders the household head before members', () => {
    const { page, enrollmentService } = makePage();

    page.load();

    expect(enrollmentService.getCards).toHaveBeenCalledOnceWith(12);
    expect(page.cardHolders.map(holder => holder.type)).toEqual(['head', 'member']);
    expect(page.householdHead?.id).toBe(1);
    expect(page.familyMembers.map(holder => holder.id)).toEqual([7]);
  });

  it('does not load cards when policy is unavailable or not active', () => {
    const { page, enrollmentService } = makePage({
      policy: {
        status: 'approved',
        enrollment_id: 12,
        enrollment_number: 'HIB-2026-000001',
      },
    });

    page.load();

    expect(page.canLoadCards).toBeFalse();
    expect(page.cardHolders).toEqual([]);
    expect(enrollmentService.getCards).not.toHaveBeenCalled();
  });

  it('opens Export All Cards PDF from a fresh signed URL', async () => {
    const { page, enrollmentService } = makePage();
    spyOn<any>(page, 'openCardPdf').and.returnValue(Promise.resolve());

    page.load();
    page.downloadAllCards();
    await Promise.resolve();

    expect(enrollmentService.getAllCardsPdfUrl).toHaveBeenCalledOnceWith(12);
    expect((page as any).openCardPdf).toHaveBeenCalledOnceWith('https://example.test/all-cards-fresh.pdf');
  });

  it('opens a holder profile when a card is tapped', () => {
    const { page, router } = makePage();

    page.openHolder(memberHolder);

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/hib-profile/member/member/7');
  });

  it('treats card holder DOB as BS when the API only returns date_of_birth', () => {
    const { page } = makePage();
    const bsOnlyHolder = {
      ...headHolder,
      date_of_birth: '2081-01-10',
      date_of_birth_bs: undefined,
    };

    expect(page.holderDate(bsOnlyHolder)).toBe('2081-01-10');
  });
});
