import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonIcon,
  IonSpinner, IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { walletOutline, cashOutline, calendarOutline, documentTextOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { DateService } from '../../services/date.service';
import { ApiResponse } from '../../interfaces/api-response.interface';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonIcon,
    IonSpinner, IonRefresher, IonRefresherContent, IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './my-payments.page.html',
  styleUrls: ['./my-payments.page.scss'],
})
export class MyPaymentsPage implements OnInit {
  payments: any[] = [];
  loading = true;
  page = 1;
  hasMore = true;

  constructor(
    private api: ApiService,
    private dateService: DateService
  ) {
    addIcons({ walletOutline, cashOutline, calendarOutline, documentTextOutline });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = this.page === 1;
    this.api.get<ApiResponse>('/my-payments', { page: this.page }).subscribe({
      next: (res) => {
        const data = res.data;
        const items: any[] = Array.isArray(data) ? data : (data?.data ?? []);
        this.payments = this.page === 1 ? items : [...this.payments, ...items];
        this.hasMore = data?.last_page ? this.page < data.last_page : false;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  refresh(event: any) {
    this.page = 1;
    this.api.get<ApiResponse>('/my-payments', { page: 1 }).subscribe({
      next: (res) => {
        const data = res.data;
        this.payments = Array.isArray(data) ? data : (data?.data ?? []);
        event.target.complete();
      },
      error: () => event.target.complete(),
    });
  }

  loadMore(event: any) {
    this.page++;
    this.load();
    event.target.complete();
  }

  statusColor(status: string): string {
    switch (status) {
      case 'paid':    return 'success';
      case 'failed':  return 'danger';
      default:        return 'warning';
    }
  }

  displayDateTime(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatDateTimeForDisplay(adDate, bsDate) || '';
  }
}
