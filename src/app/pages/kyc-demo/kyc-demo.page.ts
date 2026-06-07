import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  cameraOutline,
  checkmarkCircleOutline,
  homeOutline,
  peopleOutline,
  personCircleOutline,
  searchOutline,
  sendOutline,
} from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  LegacyImisKycDemoResponse,
  LegacyImisMember,
} from '../../interfaces/legacy-imis.interface';
import { LanguageService } from '../../services/language.service';
import { LegacyImisService } from '../../services/legacy-imis.service';
import { trackByEntity } from '../../utils/track-by.util';

type KycForm = {
  firstname: string;
  lastname: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  current_address: string;
  geolocation: string;
  relationship_code: string;
  profession_id: string;
  education_id: string;
  health_facility_id: string;
  citizenship: string;
  national_id: string;
  f_first_name_en: string;
  f_last_name_en: string;
  m_first_name_en: string;
  m_last_name_en: string;
  gf_first_name_en: string;
  gf_last_name_en: string;
  f_first_name_loc: string;
  f_last_name_loc: string;
  m_first_name_loc: string;
  m_last_name_loc: string;
  gf_first_name_loc: string;
  gf_last_name_loc: string;
  birth_certificate: string;
  photo: string;
};

type KycFormField = keyof KycForm;

interface KycEditableField {
  key: KycFormField;
  labelKey: string;
}

interface KycLockedField {
  key: keyof LegacyImisMember;
  labelKey: string;
}

interface KycDisplayField {
  key: keyof LegacyImisMember;
  label: string;
  value: string;
}

@Component({
  selector: 'app-kyc-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonImg,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './kyc-demo.page.html',
  styleUrls: ['./kyc-demo.page.scss'],
})
export class KycDemoPage implements OnDestroy {
  readonly trackByEntity = trackByEntity;
  private legacyImis = inject(LegacyImisService);
  private languageService = inject(LanguageService);

  householdHeadChfid = '';
  memberChfid = '';
  loading = false;
  updating = false;
  errorMessage = '';
  successMessage = '';
  consentAccepted = false;
  consentAcceptanceId: number | null = null;
  demoData: LegacyImisKycDemoResponse | null = null;
  kycForm: KycForm = this.blankKycForm();
  photoPreview = '';

  readonly editableMemberFields: KycEditableField[] = [
    { key: 'firstname', labelKey: 'kyc_demo.firstname' },
    { key: 'lastname', labelKey: 'kyc_demo.lastname' },
    { key: 'date_of_birth', labelKey: 'kyc_demo.date_of_birth' },
    { key: 'gender', labelKey: 'kyc_demo.gender' },
    { key: 'phone', labelKey: 'kyc_demo.phone' },
    { key: 'email', labelKey: 'kyc_demo.email' },
    { key: 'current_address', labelKey: 'kyc_demo.current_address' },
    { key: 'geolocation', labelKey: 'kyc_demo.geolocation' },
    { key: 'relationship_code', labelKey: 'kyc_demo.relationship_code' },
    { key: 'profession_id', labelKey: 'kyc_demo.profession_id' },
    { key: 'education_id', labelKey: 'kyc_demo.education_id' },
    { key: 'health_facility_id', labelKey: 'kyc_demo.health_facility_id' },
    { key: 'citizenship', labelKey: 'kyc_demo.citizenship' },
    { key: 'national_id', labelKey: 'kyc_demo.national_id' },
    { key: 'f_first_name_en', labelKey: 'kyc_demo.f_first_name_en' },
    { key: 'f_last_name_en', labelKey: 'kyc_demo.f_last_name_en' },
    { key: 'm_first_name_en', labelKey: 'kyc_demo.m_first_name_en' },
    { key: 'm_last_name_en', labelKey: 'kyc_demo.m_last_name_en' },
    { key: 'gf_first_name_en', labelKey: 'kyc_demo.gf_first_name_en' },
    { key: 'gf_last_name_en', labelKey: 'kyc_demo.gf_last_name_en' },
    { key: 'f_first_name_loc', labelKey: 'kyc_demo.f_first_name_loc' },
    { key: 'f_last_name_loc', labelKey: 'kyc_demo.f_last_name_loc' },
    { key: 'm_first_name_loc', labelKey: 'kyc_demo.m_first_name_loc' },
    { key: 'm_last_name_loc', labelKey: 'kyc_demo.m_last_name_loc' },
    { key: 'gf_first_name_loc', labelKey: 'kyc_demo.gf_first_name_loc' },
    { key: 'gf_last_name_loc', labelKey: 'kyc_demo.gf_last_name_loc' },
    { key: 'birth_certificate', labelKey: 'kyc_demo.birth_certificate' },
  ];

