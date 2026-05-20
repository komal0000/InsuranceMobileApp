import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular/standalone';
import { BsDatePickerComponent } from '../bs-date-picker/bs-date-picker.component';
import { NepaliInputDirective } from '../../directives/nepali-input.directive';
import { ServicePointOption } from '../../interfaces/enrollment.interface';
import { DateService } from '../../services/date.service';
import { LanguageService } from '../../services/language.service';
import { RelationshipGenderMap, genderForRelationship } from '../../utils/relationship-gender.util';
import {
  isMarriedOrDivorcedStatus,
  spouseGenderForHead,
} from '../../utils/relationship-marital-status.util';

export type MemberImageField =
  | 'photo'
  | 'citizenship_front_image'
  | 'citizenship_back_image'
  | 'birth_certificate_front_image';

interface MemberFormModel {
  [key: string]: any;
  first_name?: string;
  last_name?: string;
  first_name_ne?: string;
  last_name_ne?: string;
  gender?: string;
  date_of_birth?: string;
  relationship?: string;
  blood_group?: string;
  marital_status?: string;
  mobile_number?: string;
  email?: string;
  first_service_point_id?: number | string | null;
  first_service_point?: string | null;
  occupation?: string;
  document_type?: string;
  citizenship_number?: string;
  citizenship_issue_date?: string;
  citizenship_issue_district?: string;
  birth_certificate_number?: string;
  birth_certificate_issue_date?: string;
}

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NepaliInputDirective,
    BsDatePickerComponent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
  styles: [`
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-item {
      --background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      --padding-start: 12px;
      margin-bottom: 6px;
    }

    .form-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #6c757d;
      text-transform: uppercase;
      margin: 8px 0 4px;
    }

    .capture-section {
      margin: 12px 0;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
    }

    .capture-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .capture-label {
      font-weight: 600;
      font-size: 0.85rem;
      color: #212529;
    }

    .preview-img {
      max-width: 180px;
      margin-top: 8px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .btn-row {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }

    .btn-row ion-button {
      flex: 1;
    }

    .helper-text {
      margin: 2px 4px 8px;
      color: #6c757d;
      font-size: 0.75rem;
    }

    .warning-text {
      margin: -2px 4px 8px;
      color: #dc3545;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `],
  template: `
    <div class="form-group">
      <div class="capture-section" style="margin-bottom:16px">
        <div class="capture-row">
          <span class="capture-label">{{ text('profile.photo', 'Photo') }}</span>
          <ion-button size="small" fill="outline" (click)="captureImage('photo')">
            <ion-icon slot="start" name="camera-outline"></ion-icon>
            {{ photoPreview ? text('common.change', 'Change') : text('common.capture', 'Capture') }}
          </ion-button>
        </div>
        <img *ngIf="photoPreview" [src]="photoPreview" class="preview-img" />
      </div>

      <p class="form-section-title">{{ text('wizard.english_name', 'English Name') }}</p>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.first_name_required', 'First Name *')" labelPlacement="stacked" [(ngModel)]="member.first_name" [readonly]="isFieldReadonly('first_name')" [disabled]="isFieldReadonly('first_name')" [attr.readonly]="isFieldReadonly('first_name') ? true : null"></ion-input>
      </ion-item>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.last_name_required', 'Last Name *')" labelPlacement="stacked" [(ngModel)]="member.last_name" [readonly]="isFieldReadonly('last_name')" [disabled]="isFieldReadonly('last_name')" [attr.readonly]="isFieldReadonly('last_name') ? true : null"></ion-input>
      </ion-item>

      <p class="form-section-title">{{ text('wizard.nepali_name', 'Nepali Name') }}</p>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.first_name_ne', 'First Name (नेपाली)')" labelPlacement="stacked" appNepaliInput [(ngModel)]="member.first_name_ne" [readonly]="isFieldReadonly('first_name_ne')" [disabled]="isFieldReadonly('first_name_ne')" [attr.readonly]="isFieldReadonly('first_name_ne') ? true : null"></ion-input>
      </ion-item>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.last_name_ne', 'Last Name (नेपाली)')" labelPlacement="stacked" appNepaliInput [(ngModel)]="member.last_name_ne" [readonly]="isFieldReadonly('last_name_ne')" [disabled]="isFieldReadonly('last_name_ne')" [attr.readonly]="isFieldReadonly('last_name_ne') ? true : null"></ion-input>
      </ion-item>

      <p class="form-section-title">{{ text('wizard.personal_details', 'Personal Details') }}</p>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.gender_required', 'Gender *')" labelPlacement="stacked" [(ngModel)]="member.gender" [disabled]="isGenderLocked || isFieldReadonly('gender')" [attr.disabled]="isGenderLocked || isFieldReadonly('gender') ? true : null">
          <ion-select-option value="male">{{ text('gender.male', 'Male') }}</ion-select-option>
          <ion-select-option value="female">{{ text('gender.female', 'Female') }}</ion-select-option>
          <ion-select-option value="other">{{ text('gender.other', 'Other') }}</ion-select-option>
        </ion-select>
      </ion-item>
      <app-bs-date-picker
        [(ngModel)]="member.date_of_birth"
        (ngModelChange)="syncMaritalStatusForAge()"
        [label]="text('wizard.date_of_birth_required', 'Date of Birth *')"
        [placeholder]="text('common.select_bs_date', 'Select BS date')"
        [disabled]="isFieldReadonly('date_of_birth')">
      </app-bs-date-picker>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.relationship_required', 'Relationship to Head *')" labelPlacement="stacked" [(ngModel)]="member.relationship" (ngModelChange)="onRelationshipChange($event)">
          <ion-select-option *ngFor="let option of relationshipOptions" [value]="option.value">
            {{ relationshipLabel(option.value) }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.blood_group', 'Blood Group')" labelPlacement="stacked" [(ngModel)]="member.blood_group">
          <ion-select-option value="A+">A+</ion-select-option>
          <ion-select-option value="A-">A-</ion-select-option>
          <ion-select-option value="B+">B+</ion-select-option>
          <ion-select-option value="B-">B-</ion-select-option>
          <ion-select-option value="AB+">AB+</ion-select-option>
          <ion-select-option value="AB-">AB-</ion-select-option>
          <ion-select-option value="O+">O+</ion-select-option>
          <ion-select-option value="O-">O-</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.marital_status', 'Marital Status')" labelPlacement="stacked" [(ngModel)]="member.marital_status" (ngModelChange)="onMaritalStatusChange($event)" [disabled]="isSpouseMaritalStatusLocked">
          <ion-select-option value="single">{{ text('marital.single', 'Single') }}</ion-select-option>
          <ion-select-option value="married" [disabled]="isMaritalOptionDisabled('married')">{{ text('marital.married', 'Married') }}</ion-select-option>
          <ion-select-option value="divorced" [disabled]="isMaritalOptionDisabled('divorced')">{{ text('marital.divorced', 'Divorced') }}</ion-select-option>
          <ion-select-option value="widowed">{{ text('marital.widowed', 'Widowed') }}</ion-select-option>
          <ion-select-option value="separated">{{ text('marital.separated', 'Separated') }}</ion-select-option>
        </ion-select>
      </ion-item>
      <div *ngIf="memberRelationshipWarning" class="warning-text">{{ memberRelationshipWarning }}</div>
      <ion-item class="form-item">
        <ion-input [label]="text('profile.mobile_number', 'Mobile Number')" labelPlacement="stacked" type="tel" maxlength="10" minlength="10" [(ngModel)]="member.mobile_number" [readonly]="isFieldReadonly('mobile_number')" [disabled]="isFieldReadonly('mobile_number')" [attr.readonly]="isFieldReadonly('mobile_number') ? true : null"></ion-input>
      </ion-item>
      <ion-item class="form-item" *ngIf="showEmail">
        <ion-input [label]="text('profile.email', 'Email')" labelPlacement="stacked" type="email" [(ngModel)]="member.email" [readonly]="isFieldReadonly('email')" [disabled]="isFieldReadonly('email')" [attr.readonly]="isFieldReadonly('email') ? true : null"></ion-input>
      </ion-item>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.first_service_point', 'First Service Point')" labelPlacement="stacked"
                    [placeholder]="text('wizard.select_service_point', 'Select Service Point')"
                    [(ngModel)]="member.first_service_point_id"
                    [disabled]="!servicePointOptions.length">
          <ion-select-option value="">{{ text('common.not_available', 'Not available') }}</ion-select-option>
          <ion-select-option *ngFor="let option of servicePointOptions" [value]="option.id">{{ option.name }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.occupation', 'Occupation')" labelPlacement="stacked"
                    [placeholder]="text('wizard.select_profession', 'Select Occupation')"
                    [(ngModel)]="member.occupation"
                    [disabled]="isFieldReadonly('occupation')"
                    [attr.disabled]="isFieldReadonly('occupation') ? true : null">
          <ion-select-option value="">{{ text('wizard.select_profession', 'Select Occupation') }}</ion-select-option>
          <ion-select-option *ngIf="member.occupation && !hasProfessionOption(member.occupation)" [value]="member.occupation">
            {{ member.occupation }}
          </ion-select-option>
          <ion-select-option *ngFor="let option of professionOptions" [value]="option.label">{{ option.label }}</ion-select-option>
        </ion-select>
      </ion-item>

      <p class="form-section-title">{{ text('wizard.identity_document', 'Identity Document') }}</p>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.document_type', 'Document Type')" labelPlacement="stacked" [(ngModel)]="member.document_type">
          <ion-select-option value="citizenship">{{ text('wizard.citizenship_certificate', 'Citizenship Certificate') }}</ion-select-option>
          <ion-select-option value="birth_certificate">{{ text('wizard.birth_certificate', 'Birth Certificate') }}</ion-select-option>
        </ion-select>
      </ion-item>

      <div *ngIf="member.document_type === 'citizenship'">
        <ion-item class="form-item">
          <ion-input [label]="text('wizard.citizenship_number', 'Citizenship Number')" labelPlacement="stacked" [(ngModel)]="member.citizenship_number" [readonly]="isFieldReadonly('citizenship_number')" [disabled]="isFieldReadonly('citizenship_number')" [attr.readonly]="isFieldReadonly('citizenship_number') ? true : null"></ion-input>
        </ion-item>
        <app-bs-date-picker
          [(ngModel)]="member.citizenship_issue_date"
          [label]="text('wizard.citizenship_issue_date', 'Issue Date')"
          [placeholder]="text('common.select_bs_date', 'Select BS date')"
          [errorMessage]="member.citizenship_issue_date ? citizenshipIssueDateErrorMessage : ''"
          [disabled]="isFieldReadonly('citizenship_issue_date')">
        </app-bs-date-picker>
        <ion-item class="form-item">
          <ion-input [label]="text('wizard.citizenship_issue_district', 'Issue District')" labelPlacement="stacked" [(ngModel)]="member.citizenship_issue_district" [readonly]="isFieldReadonly('citizenship_issue_district')" [disabled]="isFieldReadonly('citizenship_issue_district')" [attr.readonly]="isFieldReadonly('citizenship_issue_district') ? true : null"></ion-input>
        </ion-item>

        <div class="capture-section">
          <div class="capture-row">
            <span class="capture-label">{{ text('wizard.citizenship_front', 'Citizenship Front') }}</span>
            <ion-button size="small" fill="outline" (click)="captureImage('citizenship_front_image')">
              <ion-icon slot="start" name="camera-outline"></ion-icon>
              {{ citizenshipFrontPreview ? text('common.change', 'Change') : text('common.capture', 'Capture') }}
            </ion-button>
          </div>
          <img *ngIf="citizenshipFrontPreview" [src]="citizenshipFrontPreview" class="preview-img" />
        </div>
        <div class="capture-section">
          <div class="capture-row">
            <span class="capture-label">{{ text('wizard.citizenship_back', 'Citizenship Back') }}</span>
            <ion-button size="small" fill="outline" (click)="captureImage('citizenship_back_image')">
              <ion-icon slot="start" name="camera-outline"></ion-icon>
              {{ citizenshipBackPreview ? text('common.change', 'Change') : text('common.capture', 'Capture') }}
            </ion-button>
          </div>
          <img *ngIf="citizenshipBackPreview" [src]="citizenshipBackPreview" class="preview-img" />
        </div>
      </div>

      <div *ngIf="member.document_type === 'birth_certificate'">
        <ion-item class="form-item">
          <ion-input [label]="text('wizard.birth_certificate_number', 'Birth Certificate Number')" labelPlacement="stacked" [(ngModel)]="member.birth_certificate_number"></ion-input>
        </ion-item>
        <app-bs-date-picker
          [(ngModel)]="member.birth_certificate_issue_date"
          [label]="text('wizard.birth_certificate_issue_date', 'Issue Date')"
          [placeholder]="text('common.select_bs_date', 'Select BS date')">
        </app-bs-date-picker>

        <div class="capture-section">
          <div class="capture-row">
            <span class="capture-label">{{ text('wizard.birth_certificate_front', 'Birth Certificate Document') }}</span>
            <ion-button size="small" fill="outline" (click)="captureImage('birth_certificate_front_image')">
              <ion-icon slot="start" name="camera-outline"></ion-icon>
              {{ birthCertificateFrontPreview ? text('common.change', 'Change') : text('common.capture', 'Capture') }}
            </ion-button>
          </div>
          <img *ngIf="birthCertificateFrontPreview" [src]="birthCertificateFrontPreview" class="preview-img" />
        </div>
      </div>

      <div class="btn-row">
        <ion-button expand="block" fill="outline" color="medium" (click)="cancel.emit()">
          {{ text('common.cancel', 'Cancel') }}
        </ion-button>
        <ion-button expand="block" (click)="save.emit()" [disabled]="isSaveDisabled">
          <ion-spinner *ngIf="saving" name="crescent"></ion-spinner>
          <span *ngIf="!saving">{{ isEditing ? text('renewal_detail.update_member', 'Update Member') : text('renewals.save_member', 'Save Member') }}</span>
        </ion-button>
      </div>
    </div>
  `,
})
export class MemberFormComponent implements OnChanges {
  @Input({ required: true }) member!: MemberFormModel;
  @Input() relationshipOptions: Array<{ value: string; label: string }> = [];
  @Input() relationshipGenderMap: RelationshipGenderMap = {};
  @Input() headGender: string | null = null;
  @Input() isHeadSingle = false;
  @Input() showRelationshipConstraintNotice = false;
  @Input() isEditing = false;
  @Input() saving = false;
  @Input() showEmail = false;
  @Input() disableSaveWhenInvalid = false;
  @Input() lockedFields: ReadonlySet<string> = new Set<string>();
  @Input() servicePointOptions: ServicePointOption[] = [];
  @Input() professionOptions: Array<{ id: number; label: string }> = [];
  @Input() photoPreview = '';
  @Input() citizenshipFrontPreview = '';
  @Input() citizenshipBackPreview = '';
  @Input() birthCertificateFrontPreview = '';
  @Input() citizenshipIssueDateErrorMessage = '';

