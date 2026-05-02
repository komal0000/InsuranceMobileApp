import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { LanguageToggleComponent } from '../components/language-toggle/language-toggle.component';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, LanguageToggleComponent],
})
export class HomePage {
  constructor(private languageService: LanguageService) {}

  t(key: string): string {
    return this.languageService.t(key);
  }
}
