import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
    // Intercept deep links from payment gateways (io.ionic.starter://payment-result?...)
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      if (url.hostname === 'payment-result') {
        const params: Record<string, string> = {};
        url.searchParams.forEach((value, key) => (params[key] = value));
        this.router.navigate(['/payment-result'], { queryParams: params, replaceUrl: true });
      }
    });
  }
}
