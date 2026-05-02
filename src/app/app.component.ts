import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LanguageToggleComponent } from './components/language-toggle/language-toggle.component';
import { AppSyncService } from './services/app-sync.service';
import { LanguageService } from './services/language.service';

interface RemovableListener {
  remove: () => Promise<void>;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, LanguageToggleComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly appListeners: RemovableListener[] = [];
  private routerSubscription?: Subscription;
  showFloatingLanguageToggle = false;

  constructor(
    private router: Router,
    private syncService: AppSyncService,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    void this.languageService.init();
    this.updateFloatingLanguageToggle(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateFloatingLanguageToggle(event.urlAfterRedirects));

    // Intercept deep links from payment gateways (io.ionic.starter://payment-result?...)
    void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      if (url.hostname === 'payment-result') {
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => (params[key] = value));
        this.router.navigate(['/payment-result'], { queryParams: params, replaceUrl: true });
      }
    }).then(listener => {
      this.appListeners.push(listener);
    });

    // Refresh key mobile views when the app returns from background.
    void App.addListener('resume', () => {
      this.syncService.emitGlobalRefresh('resume');
    }).then(listener => {
      this.appListeners.push(listener);
    });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.appListeners.forEach(listener => {
      void listener.remove();
    });
  }

  private updateFloatingLanguageToggle(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.showFloatingLanguageToggle = ['/register', '/forgot-password']
      .some(route => path === route || path.startsWith(`${route}/`));
  }
}
