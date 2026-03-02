import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline, documentTextOutline, calendarOutline, peopleOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../interfaces/api-response.interface';

@Component({
  selector: 'app-my-policy',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
  ],
  templateUrl: './my-policy.page.html',
  styleUrls: ['./my-policy.page.scss'],
})
export class MyPolicyPage implements OnInit {
  policy: any = null;
  history: any[] = [];
  loading = true;

  constructor(private api: ApiService) {
    addIcons({ shieldCheckmarkOutline, documentTextOutline, calendarOutline, peopleOutline });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.get<ApiResponse>('/my-policy').subscribe({
      next: (res) => {
        const data = res.data || {};
        this.policy = data.policy || data;
        this.history = data.history || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  refresh(event: any) {
    this.api.get<ApiResponse>('/my-policy').subscribe({
      next: (res) => {
        const data = res.data || {};
        this.policy = data.policy || data;
        this.history = data.history || [];
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }
}
