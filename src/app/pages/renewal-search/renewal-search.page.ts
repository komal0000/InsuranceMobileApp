import { Component, inject } from '@angular/core';
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
import { TermsService } from '../../services/terms.service';
import { isValidNidInput, nidLookupValue } from '../../utils/nid-number.util';
import { trackByEntity } from '../../utils/track-by.util';

type RenewalIdentifierType = 'hib_number' | 'national_id';

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
  readonly trackByEntity = trackByEntity;
  private api = inject(ApiService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private termsService = inject(TermsService);

  searchType: RenewalIdentifierType = 'hib_number';
  searchValue = '';
  searching = false;
  results: any[] | null = null;
  canInitiateRenewal = false;
  consentAcceptanceId: number | null = null;

  constructor() {
    addIcons({ searchOutline, arrowForwardOutline });
    const role = this.authService.getCurrentUser()?.role || '';
    this.canInitiateRenewal = ['beneficiary', 'enrollment_assistant'].includes(role);
  }

  async searchPolicy() {
    const value = this.searchValue.trim();
    if (!this.canInitiateRenewal || !value) return;
    if (this.searchType === 'national_id' && !isValidNidInput(value)) {
      const toast = await this.toastCtrl.create({
        message: this.t('wizard.nid_invalid_length'),
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    if (!await this.termsService.confirm('renewal')) {
      return;
    }

    this.searching = true;
    this.api.post<ApiResponse>('/renewals/search', {
      search_type: this.searchType,
      search_value: this.searchType === 'national_id' ? nidLookupValue(value) : value,
      consent_accepted: true,
    }).subscribe({
      next: (res) => {
        this.searching = false;
        const data = res.data as any;
        this.consentAcceptanceId = data?.consent_acceptance_id ?? null;
        const enrollment = data?.enrollment ?? data;
        this.results = Array.isArray(enrollment) ? enrollment : [enrollment];
      },
      error: () => { this.searching = false; },
    });
  }

  async initiateRenewal(enrollment: any) {
    if (!this.canInitiateRenewal) return;
    if (!this.consentAcceptanceId && !await this.termsService.confirm('renewal')) {
      return;
    }

    const identifier = this.renewalIdentifierFor(enrollment);
    if (!identifier) {
      const toast = await this.toastCtrl.create({
        message: this.t('renewal_search.enter_household_hib_number'),
        duration: 2500,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    this.api.post<ApiResponse>('/renewals/initiate', {
      search_type: identifier.search_type,
      search_value: identifier.search_value,
      ...(this.consentAcceptanceId ? { consent_acceptance_id: this.consentAcceptanceId } : { consent_accepted: true }),
    }).subscribe({
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

  private renewalIdentifierFor(enrollment: any): { search_type: RenewalIdentifierType; search_value: string } | null {
    if (this.searchType === 'national_id') {
      const value = nidLookupValue(this.searchValue.trim());
      return value ? { search_type: 'national_id', search_value: value } : null;
    }

    const head = enrollment?.household_head ?? enrollment?.householdHead ?? {};
    const value = String(
      head.member_number
      ?? head.hib_number
      ?? enrollment?.household_head_hib_number
      ?? enrollment?.hib_number
      ?? this.searchValue
      ?? ''
    ).trim();

    return value ? { search_type: 'hib_number', search_value: value } : null;
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  get searchPlaceholder(): string {
    if (this.searchType === 'national_id') {
      return this.t('renewal_search.enter_national_id');
    }

    if (this.searchType === 'hib_number') {
      return this.t('renewal_search.enter_household_hib_number');
    }

    return this.t('renewal_search.enter_value');
  }
}
