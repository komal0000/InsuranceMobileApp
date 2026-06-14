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
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular/standalone';
import { LanguageService } from '../../../services/language.service';
import { NidLocationOption, NidLookupPayload } from '../../../interfaces/enrollment.interface';

@Component({
  selector: 'app-nid-gate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
  template: `
    <ng-template #content>
      <div class="section-title" *ngIf="title">
        <div class="section-icon" style="background:rgba(0,48,135,0.08)">
          <ion-icon name="card-outline" style="color:#003087"></ion-icon>
        </div>
        <h3>{{ title }}</h3>
      </div>
      <p style="font-size:0.85rem;color:#6c757d;margin:0 0 12px">{{ description }}</p>
      <div class="form-group">
        <ion-item class="form-item">
          <ion-input [label]="t('wizard.nid_number')" labelPlacement="stacked"
                     [placeholder]="t('wizard.nid_placeholder')"
                     [(ngModel)]="nidNumber"
                     (ngModelChange)="nidNumberChange.emit($event)"
                     type="text"
                     inputmode="text"
                     maxlength="32">
          </ion-input>
        </ion-item>
      </div>
      <div class="form-group">
        <ion-item class="form-item">
          <ion-input label="Full name" labelPlacement="stacked"
                     placeholder="Name as in NID"
                     [(ngModel)]="lookupPayload.full_name"
                     type="text"
                     maxlength="150">
          </ion-input>
        </ion-item>
      </div>
      <div class="form-group">
        <ion-item class="form-item">
          <ion-input label="Birthdate" labelPlacement="stacked"
                     [(ngModel)]="lookupPayload.birthdate"
                     type="date">
          </ion-input>
        </ion-item>
      </div>
      <div class="form-grid">
        <ion-item class="form-item">
          <ion-select label="NID province" labelPlacement="stacked"
                      interface="popover"
                      [(ngModel)]="lookupPayload.nid_province_id"
                      (ionChange)="provinceChange.emit($event.detail.value || '')">
            <ion-select-option value="">Select province</ion-select-option>
            <ion-select-option *ngFor="let option of nidProvinces" [value]="option.id">{{ option.label }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item class="form-item">
          <ion-select label="NID district" labelPlacement="stacked"
                      interface="popover"
                      [(ngModel)]="lookupPayload.nid_district_id"
                      (ionChange)="districtChange.emit($event.detail.value || '')">
            <ion-select-option value="">Select district</ion-select-option>
            <ion-select-option *ngFor="let option of nidDistricts" [value]="option.id">{{ option.label }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item class="form-item">
          <ion-select label="NID municipality" labelPlacement="stacked"
                      interface="popover"
                      [(ngModel)]="lookupPayload.nid_municipality_id"
                      (ionChange)="municipalityChange.emit($event.detail.value || '')">
            <ion-select-option value="">Select municipality</ion-select-option>
            <ion-select-option *ngFor="let option of nidMunicipalities" [value]="option.id">{{ option.label }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item class="form-item">
          <ion-select label="NID ward" labelPlacement="stacked"
                      interface="popover"
                      [(ngModel)]="lookupPayload.nid_ward_number">
            <ion-select-option value="">Select ward</ion-select-option>
            <ion-select-option *ngFor="let option of nidWards" [value]="option.id">{{ option.label }}</ion-select-option>
          </ion-select>
        </ion-item>
      </div>
      <div *ngIf="message" style="margin:8px 0;padding:8px 12px;background:#fff3cd;border-radius:6px;font-size:0.82rem;color:#856404">
        {{ message }}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <ion-button expand="block" (click)="verify.emit()" [disabled]="looking || !canVerify()">
          <ion-spinner *ngIf="looking" name="crescent"></ion-spinner>
          <span *ngIf="looking">{{ t('wizard.verifying') }}</span>
          <ion-icon *ngIf="!looking" slot="start" name="search-outline"></ion-icon>
          <span *ngIf="!looking">{{ t('wizard.verify_nid') }}</span>
        </ion-button>
        <ion-button expand="block" fill="outline" color="medium" (click)="skip.emit()">
          {{ skipLabel }}
        </ion-button>
      </div>
    </ng-template>

    <ion-card *ngIf="card; else plain" class="member-form-card">
      <ion-card-content>
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </ion-card-content>
    </ion-card>
    <ng-template #plain>
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </ng-template>
  `,
})
export class NidGateComponent {
  private languageService = inject(LanguageService);

  @Input() title = '';
  @Input() description = '';
  @Input() nidNumber = '';
  @Input() message = '';
  @Input() looking = false;
  @Input() skipLabel = 'Skip';
  @Input() card = false;
  @Input() lookupPayload: NidLookupPayload = {
    national_id: '',
    full_name: '',
    nid_province_id: '',
    nid_district_id: '',
    nid_municipality_id: '',
    nid_ward_number: '',
    birthdate: '',
  };
  @Input() nidProvinces: NidLocationOption[] = [];
  @Input() nidDistricts: NidLocationOption[] = [];
  @Input() nidMunicipalities: NidLocationOption[] = [];
  @Input() nidWards: NidLocationOption[] = [];

  @Output() nidNumberChange = new EventEmitter<string>();
  @Output() provinceChange = new EventEmitter<string>();
  @Output() districtChange = new EventEmitter<string>();
  @Output() municipalityChange = new EventEmitter<string>();
  @Output() verify = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();

  t(key: string): string {
    return this.languageService.t(key);
  }

  canVerify(): boolean {
    return !!this.nidNumber.trim()
      && !!this.lookupPayload.full_name.trim()
      && !!this.lookupPayload.nid_province_id
      && !!this.lookupPayload.nid_district_id
      && !!this.lookupPayload.nid_municipality_id
      && !!this.lookupPayload.nid_ward_number
      && !!this.lookupPayload.birthdate;
  }
}
