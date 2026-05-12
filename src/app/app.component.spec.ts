import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { LanguageService } from './services/language.service';

describe('AppComponent', () => {
  const createLanguageService = () => {
    const languageSubject = new BehaviorSubject<'en' | 'ne'>('en');
    const languageService = jasmine.createSpyObj('LanguageService', ['startDomTranslator', 'init', 'toggleLanguage', 'setLocalLanguage'], {
      language$: languageSubject.asObservable(),
    });
    (languageService as any).languageSubject = languageSubject;
    languageService.toggleLanguage.and.returnValue('ne');
    languageService.setLocalLanguage.and.returnValue(Promise.resolve());
    return languageService;
  };

  it('should create the app', async () => {
    const languageService = createLanguageService();
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

  it('requests a root change detection pass when language changes', async () => {
    const languageService = createLanguageService();
    const appRef = jasmine.createSpyObj('ApplicationRef', ['tick']);
    const component = new AppComponent(
      { url: '/', events: { pipe: () => ({ subscribe: jasmine.createSpy('subscribe') }) } } as any,
      jasmine.createSpyObj('AppSyncService', ['emitGlobalRefresh']) as any,
      languageService as any,
      appRef as any
    );

    component.ngOnInit();
    (languageService as any).languageSubject.next('ne');
    await Promise.resolve();

    expect(appRef.tick).toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('does not show the floating language toggle on registration', () => {
    const component = new AppComponent(
      { url: '/register' } as any,
      jasmine.createSpyObj('AppSyncService', ['emitGlobalRefresh']) as any,
      createLanguageService() as any,
      jasmine.createSpyObj('ApplicationRef', ['tick']) as any
    );

    (component as any).updateFloatingLanguageToggle('/register');

    expect(component.showFloatingLanguageToggle).toBeFalse();
  });

  it('keeps the floating language toggle on forgot password', () => {
    const component = new AppComponent(
      { url: '/forgot-password' } as any,
      jasmine.createSpyObj('AppSyncService', ['emitGlobalRefresh']) as any,
      createLanguageService() as any,
      jasmine.createSpyObj('ApplicationRef', ['tick']) as any
    );

    (component as any).updateFloatingLanguageToggle('/forgot-password');

    expect(component.showFloatingLanguageToggle).toBeTrue();
  });
});