  private readonly lockedMemberFieldConfigs: KycLockedField[] = [
    { key: 'chfid', labelKey: 'kyc_demo.member_chfid' },
    { key: 'legacy_id', labelKey: 'kyc_demo.legacy_id' },
    { key: 'uuid', labelKey: 'kyc_demo.uuid' },
    { key: 'family_id', labelKey: 'kyc_demo.family_id' },
    { key: 'is_household_head', labelKey: 'kyc_demo.is_household_head' },
    { key: 'photo_id', labelKey: 'kyc_demo.photo_id' },
    { key: 'card_issued', labelKey: 'kyc_demo.card_issued' },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor() {
    addIcons({
      alertCircleOutline,
      cameraOutline,
      checkmarkCircleOutline,
      homeOutline,
      peopleOutline,
      personCircleOutline,
      searchOutline,
      sendOutline,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchMember(): void {
    const householdHeadChfid = this.householdHeadChfid.trim();
    const memberChfid = this.memberChfid.trim();

    this.clearMessages();

    if (!householdHeadChfid || !memberChfid) {
      this.errorMessage = this.t('kyc_demo.required_chfids');
      return;
    }

    if (!this.consentAccepted) {
      this.errorMessage = this.t('consent.required');
      return;
    }

    this.loading = true;
    this.demoData = null;

    this.legacyImis.fetchKycDemoMember(householdHeadChfid, memberChfid, this.consentAcceptanceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.applyDemoData(res.data);
        },
        error: (error) => {
          this.loading = false;
          this.demoData = null;
          this.errorMessage = this.errorMessageFrom(error, 'kyc_demo.fetch_failed');
        },
      });
  }

  updateKyc(): void {
    const householdHeadChfid = this.householdHeadChfid.trim();
    const memberChfid = (this.demoData?.selected_member?.chfid || this.memberChfid).trim();
    const editableFields = this.trimmedKycForm();

    this.clearMessages();

    if (!this.demoData?.selected_member || !householdHeadChfid || !memberChfid) {
      this.errorMessage = this.t('kyc_demo.fetch_first');
      return;
    }

    if (!this.consentAccepted) {
      this.errorMessage = this.t('consent.required');
      return;
    }

    if (!Object.values(editableFields).some(value => value !== '')) {
      this.errorMessage = this.t('kyc_demo.update_required');
      return;
    }

    this.updating = true;

    this.legacyImis.updateKycDemo({
      household_head_chfid: householdHeadChfid,
      member_chfid: memberChfid,
      ...(this.consentAcceptanceId ? { consent_acceptance_id: this.consentAcceptanceId } : { consent_accepted: true }),
      ...editableFields,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.updating = false;
          this.applyDemoData(res.data);
          this.successMessage = res.message || this.t('kyc_demo.update_success');
        },
        error: (error) => {
          this.updating = false;
          this.errorMessage = this.errorMessageFrom(error, 'kyc_demo.update_failed');
        },
      });
  }

  memberName(member?: LegacyImisMember | null): string {
    const name = [member?.first_name, member?.last_name].filter(Boolean).join(' ').trim();
    return name || this.t('common.not_available');
  }

  display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return this.t('common.not_available');
    }

    if (typeof value === 'boolean') {
      return this.t(value ? 'common.yes' : 'common.no');
    }

