import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonItem, IonInput, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, shieldCheckmarkOutline, callOutline, keyOutline,
  lockClosedOutline, mailOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

type RecoveryMethod = 'otp' | 'email';
type OtpStep = 1 | 2 | 3;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonButton, IonItem, IonInput, IonSpinner, IonIcon,
  ],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  recoveryMethod: RecoveryMethod = 'otp';
  otpStep: OtpStep = 1;
  mobileNumber = '';
  otp = '';
  password = '';
  passwordConfirmation = '';
  loadingAction: 'sendOtp' | 'verifyOtp' | 'resetPassword' | 'sendEmail' | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private languageService: LanguageService
  ) {
    addIcons({
      arrowBackOutline, shieldCheckmarkOutline, callOutline, keyOutline,
      lockClosedOutline, mailOutline,
    });
  }

  setRecoveryMethod(method: RecoveryMethod) {
    this.recoveryMethod = method;
    this.resetOtpFlow();
  }

  async sendOtp() {
    if (!this.ensureValidMobileNumber()) {
      return;
    }

    this.loadingAction = 'sendOtp';
    this.authService.sendPasswordOtp({ mobile_number: this.mobileNumber }).subscribe({
      next: async () => {
        this.loadingAction = null;
        this.otpStep = 2;
        await this.presentToast(this.t('forgot.otp_sent'), 'success');
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  async verifyOtp() {
    if (!this.ensureValidMobileNumber()) {
      return;
    }

    if (!/^\d{6}$/.test(this.normalizedOtp)) {
      await this.presentToast(this.t('login.otp_digits'), 'warning');
      return;
    }

    this.loadingAction = 'verifyOtp';
    this.authService.verifyPasswordOtp({
      mobile_number: this.mobileNumber,
      otp: this.normalizedOtp,
    }).subscribe({
      next: async () => {
        this.loadingAction = null;
        this.otpStep = 3;
        await this.presentToast(this.t('forgot.otp_verified'), 'success');
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  async resetPassword() {
    if (!this.ensureValidMobileNumber()) {
      return;
    }

    if (this.password.length < 8) {
      await this.presentToast(this.t('login.password_min_length'), 'warning');
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      await this.presentToast(this.t('Password confirmation does not match.'), 'warning');
      return;
    }

    this.loadingAction = 'resetPassword';
    this.authService.resetPasswordWithOtp({
      mobile_number: this.mobileNumber,
      otp: this.normalizedOtp,
      password: this.password,
      password_confirmation: this.passwordConfirmation,
    }).subscribe({
      next: async () => {
        this.loadingAction = null;
        await this.presentToast(this.t('forgot.reset_success'), 'success');
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  async sendResetEmail() {
    if (!this.ensureValidMobileNumber()) {
      return;
    }

    this.loadingAction = 'sendEmail';
    this.authService.sendPasswordResetEmail({
      mobile_number: this.mobileNumber,
    }).subscribe({
      next: async () => {
        this.loadingAction = null;
        await this.presentToast(this.t('forgot.email_sent'), 'success');
      },
      error: () => {
        this.loadingAction = null;
      },
    });
  }

  get normalizedOtp(): string {
    return this.otp.replace(/\D+/g, '').slice(0, 6);
  }

  get stepLabel(): string {
    const labels: Record<OtpStep, string> = {
      1: this.t('forgot.step_send'),
      2: this.t('forgot.step_verify'),
      3: this.t('forgot.step_reset'),
    };

    return labels[this.otpStep];
  }

  private resetOtpFlow() {
    this.otpStep = 1;
    this.otp = '';
    this.password = '';
    this.passwordConfirmation = '';
  }

  private ensureValidMobileNumber(): boolean {
    this.mobileNumber = this.mobileNumber.replace(/\D+/g, '').slice(0, 10);

    if (!/^\d{10}$/.test(this.mobileNumber)) {
      void this.presentToast(this.t('register.mobile_digits'), 'warning');
      return false;
    }

    return true;
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });

    await toast.present();
  }

  t(key: string): string {
    return this.languageService.t(key);
  }
}
