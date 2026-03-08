import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonIcon,
  IonSpinner, IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent, IonButtons, IonButton, ViewDidEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, mailOpenOutline, mailOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { AppNotification } from '../../interfaces/notification.interface';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonIcon,
    IonSpinner, IonRefresher, IonRefresherContent, IonInfiniteScroll,
    IonInfiniteScrollContent, IonButtons, IonButton
  ],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit, ViewDidEnter {
  notifications: AppNotification[] = [];
  page = 1;
  lastPage = 1;
  loading = false;

  constructor(
    private api: ApiService,
    private pushService: PushNotificationService
  ) {
    addIcons({ notificationsOutline, mailOpenOutline, mailOutline, checkmarkDoneOutline });
  }

  ngOnInit() { this.load(); }

  ionViewDidEnter() {
    if (this.hasUnread) {
      this.markAllRead();
    }
  }

  load() {
    this.loading = true;
    this.api.get<ApiResponse<PaginatedData<AppNotification>>>('/notifications', { page: this.page }).subscribe({
      next: (res) => {
        this.notifications = this.page === 1 ? res.data.data : [...this.notifications, ...res.data.data];
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  refresh(event: any) {
    this.page = 1;
    this.api.get<ApiResponse<PaginatedData<AppNotification>>>('/notifications', { page: 1 }).subscribe({
      next: (res) => {
        this.notifications = res.data.data;
        this.lastPage = res.data.last_page;
        this.pushService.fetchUnreadCount();
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

  markAsRead(n: AppNotification) {
    if (!n.is_read) {
      this.api.post<ApiResponse>(`/notifications/${n.id}/read`, {}).subscribe({
        next: () => {
          n.is_read = true;
          this.pushService.decrementUnread();
        },
      });
    }
  }

  markAllRead() {
    this.api.post<ApiResponse>('/notifications/mark-all-read', {}).subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.pushService.resetUnread();
      },
    });
  }

  get hasUnread(): boolean {
    return this.notifications.some(n => !n.is_read);
  }
}
