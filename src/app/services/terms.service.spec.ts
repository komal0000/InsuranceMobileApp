import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AlertController } from '@ionic/angular/standalone';
import { EnrollmentService } from './enrollment.service';
import { LanguageService } from './language.service';
import { TermsService } from './terms.service';

describe('TermsService', () => {
  function makeService(dismissRole: string = 'confirm') {
    const alert = {
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      onDidDismiss: jasmine.createSpy('onDidDismiss').and.returnValue(Promise.resolve({ role: dismissRole })),
    };
    const alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    alertCtrl.create.and.returnValue(Promise.resolve(alert));
    const enrollmentService = jasmine.createSpyObj('EnrollmentService', ['getConfig']);
    enrollmentService.getConfig.and.returnValue(of({
      success: true,
      data: {
        terms: {
          enrollment: { flow: 'enrollment', label: 'Enrollment', text: 'Enrollment-specific admin terms.', version: 2 },
          kyc: { flow: 'kyc', label: 'KYC', text: 'KYC-specific admin terms.', version: 4 },
          renewal: { flow: 'renewal', label: 'Renewal', text: 'Renewal-specific admin terms.', version: 6 },
        },
      },
    }));
    const languageService = {
      t: (key: string) => key,
      translateText: (value?: string) => value || '',
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AlertController, useValue: alertCtrl },
        { provide: EnrollmentService, useValue: enrollmentService },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    return {
      alert,
      alertCtrl,
      enrollmentService,
      service: TestBed.inject(TermsService),
    };
  }

  it('shows the selected flow terms from enrollment config', async () => {
    const { alertCtrl, service } = makeService();

    await service.confirm('kyc');

    expect(alertCtrl.create).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      header: 'KYC Terms and Conditions',
      message: jasmine.stringContaining('KYC-specific admin terms.'),
      inputs: [jasmine.objectContaining({ type: 'checkbox', value: 'accepted' })],
    }));
  });

  it('returns false when the terms modal is cancelled', async () => {
    const { service } = makeService('cancel');

    await expectAsync(service.confirm('renewal')).toBeResolvedTo(false);
  });

  it('returns false when selected flow terms are missing', async () => {
    const { alertCtrl, enrollmentService, service } = makeService();
    enrollmentService.getConfig.and.returnValue(of({
      success: true,
      data: { terms: {} },
    }));

    await expectAsync(service.confirm('renewal')).toBeResolvedTo(false);

    expect(alertCtrl.create).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      header: 'Renewal Terms and Conditions',
      message: 'terms.unavailable',
      buttons: ['common.ok'],
    }));
  });

  it('returns false when terms config cannot be loaded', async () => {
    const { alertCtrl, enrollmentService, service } = makeService();
    enrollmentService.getConfig.and.returnValue(throwError(() => new Error('offline')));

    await expectAsync(service.confirm('enrollment')).toBeResolvedTo(false);

    expect(alertCtrl.create).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      header: 'Enrollment Terms and Conditions',
      message: 'terms.unavailable',
    }));
  });
});
