import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { LanguageService } from './services/language.service';

describe('AppComponent', () => {
  it('should create the app', async () => {
    const languageService = jasmine.createSpyObj('LanguageService', ['startDomTranslator', 'init', 'toggleLanguage', 'setLocalLanguage'], {
      language$: of('en'),
    });
    languageService.toggleLanguage.and.returnValue('ne');
    languageService.setLocalLanguage.and.returnValue(Promise.resolve());
    const authService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'updateLanguage']);
    authService.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: LanguageService, useValue: languageService },
        { provide: AuthService, useValue: authService },
      ]
    }).compileComponents();
    
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
