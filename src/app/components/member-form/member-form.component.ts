import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { LanguageService } from '../../services/language.service';

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
        <ion-input [label]="text('wizard.first_name_required', 'First Name *')" labelPlacement="stacked" [(ngModel)]="member.first_name"></ion-input>
      </ion-item>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.last_name_required', 'Last Name *')" labelPlacement="stacked" [(ngModel)]="member.last_name"></ion-input>
      </ion-item>

      <p class="form-section-title">{{ text('wizard.nepali_name', 'Nepali Name') }}</p>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.first_name_ne', 'First Name Nepali')" labelPlacement="stacked" appNepaliInput [(ngModel)]="member.first_name_ne"></ion-input>
      </ion-item>
      <ion-item class="form-item">
        <ion-input [label]="text('wizard.last_name_ne', 'Last Name Nepali')" labelPlacement="stacked" appNepaliInput [(ngModel)]="member.last_name_ne"></ion-input>
      </ion-item>

      <p class="form-section-title">{{ text('wizard.personal_details', 'Personal Details') }}</p>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.gender_required', 'Gender *')" labelPlacement="stacked" [(ngModel)]="member.gender">
          <ion-select-option value="male">{{ text('gender.male', 'Male') }}</ion-select-option>
          <ion-select-option value="female">{{ text('gender.female', 'Female') }}</ion-select-option>
          <ion-select-option value="other">{{ text('gender.other', 'Other') }}</ion-select-option>
        </ion-select>
      </ion-item>
      <app-bs-date-picker
        [(ngModel)]="member.date_of_birth"
        [label]="text('wizard.date_of_birth_required', 'Date of Birth *')"
        [placeholder]="text('common.select_bs_date', 'Select BS date')">
      </app-bs-date-picker>
      <ion-item class="form-item">
        <ion-select [label]="text('wizard.relationship_required', 'Relationship to Head *')" labelPlacement="stacked" [(ngModel)]="member.relationship">
          <ion-select-option *ngFor="let option of relationshipOptions" [value]="option.value">
            {{ relationshipLabel(option.value) }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <p *ngIf="isHeadSingle" class="helper-text">
        {{ text('wizard.relationship_single_notice', 'Spouse, son, and daughter options are hidden because household head marital status is single.') }}
      </p>
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
        <ion-select [label]="text('wizard.marital_status', 'Marital Status')" labelPlacement="stacked" [(ngModel)]="member.marital_status">
          <ion-select-option value="single">{{ text('marital.single', 'Single') }}</ion-select-option>
          <ion-select-option value="married">{{ text('marital.married', 'Married') }}</ion-select-option>
          <ion-select-option value="divorced">{{ text('marital.divorced', 'Divorced') }}</ion-select-option>
          <ion-select-option value="widowed">{{ text('marital.widowed', 'Widowed') }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item class="form-item">
        <ion-input [label]="text('profile.mobile_number', 'Mobile Number')" labelPlacement="stacked" type="tel" maxlength="10" minlength="10" [(ngModel)]="member.mobile_number"></ion-input>
      </ion-item>
      <ion-item class="form-item" *ngIf="showEmail">
        <ion-input [label]="text('profile.email', 'Email')" labelPlacement="stacked" type="email" [(ngModel)]="member.email"></ion-input>
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
          <ion-input [label]="text('wizard.citizenship_number', 'Citizenship Number')" labelPlacement="stacked" [(ngModel)]="member.citizenship_number"></ion-input>
        </ion-item>
        <app-bs-date-picker
          [(ngModel)]="member.citizenship_issue_date"
          [label]="text('wizard.citizenship_issue_date', 'Issue Date')"
          [placeholder]="text('common.select_bs_date', 'Select BS date')">
        </app-bs-date-picker>
        <ion-item class="form-item">
          <ion-input [label]="text('wizard.citizenship_issue_district', 'Issue District')" labelPlacement="stacked" [(ngModel)]="member.citizenship_issue_district"></ion-input>
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
export class MemberFormComponent {
  @Input({ required: true }) member!: MemberFormModel;
  @Input() relationshipOptions: Array<{ value: string; label: string }> = [];
  @Input() isHeadSingle = false;
  @Input() isEditing = false;
  @Input() saving = false;
  @Input() showEmail = false;
  @Input() disableSaveWhenInvalid = false;
  @Input() photoPreview = '';
  @Input() citizenshipFrontPreview = '';
  @Input() citizenshipBackPreview = '';
  @Input() birthCertificateFrontPreview = '';

  @Output() capture = new EventEmitter<MemberImageField>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private languageService: LanguageService) {}

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
}
