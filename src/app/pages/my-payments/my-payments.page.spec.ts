import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { MyPaymentsPage } from './my-payments.page';
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { LanguageService } from '../../services/language.service';

describe('MyPaymentsPage', () => {
  function makePage() {
    const api = jasmine.createSpyObj('ApiService', ['get']);
    api.get.and.returnValue(of({
      success: true,
      data: { data: [], last_page: 1 },
    }));
    const dateService = jasmine.createSpyObj('DateService', ['formatDateTimeForDisplay']);
    dateService.formatDateTimeForDisplay.and.returnValue('2083-01-01');
    const languageService = {
      t: (key: string) => key,
      label: (_namespace: string, value: string | null | undefined) => value || '',
      formatNumber: (value: string | number) => String(value),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: DateService, useValue: dateService },
        { provide: LanguageService, useValue: languageService },
      ],
    });

    return TestBed.runInInjectionContext(() => new MyPaymentsPage());
  }

  it('prefers backend gateway labels for imported legacy payments', () => {
    const page = makePage();

    expect(page.paymentGatewayLabel({
      gateway: 'legacy_imis',
      gateway_label: 'Legacy HIB',
    })).toBe('Legacy HIB');
  });

  it('falls back to uppercased gateway when no label is returned', () => {
    const page = makePage();

    expect(page.paymentGatewayLabel({ gateway: 'khalti' })).toBe('KHALTI');
  });
});
