import { of } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';
import { EnrollmentConfig } from '../interfaces/enrollment.interface';
import { EnrollmentService } from './enrollment.service';

describe('EnrollmentService', () => {
  let api: jasmine.SpyObj<{
    get: (...args: unknown[]) => unknown;
    post: (...args: unknown[]) => unknown;
    postFormData: (...args: unknown[]) => unknown;
  }>;
  let service: EnrollmentService;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'postFormData']);
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

  it('submits enrollment and exposes PDF metadata from the API response', () => {
    const response = {
      success: true,
      message: 'Submitted.',
      data: { id: 25, pdf_download_url: 'https://example.test/enrollment.pdf' },
      pdf_generated: true,
      pdf_download_url: 'https://example.test/enrollment.pdf',
    };
    api.post.and.returnValue(of(response));

    service.submit(25).subscribe(result => {
      expect(result.pdf_generated).toBeTrue();
      expect(result.pdf_download_url).toBe('https://example.test/enrollment.pdf');
    });

    expect(api.post).toHaveBeenCalledWith('/enrollments/25/submit', {});
  });

  it('requests a fresh enrollment PDF URL for detail fallback download', () => {
    const response = {
      success: true,
      message: 'PDF is ready.',
      data: { pdf_download_url: 'https://example.test/enrollment.pdf', pdf_generated: true },
    };
    api.get.and.returnValue(of(response));

    service.getPdfUrl(25).subscribe(result => {
      expect(result.data.pdf_download_url).toBe('https://example.test/enrollment.pdf');
    });

    expect(api.get).toHaveBeenCalledWith('/enrollments/25/pdf-url');
  });

  it('requests card export URLs for active enrollments', () => {
    api.get.and.returnValue(of({
      success: true,
      message: 'Card PDF is ready.',
      data: { card_download_url: 'https://example.test/card.pdf', card_generated: true },
    }));

    service.getAllCardsPdfUrl(25).subscribe(result => {
      expect(result.data.card_download_url).toBe('https://example.test/card.pdf');
    });
    expect(api.get).toHaveBeenCalledWith('/enrollments/25/cards/pdf-url');

    service.getHeadCardPdfUrl(25).subscribe();
    expect(api.get).toHaveBeenCalledWith('/enrollments/25/cards/head/pdf-url');

    service.getMemberCardPdfUrl(25, 9).subscribe();
    expect(api.get).toHaveBeenCalledWith('/enrollments/25/cards/members/9/pdf-url');
  });

  it('removes members with a required death/removal supporting document', () => {
    const response = { success: true, message: 'Removed.', data: null };
    const file = new Blob(['proof'], { type: 'application/pdf' });
    api.postFormData.and.returnValue(of(response));

    service.removeMember(25, 9, file).subscribe(result => expect(result).toEqual(response));

    expect(api.postFormData).toHaveBeenCalledWith('/enrollments/25/members/9', jasmine.any(FormData));
    const submitted = api.postFormData.calls.mostRecent().args[1] as FormData;
    expect(submitted.get('_method')).toBe('DELETE');
    expect(submitted.has('death_document')).toBeTrue();
  });
});
