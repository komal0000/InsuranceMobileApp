import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AffiliationPage } from './affiliation.page';
import { LanguageService } from '../../services/language.service';

describe('AffiliationPage', () => {
  const languageService = {
    t: (key: string) => key,
  };

  it('renders affiliated and not affiliated choices', async () => {
    await TestBed.configureTestingModule({
      imports: [AffiliationPage],
      providers: [
        provideRouter([]),
        { provide: LanguageService, useValue: languageService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AffiliationPage);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('affiliation.heading');
    expect(element.textContent).toContain('affiliation.affiliated');
    expect(element.textContent).toContain('affiliation.not_affiliated');
  });
});
