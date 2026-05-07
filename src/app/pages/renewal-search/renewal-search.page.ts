import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonIcon, IonSpinner, IonText
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, arrowForwardOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-renewal-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LanguageToggleComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonIcon, IonSpinner, IonText
  ],
  templateUrl: './renewal-search.page.html',
  styleUrls: ['./renewal-search.page.scss'],
})
export class RenewalSearchPage {
  searchType: string = 'enrollment_number';
  searchValue = '';
  searching = false;
  results: any[] | null = null;
  canInitiateRenewal = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private languageService: LanguageService
  ) {
    addIcons({ searchOutline, arrowForwardOutline });
    const role = this.authService.getCurrentUser()?.role || '';
    this.canInitiateRenewal = ['beneficiary', 'enrollment_assistant'].includes(role);
  }

  async searchPolicy() {
    const value = this.searchValue.trim();
    if (!this.canInitiateRenewal || !value) return;
    if (this.searchType === 'national_id' && !/^\d{10}$/.test(value)) {
      const toast = await this.toastCtrl.create({
        message: this.t('wizard.nid_invalid_length'),
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    this.searching = true;
    this.api.post<ApiResponse>('/renewals/search', {
      search_type: this.searchType,
      search_value: value,
    }).subscribe({
      next: (res) => {
        this.searching = false;
        this.results = Array.isArray(res.data) ? res.data : [res.data];
      },
      error: () => { this.searching = false; },
    });
  }

  async initiateRenewal(enrollment: any) {
    if (!this.canInitiateRenewal) return;

    this.api.post<ApiResponse>('/renewals/initiate', { enrollment_id: enrollment.id }).subscribe({
      next: async (res) => {
        if (res.success) {
          const toast = await this.toastCtrl.create({
            message: this.t('renewals.initiated'), duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
          this.router.navigateByUrl(`/renewal-detail/${res.data.id}`);
        }
      },
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  get searchPlaceholder(): string {
    return this.searchType === 'national_id'
      ? this.t('renewal_search.enter_national_id')
      : this.t('renewal_search.enter_value');
  }
}
