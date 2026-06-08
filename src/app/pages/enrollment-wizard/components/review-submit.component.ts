import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonIcon,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/angular/standalone';
import { AuthenticatedImageDirective } from '../../../directives/authenticated-image.directive';
import { ApiService } from '../../../services/api.service';
import { DateService } from '../../../services/date.service';
import { LanguageService } from '../../../services/language.service';
import {
  Enrollment,
  FamilyMember,
  HouseholdHead,
  PermanentAddressSource,
  Step1Data,
  SubsidyResult,
  SubsidySummary,
} from '../../../interfaces/enrollment.interface';
import { trackByEntity } from '../../../utils/track-by.util';

interface PremiumBreakdown {
  base: number;
  extra: number;
  total: number;
  members: number;
}

interface ReviewHeadData {
  [key: string]: any;
  first_name?: string;
  last_name?: string;
  first_name_ne?: string;
  last_name_ne?: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  marital_status?: string;
  mobile_number?: string;
  email?: string;
  document_type?: 'citizenship' | 'birth_certificate';
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_district?: string;
  birth_certificate_number?: string;
  birth_certificate_issue_date?: string;
  is_target_group?: boolean;
  target_group_type?: string;
  occupation?: string;
  education_level?: string;
}

@Component({
  selector: 'app-review-submit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuthenticatedImageDirective,
    IonAccordion,
    IonAccordionGroup,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCheckbox,
    IonIcon,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
  templateUrl: './review-submit.component.html',
  styleUrls: ['../enrollment-wizard.page.scss'],
})
export class ReviewSubmitComponent {
  readonly trackByEntity = trackByEntity;
  private dateService = inject(DateService);
  private languageService = inject(LanguageService);
  private api = inject(ApiService);

  private confirmedValue = false;

  @Input() enrollment: Enrollment | null = null;
  @Input({ required: true }) step1!: Step1Data;
  @Input({ required: true }) headData!: ReviewHeadData;
  @Input() householdHead: HouseholdHead | null = null;
  @Input() members: FamilyMember[] = [];
  @Input() subsidyResults: SubsidyResult[] = [];
  @Input() subsidySummary: SubsidySummary | null = null;
  @Input() premiumBreakdown: PremiumBreakdown = { base: 0, extra: 0, total: 0, members: 0 };
  @Input() headPhotoPreview = '';
  @Input() citizenshipFrontPreview = '';
  @Input() citizenshipBackPreview = '';
  @Input() birthCertificateFrontPreview = '';
  @Input() permanentAddressSource: PermanentAddressSource | '' | null = null;
  @Input() basaiSaraiFrontPreview = '';
  @Input() basaiSaraiBackPreview = '';
  @Input() submitting = false;

  @Input()
  get confirmed(): boolean {
    return this.confirmedValue;
  }
  set confirmed(value: boolean) {
    this.confirmedValue = value;
    this.confirmedChange.emit(value);
  }

  @Output() confirmedChange = new EventEmitter<boolean>();
  @Output() goToStepRequested = new EventEmitter<number>();
  @Output() previousStepRequested = new EventEmitter<void>();
  @Output() payAndSubmitRequested = new EventEmitter<void>();
  @Output() submitEnrollmentRequested = new EventEmitter<void>();

  goToStep(step: number): void {
    this.goToStepRequested.emit(step);
  }

  prevStep(): void {
    this.previousStepRequested.emit();
  }

  payAndSubmit(): void {
    this.payAndSubmitRequested.emit();
  }

  submitEnrollment(): void {
    this.submitEnrollmentRequested.emit();
  }

  getAge(adDate?: string | null, bsDate?: string | null): number {
    return this.dateService.calculateAgeFromDates(adDate, bsDate);
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '-';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  label(namespace: string, value: string | null | undefined, fallback?: string): string {
    return this.languageService.label(namespace, value, fallback);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    return this.languageService.formatNumber(value, decimals);
  }

  formatCurrency(value: string | number | null | undefined, decimals = 0): string {
    return `${this.t('common.currency')} ${this.languageService.formatNumber(value ?? 0, decimals)}`;
  }

  formatRelationship(value: string | null | undefined): string {
    return this.languageService.label('relation', value);
  }

  get isMigrationPermanentAddress(): boolean {
    return (this.permanentAddressSource || this.enrollment?.permanent_address_source || '') === 'migration';
  }

  get basaiSaraiEvidence(): Array<{ label: string; url: string }> {
    return [
      {
        label: 'Basai Sarai Front',
        url: this.basaiSaraiFrontPreview || this.enrollmentDocumentUrl('basai_sarai_front'),
      },
      {
        label: 'Basai Sarai Back',
        url: this.basaiSaraiBackPreview || this.enrollmentDocumentUrl('basai_sarai_back'),
      },
    ].filter((item) => item.url !== '');
  }

  paySubmitLabel(amount: string | number | null | undefined): string {
    return this.t('renewal_detail.pay_amount_submit').replace(':amount', this.formatCurrency(amount ?? 0, 0));
  }

  getConfirmationLabel(type: string | null | undefined): string {
    if (!type) {
      return '';
    }

    if (type === 'normal') {
      return this.t('wizard.normal');
    }

    return this.languageService.label('target_group', type, type);
  }

  getBenefitLabel(result: SubsidyResult): string {
    if (result.benefit_type === 'full_premium_waiver') return this.t('benefit.full_premium_waiver');
    if (result.benefit_type === 'percentage_discount') return `${this.formatNumber(result.benefit_value)}% ${this.t('benefit.percentage_discount')}`;
    if (result.benefit_type === 'fixed_discount') return `${this.formatCurrency(result.benefit_value)} ${this.t('benefit.fixed_discount')}`;
    return this.languageService.translateText(result.benefit_type);
  }

  private enrollmentDocumentUrl(type: string): string {
    const document = this.enrollment?.documents?.find((item) => item.document_type === type);

    return this.api.formatImageUrl(document?.url || document?.file_url) || '';
  }
}