  @Output() capture = new EventEmitter<MemberImageField>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(
    private languageService: LanguageService,
    private dateService: DateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['member'] || changes['relationshipGenderMap'] || changes['headGender']) {
      this.applyRelationshipRules(this.member?.relationship);
    }
  }

  get isGenderLocked(): boolean {
    return this.relationshipGender(this.member?.relationship) !== null;
  }

  get isSpouseMaritalStatusLocked(): boolean {
    return this.normalizedRelationship(this.member?.relationship) === 'spouse';
  }

  get memberRelationshipWarning(): string {
    const age = this.memberAge();
    if (age === null || age >= 20) {
      return '';
    }

    if (this.isSpouseMaritalStatusLocked) {
      return this.text('wizard.spouse_age_min', 'Spouse must be at least 20 years old.');
    }

    return this.text('wizard.member_marital_status_age', 'Members under 20 years old cannot be married or divorced.');
  }

  get isSaveDisabled(): boolean {
    if (this.saving) {
      return true;
    }

    return this.disableSaveWhenInvalid && !this.hasRequiredFields();
  }

  captureImage(field: MemberImageField): void {
    this.capture.emit(field);
  }

  relationshipLabel(value: string): string {
    return this.languageService.label('relation', value);
  }

  hasProfessionOption(value: unknown): boolean {
    return this.professionOptions.some((option) => option.label === String(value));
  }

  isFieldReadonly(field: string): boolean {
    return this.lockedFields.has(field);
  }

  onRelationshipChange(value: string): void {
    if (this.member) {
      this.member.relationship = value;
    }

    this.applyRelationshipRules(value);
  }

  onMaritalStatusChange(value: string): void {
    if (this.member) {
      this.member.marital_status = value;
    }

    this.syncMaritalStatusForAge();
  }

  isMaritalOptionDisabled(status: string): boolean {
    return !this.isSpouseMaritalStatusLocked
      && this.isMemberUnderTwenty()
      && isMarriedOrDivorcedStatus(status);
  }

  syncMaritalStatusForAge(): void {
    if (!this.member) {
      return;
    }

    if (this.isSpouseMaritalStatusLocked) {
      this.member.marital_status = 'married';
      return;
    }

    if (this.isMemberUnderTwenty() && isMarriedOrDivorcedStatus(this.member.marital_status)) {
      this.member.marital_status = '';
    }
  }

  text(key: string, fallback: string): string {
    const translated = this.languageService.t(key);
    return translated === key ? fallback : translated;
  }

  private hasRequiredFields(): boolean {
    return !!(
      this.member?.['first_name'] &&
      this.member?.['last_name'] &&
      this.member?.['gender'] &&
      this.member?.['date_of_birth'] &&
      this.member?.['relationship']
    );
  }

  private applyRelationshipRules(relationship: unknown): void {
    const gender = this.relationshipGender(relationship);
    if (gender && this.member) {
      this.member.gender = gender;
    }

    if (this.normalizedRelationship(relationship) === 'spouse' && this.member) {
      this.member.marital_status = 'married';
    }

    this.syncMaritalStatusForAge();
  }

  private relationshipGender(relationship: unknown): 'male' | 'female' | null {
    const configured = genderForRelationship(this.relationshipGenderMap, relationship);
    if (configured) {
      return configured;
    }

    if (this.normalizedRelationship(relationship) === 'spouse') {
      return spouseGenderForHead(this.headGender);
    }

    return null;
  }

  private isMemberUnderTwenty(): boolean {
    const age = this.memberAge();
    return age !== null && age < 20;
  }

  private memberAge(): number | null {
    if (!this.member?.date_of_birth) {
      return null;
    }

    if (typeof this.dateService.calculateAge === 'function') {
      return this.dateService.calculateAge(this.member.date_of_birth, 'bs');
    }

    return null;
  }

  private normalizedRelationship(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  }
}
