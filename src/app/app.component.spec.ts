import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from '@capacitor/app';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
import { AppSyncService } from './services/app-sync.service';
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

  const createComponent = async (languageService = createLanguageService()) => {
    const syncService = jasmine.createSpyObj('AppSyncService', ['emitGlobalRefresh']);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AppSyncService, useValue: syncService },
        { provide: LanguageService, useValue: languageService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    return {
      fixture,
      component: fixture.componentInstance,
      appRef: TestBed.inject(ApplicationRef),
      languageService,
      syncService,
    };
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
    spyOn(App, 'addListener').and.returnValue(Promise.resolve({ remove: async () => {} }));
    const { component, appRef } = await createComponent(languageService);
    const tickSpy = spyOn(appRef, 'tick').and.stub();

    component.ngOnInit();
    (languageService as any).languageSubject.next('ne');
    await Promise.resolve();

    expect(tickSpy).toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('does not show the floating language toggle on registration', async () => {
    const { component } = await createComponent();

    (component as any).updateFloatingLanguageToggle('/register');

    expect(component.showFloatingLanguageToggle).toBeFalse();
  });

  it('keeps the floating language toggle on forgot password', async () => {
    const { component } = await createComponent();

    (component as any).updateFloatingLanguageToggle('/forgot-password');

    expect(component.showFloatingLanguageToggle).toBeTrue();
  });
});
