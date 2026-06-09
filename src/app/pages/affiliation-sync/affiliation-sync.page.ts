import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, callOutline, cloudDownloadOutline, eyeOffOutline, eyeOutline,
  homeOutline, keyOutline, lockClosedOutline, personOutline,
} from 'ionicons/icons';
import { AffiliationSyncData } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { isStrongPassword } from '../../utils/auth-validation';

type AffiliationStep = 'match' | 'phone' | 'password';
type LoadingAction = 'match' | 'otp' | 'complete' | null;

@Component({
  selector: 'app-affiliation-sync',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner],
  templateUrl: './affiliation-sync.page.html',
  styleUrls: ['./affiliation-sync.page.scss'],
})
export class AffiliationSyncPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private languageService = inject(LanguageService);

  householdHeadHibNumber = '';
  memberHibNumber = '';
  mobileNumber = '';
  otp = '';
  password = '';
  passwordConfirmation = '';
  setup: AffiliationSyncData | null = null;
  step: AffiliationStep = 'match';
  loadingAction: LoadingAction = null;
  showPassword = false;
  showPasswordConfirmation = false;

  constructor() {
    addIcons({
      arrowBackOutline, callOutline, cloudDownloadOutline, eyeOffOutline, eyeOutline,
      homeOutline, keyOutline, lockClosedOutline, personOutline,
    });

    this.setup = this.authService.getAffiliationSetup();
    if (this.setup) {
      this.householdHeadHibNumber = this.setup.household_head_chfid;
      this.memberHibNumber = this.setup.member_chfid;
      this.step = 'phone';
    }
  }

  get loading(): boolean {
    return this.loadingAction !== null;
  }

  passwordType(confirm = false): 'text' | 'password' {
    return confirm
      ? (this.showPasswordConfirmation ? 'text' : 'password')
      : (this.showPassword ? 'text' : 'password');
  }

  passwordIcon(confirm = false): string {
    return this.passwordType(confirm) === 'password' ? 'eye-outline' : 'eye-off-outline';
  }

  async matchHousehold(): Promise<void> {
    const householdHeadHibNumber = this.householdHeadHibNumber.trim();
    const memberHibNumber = this.memberHibNumber.trim();

    if (!householdHeadHibNumber || !memberHibNumber) {
      await this.presentToast(this.t('affiliation_sync.required'), 'warning');
      return;
    }

    this.loadingAction = 'match';
    this.authService.affiliationSync({
      household_head_hib_number: householdHeadHibNumber,
      member_hib_number: memberHibNumber,
    }).subscribe({
      next: async (res) => {
        this.loadingAction = null;
        if (!res.success) return;

        this.setup = res.data;
        this.authService.storeAffiliationSetup(res.data);
        this.step = 'phone';
        await this.presentToast(this.t('affiliation_sync.matched'), 'success');
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  async sendOtp(): Promise<void> {
    if (!this.setup) {
      await this.presentToast(this.t('affiliation_sync.match_first'), 'warning');
      this.step = 'match';
      return;
    }

    const mobileNumber = this.mobileNumber.replace(/\D+/g, '').slice(0, 10);
    this.mobileNumber = mobileNumber;

    if (!/^\d{10}$/.test(mobileNumber)) {
      await this.presentToast(this.t('affiliation_sync.phone_required'), 'warning');
      return;
    }

    this.loadingAction = 'otp';
    this.authService.affiliationSendOtp({
      verification_token: this.setup.verification_token,
      mobile_number: mobileNumber,
    }).subscribe({
      next: async (res) => {
        this.loadingAction = null;
        if (!res.success) return;

        this.mobileNumber = res.data.mobile_number;
        this.step = 'password';
        await this.presentToast(this.t('affiliation_sync.otp_sent'), 'success');
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  async complete(): Promise<void> {
    if (!this.setup) {
      await this.presentToast(this.t('affiliation_sync.match_first'), 'warning');
      this.step = 'match';
      return;
    }

    this.otp = this.otp.replace(/\D+/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(this.otp)) {
      await this.presentToast(this.t('login.otp_digits'), 'warning');
      return;
    }

    if (!isStrongPassword(this.password)) {
      await this.presentToast(this.t('auth.password_policy'), 'warning');
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      await this.presentToast(this.t('login.password_mismatch'), 'warning');
      return;
    }

    this.loadingAction = 'complete';
    this.authService.affiliationComplete({
      verification_token: this.setup.verification_token,
      otp: this.otp,
      password: this.password,
      password_confirmation: this.passwordConfirmation,
      remember: true,
    }).subscribe({
      next: async (res) => {
        this.loadingAction = null;
        if (!res.success) return;

        this.authService.clearAffiliationSetup();
        await this.presentToast(this.t('affiliation_sync.complete_success'), 'success');
        void this.router.navigateByUrl(res.data.redirect_to || '/kyc', { replaceUrl: true });
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
