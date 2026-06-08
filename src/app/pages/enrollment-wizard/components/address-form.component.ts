import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonToggle,
} from '@ionic/angular/standalone';
import { AuthenticatedImageDirective } from '../../../directives/authenticated-image.directive';
import { PermanentAddressSource, Step1Data } from '../../../interfaces/enrollment.interface';
import { LanguageService } from '../../../services/language.service';
import { trackByEntity } from '../../../utils/track-by.util';

type HeadAddressImageField = 'basai_sarai_front' | 'basai_sarai_back';
type PermanentAddressSourceChoice = PermanentAddressSource | '';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuthenticatedImageDirective,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonToggle,
  ],
  templateUrl: './address-form.component.html',
  styleUrls: ['../enrollment-wizard.page.scss'],
})
export class AddressFormComponent {
  readonly trackByEntity = trackByEntity;
  private languageService = inject(LanguageService);

  private temporarySameAsPermanentValue = false;

  @Input({ required: true }) step1!: Step1Data;
  @Input() provinces: string[] = [];
  @Input() districts: string[] = [];
  @Input() municipalities: string[] = [];
  @Input() wards: string[] = [];
  @Input({ required: true }) temporaryAddress!: Step1Data;
  @Input() temporaryDistricts: string[] = [];
  @Input() temporaryMunicipalities: string[] = [];
  @Input() temporaryWards: string[] = [];
  @Input() basaiSaraiFrontPreview = '';
  @Input() basaiSaraiBackPreview = '';
  @Input() lockedFields: ReadonlySet<string> = new Set<string>();
  @Input() nidVerifiedHead = false;
  @Input() nidPermanentAddress: Step1Data | null = null;
  @Input() canUseNidPermanentAddress = false;

  @Input() permanentAddressSource: PermanentAddressSourceChoice = 'citizenship';

  @Input()
  get temporarySameAsPermanent(): boolean {
    return this.temporarySameAsPermanentValue;
  }
  set temporarySameAsPermanent(value: boolean) {
    this.temporarySameAsPermanentValue = value;
    this.temporarySameAsPermanentChange.emit(value);
  }

  @Output() temporarySameAsPermanentChange = new EventEmitter<boolean>();
  @Output() permanentAddressSourceChange = new EventEmitter<PermanentAddressSourceChoice>();
  @Output() provinceChange = new EventEmitter<void>();
  @Output() districtChange = new EventEmitter<void>();
  @Output() municipalityChange = new EventEmitter<void>();
  @Output() fullAddressChange = new EventEmitter<void>();
  @Output() copyPermanent = new EventEmitter<void>();
  @Output() temporaryProvinceChange = new EventEmitter<void>();
  @Output() temporaryDistrictChange = new EventEmitter<void>();
  @Output() temporaryMunicipalityChange = new EventEmitter<void>();
  @Output() temporaryFullAddressChange = new EventEmitter<void>();
  @Output() capture = new EventEmitter<HeadAddressImageField>();

  isHeadFieldReadonly(field: string): boolean {
    return this.lockedFields.has(field);
  }

  hasEditablePermanentAddressFields(): boolean {
    return ['province', 'district', 'municipality', 'ward_number', 'tole_village']
      .some(field => !this.isHeadFieldReadonly(field));
  }

  isConfirmedNidAddressSource(): boolean {
    return this.nidVerifiedHead && this.canUseNidPermanentAddress && this.permanentAddressSource === 'nid';
  }

  hasVerifiedNidAddressOption(): boolean {
    return this.nidVerifiedHead && this.canUseNidPermanentAddress;
  }

  shouldShowNidAddressOption(): boolean {
    return this.hasVerifiedNidAddressOption();
  }

  shouldShowCitizenshipAddressOption(): boolean {
    return !this.hasVerifiedNidAddressOption();
  }

  shouldShowMigrationAddressOption(): boolean {
    return true;
  }

  shouldShowPermanentAddressFields(): boolean {
    return this.permanentAddressSource !== 'nid' && this.hasEditablePermanentAddressFields();
  }

  onPermanentAddressSourceChange(value: unknown): void {
    this.permanentAddressSourceChange.emit((value || '') as PermanentAddressSourceChoice);
  }

  onProvinceChange(): void {
    this.provinceChange.emit();
  }

  onDistrictChange(): void {
    this.districtChange.emit();
  }

  onMunicipalityChange(): void {
    this.municipalityChange.emit();
  }

  updateFullAddress(): void {
    this.fullAddressChange.emit();
  }

  copyPermanentToTemporary(): void {
    this.copyPermanent.emit();
  }

  onTemporaryProvinceChange(): void {
    this.temporaryProvinceChange.emit();
  }

  onTemporaryDistrictChange(): void {
    this.temporaryDistrictChange.emit();
  }

  onTemporaryMunicipalityChange(): void {
    this.temporaryMunicipalityChange.emit();
  }

  updateTemporaryFullAddress(): void {
    this.temporaryFullAddressChange.emit();
  }

  captureImage(_target: 'head', field: HeadAddressImageField): void {
    this.capture.emit(field);
  }

  text(key: string, fallback: string): string {
    const translated = this.languageService.t(key);
    return translated === key ? fallback : translated;
  }
}
