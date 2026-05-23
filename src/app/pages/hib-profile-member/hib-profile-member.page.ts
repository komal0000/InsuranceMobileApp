import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardContent,
  IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, downloadOutline, idCardOutline, locationOutline,
  personOutline, shieldCheckmarkOutline
} from 'ionicons/icons';
import { EnrollmentCardHolder } from '../../interfaces/enrollment.interface';
import { HibPolicySummary } from '../../interfaces/policy.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { DateService } from '../../services/date.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { LanguageService } from '../../services/language.service';
import { PolicyService } from '../../services/policy.service';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-hib-profile-member',
  standalone: true,
  imports: [
    CommonModule,
    IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardContent,
    IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
    LanguageToggleComponent
  ],
  templateUrl: './hib-profile-member.page.html',
  styleUrls: ['./hib-profile-member.page.scss'],
})
export class HibProfileMemberPage implements OnInit {
  policy: HibPolicySummary | null = null;
  holder: EnrollmentCardHolder | null = null;
  loading = true;
  exporting = false;
  private routeType: 'head' | 'member' = 'member';
  private routeId = 0;

  constructor(
    private route: ActivatedRoute,
    private policyService: PolicyService,
    private enrollmentService: EnrollmentService,
    private dateService: DateService,
    private router: Router,
    private toastCtrl: ToastController,
    private languageService: LanguageService,
  ) {
    addIcons({
      arrowBackOutline, downloadOutline, idCardOutline, locationOutline,
      personOutline, shieldCheckmarkOutline
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.routeType = this.parseType(this.route.snapshot.paramMap.get('type'));
    this.routeId = Number(this.route.snapshot.paramMap.get('id') || 0);
    this.loading = true;
    this.holder = null;

    this.policyService.getMyPolicy().subscribe({
      next: (data) => {
        this.policy = data.policy;

        if (!this.canLoadCards) {
          this.loading = false;
          return;
        }

        this.loadHolder();
      },
      error: () => {
        this.policy = null;
        this.loading = false;
      },
    });
  }

  get enrollmentId(): number | null {
    const id = Number(this.policy?.enrollment_id || 0);
    return id > 0 ? id : null;
  }

  get canLoadCards(): boolean {
    return this.policy?.status === 'active' && !!this.enrollmentId;
  }

  get detailRows(): DetailRow[] {
    if (!this.holder) return [];

    return [
      { label: this.t('hib_profile.label'), value: this.holderLabel(this.holder) },
      { label: this.t('hib_profile.member_number'), value: this.holder.member_number },
      { label: this.t('hib_profile.insurance_number'), value: this.holder.insurance_number },
      { label: this.t('policy.gender'), value: this.genderLabel(this.holder.gender) },
      { label: this.t('profile.date_of_birth'), value: this.displayCardDate(this.holder.date_of_birth, this.holder.date_of_birth_bs) },
      { label: this.t('dashboard.address'), value: this.holderAddress(this.holder) },
      { label: this.t('hib_profile.service_point'), value: this.holder.service_point || '' },
      { label: this.t('hib_profile.issue_date'), value: this.displayDate(this.holder.issue_date, this.holder.issue_date_bs) },
      { label: this.t('hib_profile.contact_number'), value: this.holder.contact_number || '' },
    ].filter(row => !!row.value);
  }

  downloadCard(): void {
    if (!this.holder || !this.enrollmentId || this.exporting) return;

    this.exporting = true;
    const request$ = this.holder.type === 'head'
      ? this.enrollmentService.getHeadCardPdfUrl(this.enrollmentId)
      : this.enrollmentService.getMemberCardPdfUrl(this.enrollmentId, this.holder.id);

    request$.subscribe({
      next: (res) => {
        this.exporting = false;
        this.openCardPdf(res.data?.card_download_url || this.holder?.pdf_url || null);
      },
      error: () => {
        this.exporting = false;
        this.showCardError();
      },
    });
  }

  backToProfile(): void {
    this.router.navigateByUrl('/tabs/hib-profile');
  }

  getStatusColor(status?: string | null): string {
    return status === 'active' ? 'success' : 'medium';
  }

  formatStatus(status?: string | null): string {
    return this.languageService.label('status', status || undefined, this.t('common.status'));
  }

  holderInitial(holder: EnrollmentCardHolder | null | undefined): string {
    const name = (holder?.name || '').trim();
    return Array.from(name || '?')[0]?.toUpperCase() || '?';
  }

  holderLabel(holder: EnrollmentCardHolder): string {
    return holder.type === 'head'
      ? this.t('common.household_head')
      : this.languageService.translateText(holder.label) || holder.label || this.t('common.member');
  }

  holderAddress(holder: EnrollmentCardHolder): string {
    return holder.address
      || [holder.tole_village, holder.municipality, holder.district]
        .filter(Boolean)
        .join(', ')
      || '';
  }

  genderLabel(value: string | null | undefined): string {
    return this.languageService.label('gender', value || undefined, '');
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || bsDate || adDate || '';
  }

  displayCardDate(date?: string | null, bsDate?: string | null): string {
    return bsDate
      ? this.displayDate(date, bsDate)
      : this.displayDate(null, date);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private loadHolder(): void {
    const enrollmentId = this.enrollmentId;
    if (!enrollmentId) {
      this.loading = false;
      return;
    }

    this.enrollmentService.getCards(enrollmentId).subscribe({
      next: (res) => {
        const cards = res.data?.cards || [];
        this.holder = cards.find(card => card.type === this.routeType && Number(card.id) === this.routeId) || null;
        this.loading = false;
      },
      error: () => {
        this.holder = null;
        this.loading = false;
      },
    });
  }

  private parseType(value: string | null): 'head' | 'member' {
    return value === 'head' ? 'head' : 'member';
  }

  private async openCardPdf(url?: string | null): Promise<void> {
    if (!url) {
      await this.showCardError();
      return;
    }

    try {
      await Browser.open({ url });
    } catch {
      await this.showCardError();
    }
  }

  private async showCardError(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: this.t('hib_profile.card_open_failed'),
      duration: 2000,
      color: 'warning',
      position: 'top',
    });
    await toast.present();
  }
}
