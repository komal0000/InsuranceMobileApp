import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
} from '@ionic/angular/standalone';

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
          <ion-input label="NID Number" labelPlacement="stacked"
                     placeholder="Enter NID number (min. 8 digits)"
                     [(ngModel)]="nidNumber"
                     (ngModelChange)="nidNumberChange.emit($event)"
                     type="text"
                     inputmode="numeric">
          </ion-input>
        </ion-item>
      </div>
      <div *ngIf="message" style="margin:8px 0;padding:8px 12px;background:#fff3cd;border-radius:6px;font-size:0.82rem;color:#856404">
        {{ message }}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <ion-button expand="block" (click)="verify.emit()" [disabled]="looking || !nidNumber.trim()">
          <ion-spinner *ngIf="looking" name="crescent"></ion-spinner>
          <span *ngIf="looking">Verifying...</span>
          <ion-icon *ngIf="!looking" slot="start" name="search-outline"></ion-icon>
          <span *ngIf="!looking">Verify NID</span>
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
  @Input() title = '';
  @Input() description = '';
  @Input() nidNumber = '';
  @Input() message = '';
  @Input() looking = false;
  @Input() skipLabel = 'Skip';
  @Input() card = false;

  @Output() nidNumberChange = new EventEmitter<string>();
  @Output() verify = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();
}
