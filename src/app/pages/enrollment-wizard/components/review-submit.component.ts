import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { DateService } from '../../../services/date.service';
import { LanguageService } from '../../../services/language.service';
import {
  Enrollment,
  FamilyMember,
  HouseholdHead,
  Step1Data,
  SubsidyResult,
  SubsidySummary,
} from '../../../interfaces/enrollment.interface';

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
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_district?: string;
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

  constructor(
    private dateService: DateService,
    private languageService: LanguageService,
  ) {}

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

  paySubmitLabel(amount: string | number | null | undefined): string {
    return this.t('renewal_detail.pay_amount_submit').replace(':amount', this.formatCurrency(amount ?? 0, 0));
  }

  getConfirmationLabel(type: string | null | undefined): string {
    if (!type) {
      return '';
    }

    const labels: Record<string, string> = {
      normal: 'Normal',
      ultra_poor: 'Ultra Poor',
      fchv: 'FCHV',
      senior_citizen: 'Senior Citizen',
      hiv: 'HIV',
      leprosy: 'Leprosy',
      null_disability: 'Null Disability',
      mdr_tb: 'MDR-TB',
    };

    return labels[type] || type;
  }

  getBenefitLabel(result: SubsidyResult): string {
    if (result.benefit_type === 'full_premium_waiver') return '100% Free';
    if (result.benefit_type === 'percentage_discount') return `${result.benefit_value}% Discount`;
    if (result.benefit_type === 'fixed_discount') return `Rs. ${result.benefit_value} Discount`;
    return result.benefit_type;
  }
}
