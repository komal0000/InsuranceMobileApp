import { Component, inject } from '@angular/core';
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
  lockClosedOutline, mailOutline, eyeOutline, eyeOffOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { isStrongPassword } from '../../utils/auth-validation';

type RecoveryMethod = 'otp' | 'email';
type OtpStep = 1 | 2 | 3;
type ForgotPasswordField = 'password' | 'confirmation';

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
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private languageService = inject(LanguageService);

  recoveryMethod: RecoveryMethod = 'otp';
  otpStep: OtpStep = 1;
  mobileNumber = '';
  otp = '';
  password = '';
  passwordConfirmation = '';
  passwordVisibility: Record<ForgotPasswordField, boolean> = {
    password: false,
    confirmation: false,
  };
  loadingAction: 'sendOtp' | 'verifyOtp' | 'resetPassword' | 'sendEmail' | null = null;

  constructor() {
    addIcons({
      arrowBackOutline, shieldCheckmarkOutline, callOutline, keyOutline,
      lockClosedOutline, mailOutline, eyeOutline, eyeOffOutline,
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

    if (!isStrongPassword(this.password)) {
      await this.presentToast(this.t('auth.password_policy'), 'warning');
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

  passwordInputType(field: ForgotPasswordField): 'text' | 'password' {
    return this.passwordVisibility[field] ? 'text' : 'password';
  }

  passwordIcon(field: ForgotPasswordField): string {
    return this.passwordVisibility[field] ? 'eye-off-outline' : 'eye-outline';
  }

  togglePasswordVisibility(field: ForgotPasswordField): void {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }

  private resetOtpFlow() {
    this.otpStep = 1;
    this.otp = '';
    this.password = '';
    this.passwordConfirmation = '';
    this.passwordVisibility.password = false;
    this.passwordVisibility.confirmation = false;
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
