import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  homeOutline,
  peopleOutline,
  personCircleOutline,
  searchOutline,
  sendOutline,
} from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  LegacyImisKycDemoResponse,
  LegacyImisMember,
} from '../../interfaces/legacy-imis.interface';
import { LanguageService } from '../../services/language.service';
import { LegacyImisService } from '../../services/legacy-imis.service';

@Component({
  selector: 'app-kyc-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './kyc-demo.page.html',
  styleUrls: ['./kyc-demo.page.scss'],
})
export class KycDemoPage implements OnDestroy {
  householdHeadChfid = '';
  memberChfid = '';
  loading = false;
  updating = false;
  errorMessage = '';
  successMessage = '';
  demoData: LegacyImisKycDemoResponse | null = null;
  kycForm = {
    firstname: '',
    lastname: '',
    phone: '',
  };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private legacyImis: LegacyImisService,
    private languageService: LanguageService
  ) {
    addIcons({
      alertCircleOutline,
      checkmarkCircleOutline,
      homeOutline,
      peopleOutline,
      personCircleOutline,
      searchOutline,
      sendOutline,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchMember(): void {
    const householdHeadChfid = this.householdHeadChfid.trim();
    const memberChfid = this.memberChfid.trim();

    this.clearMessages();

    if (!householdHeadChfid || !memberChfid) {
      this.errorMessage = this.t('kyc_demo.required_chfids');
      return;
    }

    this.loading = true;
    this.demoData = null;

    this.legacyImis.fetchKycDemoMember(householdHeadChfid, memberChfid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.applyDemoData(res.data);
        },
        error: (error) => {
          this.loading = false;
          this.demoData = null;
          this.errorMessage = this.errorMessageFrom(error, 'kyc_demo.fetch_failed');
        },
      });
  }

  updateKyc(): void {
    const householdHeadChfid = this.householdHeadChfid.trim();
    const memberChfid = (this.demoData?.selected_member?.chfid || this.memberChfid).trim();
    const firstname = this.kycForm.firstname.trim();
    const lastname = this.kycForm.lastname.trim();
    const phone = this.kycForm.phone.trim();

    this.clearMessages();

    if (!this.demoData?.selected_member || !householdHeadChfid || !memberChfid) {
      this.errorMessage = this.t('kyc_demo.fetch_first');
      return;
    }

    if (!firstname && !lastname && !phone) {
      this.errorMessage = this.t('kyc_demo.update_required');
      return;
    }

    this.updating = true;

    this.legacyImis.updateKycDemo({
      household_head_chfid: householdHeadChfid,
      member_chfid: memberChfid,
      firstname,
      lastname,
      phone,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.updating = false;
          this.applyDemoData(res.data);
          this.successMessage = res.message || this.t('kyc_demo.update_success');
        },
        error: (error) => {
          this.updating = false;
          this.errorMessage = this.errorMessageFrom(error, 'kyc_demo.update_failed');
        },
      });
  }

  memberName(member?: LegacyImisMember | null): string {
    const name = [member?.first_name, member?.last_name].filter(Boolean).join(' ').trim();
    return name || this.t('common.not_available');
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return this.t('common.not_available');
    }

    return String(value);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private applyDemoData(data: LegacyImisKycDemoResponse | null | undefined): void {
    if (!data) {
      this.demoData = null;
      return;
    }

    this.demoData = data;
    this.householdHeadChfid = data.household_head_chfid || this.householdHeadChfid.trim();
    this.memberChfid = data.selected_member?.chfid || data.member_chfid || this.memberChfid.trim();
    this.kycForm = {
      firstname: data.selected_member?.first_name || '',
      lastname: data.selected_member?.last_name || '',
      phone: data.selected_member?.phone || '',
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private errorMessageFrom(error: any, fallbackKey: string): string {
    const validationErrors = error?.error?.errors;
    const firstValidation = validationErrors
      ? Object.values(validationErrors).reduce<string | null>((found, value) => {
          if (found) return found;
          if (typeof value === 'string') return value;
          if (Array.isArray(value)) {
            return value.find((item): item is string => typeof item === 'string') || null;
          }
          return null;
        }, null)
      : null;
    const message = firstValidation || error?.error?.message;

    return this.languageService.translateText(message) || this.t(fallbackKey);
  }
}
