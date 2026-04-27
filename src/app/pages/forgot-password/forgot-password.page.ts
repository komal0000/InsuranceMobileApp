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
    private toastCtrl: ToastController
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
        await this.presentToast('Password reset OTP sent successfully.', 'success');
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
      await this.presentToast('OTP must be exactly 6 digits.', 'warning');
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
        await this.presentToast('OTP verified. Set your new password.', 'success');
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
      await this.presentToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      await this.presentToast('Password confirmation does not match.', 'warning');
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
        await this.presentToast('Password reset successful. Please sign in.', 'success');
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
        await this.presentToast('Password reset email sent successfully.', 'success');
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
      1: 'Step 1 of 3: Send OTP',
      2: 'Step 2 of 3: Verify OTP',
      3: 'Step 3 of 3: Reset Password',
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
      void this.presentToast('Mobile number must be exactly 10 digits.', 'warning');
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
}
