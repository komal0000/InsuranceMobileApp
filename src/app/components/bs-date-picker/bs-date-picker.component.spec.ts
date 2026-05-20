import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BsDatePickerComponent } from './bs-date-picker.component';
import { DateService } from '../../services/date.service';
import { LanguageService } from '../../services/language.service';

describe('BsDatePickerComponent', () => {
  let fixture: ComponentFixture<BsDatePickerComponent>;
  let component: BsDatePickerComponent;
  let dateService: jasmine.SpyObj<DateService>;

  beforeEach(async () => {
    dateService = jasmine.createSpyObj<DateService>('DateService', ['getCurrentBs', 'adToBs', 'bsToAd']);
    dateService.getCurrentBs.and.returnValue('2081-12-06');
    dateService.adToBs.and.callFake((value: string | Date | null | undefined) => String(value ?? ''));
    dateService.bsToAd.and.callFake((value: string | Date | null | undefined) => {
      const normalized = String(value ?? '').replace(/\//g, '-');
      const map: Record<string, string> = {
        '2084-02-03': '2027-05-17',
        '2084-02-04': '2027-05-18',
        '2084-03-01': '2027-06-15',
        '2084-04-01': '2027-07-16',
        '2081-12-01': '2025-03-14',
        '2081-12-06': '2025-03-19',
        '2081-12-07': '2025-03-20',
        '2081-13-01': '',
      };

      return map[normalized] ?? '2027-05-17';
    });

    await TestBed.configureTestingModule({
      imports: [BsDatePickerComponent],
      providers: [
        { provide: DateService, useValue: dateService },
        {
          provide: LanguageService,
          useValue: {
            currentLanguage: 'en',
            t: (key: string) => key,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BsDatePickerComponent);
    component = fixture.componentInstance;
    spyOn(component as any, 'scrollSelectedIntoView');
    fixture.detectChanges();
  });

  it('syncs a complete valid typed BS date into the picker immediately', () => {
    const onChange = jasmine.createSpy('onChange');
    const emitted: string[] = [];
    component.registerOnChange(onChange);
    component.bsDateChange.subscribe(value => emitted.push(value));

    component.onTextInput({ target: { value: '2084/02/03' } } as any);

    expect(component.selectedDate).toEqual({ year: 2084, month: 2, day: 3 });
    expect(component.viewYear).toBe(2084);
    expect(component.viewMonth).toBe(2);
    expect(component.inputValue).toBe('2084/02/03');
    expect(component.inputInvalid).toBeFalse();
    expect(onChange).toHaveBeenCalledOnceWith('2084-02-03');
    expect(emitted).toEqual(['2084-02-03']);
  });

  it('opens the sheet on the typed date after live sync', () => {
    component.onTextInput({ target: { value: '2084/02/03' } } as any);
    component.viewYear = 2081;
    component.viewMonth = 12;

    component.openSheet();

    expect(component.isOpen).toBeTrue();
    expect(component.viewYear).toBe(2084);
    expect(component.viewMonth).toBe(2);
  });

  it('keeps partial typed dates calm until blur or enter', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);

    component.onTextInput({ target: { value: '2084/02' } } as any);

    expect(component.selectedDate).toBeNull();
    expect(component.inputValue).toBe('2084/02');
    expect(component.inputInvalid).toBeFalse();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('updates the input and form value when a picker day is selected', () => {
    const onChange = jasmine.createSpy('onChange');
    const emitted: string[] = [];
    component.registerOnChange(onChange);
    component.bsDateChange.subscribe(value => emitted.push(value));
    component.viewYear = 2084;
    component.viewMonth = 2;

    component.selectDay(3);

    expect(component.selectedDate).toEqual({ year: 2084, month: 2, day: 3 });
    expect(component.inputValue).toBe('2084/02/03');
    expect(onChange).toHaveBeenCalledOnceWith('2084-02-03');
    expect(emitted).toEqual(['2084-02-03']);
  });

  it('renders an external error message as a field-level warning', () => {
    component.label = 'Issue Date';
    (component as any).errorMessage = 'Citizenship issue date cannot be after today.';

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Citizenship issue date cannot be after today.');
    expect(fixture.nativeElement.querySelector('.trigger-field')?.classList).toContain('is-invalid');
  });
});
