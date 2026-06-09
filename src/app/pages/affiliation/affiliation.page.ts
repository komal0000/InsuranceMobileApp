import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-affiliation',
  standalone: true,
  imports: [CommonModule, RouterLink, IonButton, IonContent, IonIcon],
  templateUrl: './affiliation.page.html',
  styleUrls: ['./affiliation.page.scss'],
})
export class AffiliationPage {
  private languageService = inject(LanguageService);

  constructor() {
    addIcons({ logInOutline, shieldCheckmarkOutline });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
