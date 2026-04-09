import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AppSyncService } from './services/app-sync.service';

interface RemovableListener {
  remove: () => Promise<void>;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly appListeners: RemovableListener[] = [];

  constructor(
    private router: Router,
    private syncService: AppSyncService
  ) {}

  ngOnInit() {
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
    this.appListeners.forEach(listener => {
      void listener.remove();
    });
  }
}
