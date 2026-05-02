import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HomePage } from './home.page';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    const languageService = {
      language$: of('en'),
      t: (key: string) => key,
      toggleLanguage: jasmine.createSpy('toggleLanguage').and.returnValue('ne'),
      setLocalLanguage: jasmine.createSpy('setLocalLanguage').and.returnValue(Promise.resolve()),
    };
    const authService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'updateLanguage']);
    authService.isAuthenticated.and.returnValue(false);
    authService.updateLanguage.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: LanguageService, useValue: languageService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
