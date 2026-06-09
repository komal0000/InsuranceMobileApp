import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, lockClosedOutline } from 'ionicons/icons';
import { AffiliationSyncData } from '../../interfaces/user.interface';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { isStrongPassword } from '../../utils/auth-validation';

@Component({
  selector: 'app-affiliation-password',
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonContent, IonIcon, IonInput, IonItem, IonSpinner],
  templateUrl: './affiliation-password.page.html',
  styleUrls: ['./affiliation-password.page.scss'],
})
export class AffiliationPasswordPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private languageService = inject(LanguageService);

  setup: AffiliationSyncData | null = null;
  password = '';
  passwordConfirmation = '';
  loading = false;
  showPassword = false;
  showPasswordConfirmation = false;

  constructor() {
    addIcons({ eyeOffOutline, eyeOutline, lockClosedOutline });
    void this.router.navigateByUrl('/affiliation/sync', { replaceUrl: true });
  }

  passwordType(confirm = false): 'text' | 'password' {
    return confirm
      ? (this.showPasswordConfirmation ? 'text' : 'password')
      : (this.showPassword ? 'text' : 'password');
  }

  passwordIcon(confirm = false): string {
    return this.passwordType(confirm) === 'password' ? 'eye-outline' : 'eye-off-outline';
  }

  async createPassword(): Promise<void> {
    await this.presentToast(this.t('affiliation_password.sync_first'), 'warning');
    void this.router.navigateByUrl('/affiliation/sync', { replaceUrl: true });
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
