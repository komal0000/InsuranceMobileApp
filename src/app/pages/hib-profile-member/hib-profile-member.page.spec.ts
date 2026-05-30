import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { HibProfileMemberPage } from './hib-profile-member.page';
import { EnrollmentCardHolder } from '../../interfaces/enrollment.interface';
import { DateService } from '../../services/date.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { LanguageService } from '../../services/language.service';
import { PolicyService } from '../../services/policy.service';

describe('HibProfileMemberPage', () => {
  const headHolder: EnrollmentCardHolder = {
    type: 'head',
    id: 1,
    label: 'Household Head',
    name: 'Sunita Lama',
    name_ne: 'सुनिता लामा',
    date_of_birth: '1990-01-01',
    gender: 'female',
    member_number: '768-130-473-123',
    hib_number: '768-130-473-123',
    insurance_number: '768-130-473-123',
    household_head_hib_number: '768-130-473-123',
    enrollment_number: '2026-000-001',
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
    member_number: '982-345-670-456',
    hib_number: '982-345-670-456',
    insurance_number: '982-345-670-456',
    household_head_hib_number: '768-130-473-123',
    enrollment_number: '2026-000-001',
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

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: PolicyService, useValue: policyService },
        { provide: EnrollmentService, useValue: enrollmentService },
        { provide: DateService, useValue: { formatForDisplay: (ad?: string | null, bs?: string | null) => bs || ad || '' } },
        { provide: Router, useValue: router },
        { provide: ToastController, useValue: toastCtrl },
        { provide: LanguageService, useValue: languageService },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new HibProfileMemberPage());

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

  it('shows holder HIB and household head HIB as separate member details', () => {
    const { page } = makePage('member', 7);

    page.load();

    expect(page.detailRows).toContain(jasmine.objectContaining({
      label: 'hib_profile.member_number',
      value: '982-345-670-456',
    }));
    expect(page.detailRows).toContain(jasmine.objectContaining({
      label: 'hib_profile.household_head_hib_number',
      value: '768-130-473-123',
    }));
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
