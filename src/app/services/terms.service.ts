import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TermsFlow } from '../interfaces/enrollment.interface';
import { EnrollmentService } from './enrollment.service';
import { AppLanguage, LanguageService } from './language.service';

const FALLBACK_LABELS: Record<TermsFlow, string> = {
  enrollment: 'Enrollment',
  kyc: 'KYC',
  renewal: 'Renewal',
};

type TermsContent = { label: string; text: string };

@Injectable({ providedIn: 'root' })
export class TermsService {
  private alertCtrl = inject(AlertController);
  private enrollmentService = inject(EnrollmentService);
  private languageService = inject(LanguageService);

  async confirm(flow: TermsFlow): Promise<boolean> {
    const terms = await this.termsFor(flow);

    if (!terms) {
      await this.presentUnavailable(flow);
      return false;
    }

    const label = terms.label || FALLBACK_LABELS[flow];
    const alert = await this.alertCtrl.create({
      header: this.headerFor(label),
      message: this.messageHtml(terms.text),
      inputs: [
        {
          type: 'checkbox',
          label: this.languageService.t('terms.accept_label'),
          value: 'accepted',
        },
      ],
      buttons: [
        {
          text: this.languageService.t('common.cancel'),
          role: 'cancel',
        },
        {
          text: this.languageService.t('terms.continue'),
          role: 'confirm',
          handler: (values) => this.hasAccepted(values),
        },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();

    return result.role === 'confirm';
  }

  private async termsFor(flow: TermsFlow): Promise<TermsContent | null> {
    try {
      const response = await firstValueFrom(this.enrollmentService.getConfig());
      const terms = response.data?.terms?.[flow];

      const language = this.languageService.currentLanguage;
      const text = this.localizedValue(terms?.text_en, terms?.text_ne, terms?.text, language);

      if (!text.trim()) {
        return null;
      }

      return {
        label: this.localizedValue(terms?.label_en, terms?.label_ne, terms?.label || FALLBACK_LABELS[flow], language),
        text,
      };
    } catch {
      return null;
    }
  }

  private async presentUnavailable(flow: TermsFlow): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.headerFor(FALLBACK_LABELS[flow]),
      message: this.languageService.t('terms.unavailable'),
      buttons: [this.languageService.t('common.ok')],
    });

    await alert.present();
    await alert.onDidDismiss();
  }

  private messageHtml(text: string): string {
    return `<div class="terms-modal-body">${this.escapeHtml(text).replace(/\r?\n/g, '<br>')}</div>`;
  }

  private localizedValue(english: string | undefined, nepali: string | undefined, fallback: string | undefined, language: AppLanguage): string {
    if (language === 'ne') {
      return nepali?.trim() || fallback?.trim() || english?.trim() || '';
    }

    return english?.trim() || fallback?.trim() || nepali?.trim() || '';
  }

  private headerFor(label: string): string {
    return this.languageService.currentLanguage === 'ne'
      ? `${label} नियम तथा सर्तहरू`
      : `${label} Terms and Conditions`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private hasAccepted(values: unknown): boolean {
    if (Array.isArray(values)) {
      return values.includes('accepted');
    }

    return values === 'accepted';
  }
}