    return String(value);
  }

  async captureKycPhoto(): Promise<void> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 1024,
      });

      if (image.dataUrl) {
        this.applyKycPhotoDataUrl(image.dataUrl);
      }
    } catch {
      this.fallbackKycPhotoInput();
    }
  }

  applyKycPhotoDataUrl(dataUrl: string): void {
    this.kycForm.photo = dataUrl;
    this.photoPreview = dataUrl;
  }

  get lockedMemberFields(): KycDisplayField[] {
    const member = this.demoData?.selected_member;

    return this.lockedMemberFieldConfigs.map(field => ({
      key: field.key,
      label: this.t(field.labelKey),
      value: this.display(member?.[field.key]),
    }));
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private applyDemoData(data: LegacyImisKycDemoResponse | null | undefined): void {
    if (!data) {
      this.demoData = null;
      return;
    }

    this.demoData = data;
    this.consentAcceptanceId = data.consent_acceptance_id ?? this.consentAcceptanceId;
    this.householdHeadChfid = data.household_head_chfid || this.householdHeadChfid.trim();
    this.memberChfid = data.selected_member?.chfid || data.member_chfid || this.memberChfid.trim();
    this.kycForm = this.formFromMember(data.selected_member);
    this.photoPreview = this.kycForm.photo;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private errorMessageFrom(error: any, fallbackKey: string): string {
    const validationErrors = error?.error?.errors;
    const firstValidation = validationErrors
      ? Object.values(validationErrors).reduce<string | null>((found, value) => {
          if (found) return found;
          if (typeof value === 'string') return value;
          if (Array.isArray(value)) {
            return value.find((item): item is string => typeof item === 'string') || null;
          }
          return null;
        }, null)
      : null;
    const message = firstValidation || error?.error?.message;

    return this.languageService.translateText(message) || this.t(fallbackKey);
  }

  private blankKycForm(): KycForm {
    return {
      firstname: '',
      lastname: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      email: '',
      current_address: '',
      geolocation: '',
      relationship_code: '',
      profession_id: '',
      education_id: '',
      health_facility_id: '',
      citizenship: '',
      national_id: '',
      f_first_name_en: '',
      f_last_name_en: '',
      m_first_name_en: '',
      m_last_name_en: '',
      gf_first_name_en: '',
      gf_last_name_en: '',
      f_first_name_loc: '',
      f_last_name_loc: '',
      m_first_name_loc: '',
      m_last_name_loc: '',
      gf_first_name_loc: '',
      gf_last_name_loc: '',
      birth_certificate: '',
      photo: '',
    };
  }

  private formFromMember(member?: LegacyImisMember | null): KycForm {
    return {
      firstname: this.formValue(member?.first_name),
      lastname: this.formValue(member?.last_name),
      date_of_birth: this.formValue(member?.date_of_birth),
      gender: this.formValue(member?.gender),
      phone: this.formValue(member?.phone),
      email: this.formValue(member?.email),
      current_address: this.formValue(member?.current_address),
      geolocation: this.formValue(member?.geolocation),
      relationship_code: this.formValue(member?.relationship_code),
      profession_id: this.formValue(member?.profession_id),
      education_id: this.formValue(member?.education_id),
      health_facility_id: this.formValue(member?.health_facility_id),
      citizenship: this.formValue(member?.citizenship),
      national_id: this.formValue(member?.national_id),
      f_first_name_en: this.formValue(member?.f_first_name_en),
      f_last_name_en: this.formValue(member?.f_last_name_en),
      m_first_name_en: this.formValue(member?.m_first_name_en),
      m_last_name_en: this.formValue(member?.m_last_name_en),
      gf_first_name_en: this.formValue(member?.gf_first_name_en),
      gf_last_name_en: this.formValue(member?.gf_last_name_en),
      f_first_name_loc: this.formValue(member?.f_first_name_loc),
      f_last_name_loc: this.formValue(member?.f_last_name_loc),
      m_first_name_loc: this.formValue(member?.m_first_name_loc),
      m_last_name_loc: this.formValue(member?.m_last_name_loc),
      gf_first_name_loc: this.formValue(member?.gf_first_name_loc),
      gf_last_name_loc: this.formValue(member?.gf_last_name_loc),
      birth_certificate: this.formValue(member?.birth_certificate),
      photo: '',
    };
  }

  private trimmedKycForm(): KycForm {
    return {
      firstname: this.kycForm.firstname.trim(),
      lastname: this.kycForm.lastname.trim(),
      date_of_birth: this.kycForm.date_of_birth.trim(),
      gender: this.kycForm.gender.trim(),
      phone: this.kycForm.phone.trim(),
      email: this.kycForm.email.trim(),
      current_address: this.kycForm.current_address.trim(),
      geolocation: this.kycForm.geolocation.trim(),
      relationship_code: this.kycForm.relationship_code.trim(),
      profession_id: this.kycForm.profession_id.trim(),
      education_id: this.kycForm.education_id.trim(),
      health_facility_id: this.kycForm.health_facility_id.trim(),
      citizenship: this.kycForm.citizenship.trim(),
      national_id: this.kycForm.national_id.trim(),
      f_first_name_en: this.kycForm.f_first_name_en.trim(),
      f_last_name_en: this.kycForm.f_last_name_en.trim(),
      m_first_name_en: this.kycForm.m_first_name_en.trim(),
      m_last_name_en: this.kycForm.m_last_name_en.trim(),
      gf_first_name_en: this.kycForm.gf_first_name_en.trim(),
      gf_last_name_en: this.kycForm.gf_last_name_en.trim(),
      f_first_name_loc: this.kycForm.f_first_name_loc.trim(),
      f_last_name_loc: this.kycForm.f_last_name_loc.trim(),
      m_first_name_loc: this.kycForm.m_first_name_loc.trim(),
      m_last_name_loc: this.kycForm.m_last_name_loc.trim(),
      gf_first_name_loc: this.kycForm.gf_first_name_loc.trim(),
      gf_last_name_loc: this.kycForm.gf_last_name_loc.trim(),
      birth_certificate: this.kycForm.birth_certificate.trim(),
      photo: this.kycForm.photo.trim(),
    };
  }

  private fallbackKycPhotoInput(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => this.applyKycPhotoDataUrl(String(reader.result || ''));
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private formValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }
}
