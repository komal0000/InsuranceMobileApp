import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { NepaliInputDirective } from '../../../directives/nepali-input.directive';
import { BsDatePickerComponent } from '../../../components/bs-date-picker/bs-date-picker.component';
import { LanguageService } from '../../../services/language.service';

type HouseholdHeadImageField =
  | 'photo'
  | 'citizenship_front_image'
  | 'citizenship_back_image'
  | 'target_group_front_image'
  | 'target_group_back_image';
type HouseholdHeadSectionGroup = 'identity' | 'additional';

interface HouseholdHeadFormModel {
  [key: string]: any;
  national_id?: string;
  first_name?: string;
  last_name?: string;
  first_name_ne?: string;
  last_name_ne?: string;
  father_name?: string;
  father_name_ne?: string;
  mother_name?: string;
  mother_name_ne?: string;
  grandfather_name?: string;
  grandfather_name_ne?: string;
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
  target_group_id_number?: string;
  profession_id?: string | number;
  qualification_id?: string | number;
}

@Component({
  selector: 'app-household-head-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NepaliInputDirective,
    BsDatePickerComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
  templateUrl: './household-head-form.component.html',
  styleUrls: ['../enrollment-wizard.page.scss'],
})
export class HouseholdHeadFormComponent {
  private firstServicePointValue = '';

  @Input() showHouseholdHeadForm = true;
  @Input() sectionGroup: HouseholdHeadSectionGroup = 'identity';
  @Input({ required: true }) headData!: HouseholdHeadFormModel;
  @Input() nidVerifiedHead = false;
  @Input() headPhotoPreview = '';
  @Input() citizenshipFrontPreview = '';
  @Input() citizenshipBackPreview = '';
  @Input() targetGroupFrontPreview = '';
  @Input() targetGroupBackPreview = '';
  @Input() professionOptions: Array<{ id: number; label: string }> = [];
  @Input() qualificationOptions: Array<{ id: number; label: string }> = [];
  @Input() lockedFields: ReadonlySet<string> = new Set<string>();

  @Input()
  get firstServicePoint(): string {
    return this.firstServicePointValue;
  }
  set firstServicePoint(value: string) {
    this.firstServicePointValue = value;
    this.firstServicePointChange.emit(value);
  }

  @Output() firstServicePointChange = new EventEmitter<string>();
  @Output() capture = new EventEmitter<HouseholdHeadImageField>();

  constructor(private languageService: LanguageService) {}

  isHeadFieldReadonly(field: string): boolean {
    return this.lockedFields.has(field);
  }

  captureImage(_target: 'head', field: HouseholdHeadImageField): void {
    this.capture.emit(field);
  }

  text(key: string, fallback: string): string {
    const translated = this.languageService.t(key);
    return translated === key ? fallback : translated;
  }
}
