import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonIcon,
  IonSpinner, IonRefresher, IonRefresherContent, IonInfiniteScroll,
  IonInfiniteScrollContent, IonButtons, IonButton, ViewDidEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, mailOpenOutline, mailOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AppSyncEvent, AppSyncService } from '../../services/app-sync.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { DateService } from '../../services/date.service';
import { LanguageService } from '../../services/language.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { AppNotification } from '../../interfaces/notification.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonIcon,
    IonSpinner, IonRefresher, IonRefresherContent, IonInfiniteScroll,
    IonInfiniteScrollContent, IonButtons, IonButton,
    LanguageToggleComponent
  ],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit, OnDestroy, ViewDidEnter {
  notifications: AppNotification[] = [];
  page = 1;
  lastPage = 1;
  loading = false;
  private readonly destroy$ = new Subject<void>();
  private hasEnteredView = false;

  constructor(
    private api: ApiService,
    private syncService: AppSyncService,
    private pushService: PushNotificationService,
    private dateService: DateService,
    private languageService: LanguageService
  ) {
    addIcons({ notificationsOutline, mailOpenOutline, mailOutline, checkmarkDoneOutline });
  }

  ngOnInit() {
    this.load();

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (this.shouldRefreshNotifications(event)) {
          this.reloadFirstPage();
        }
      });
  }

  ionViewWillEnter() {
    if (!this.hasEnteredView) {
      this.hasEnteredView = true;
      return;
    }

    this.reloadFirstPage();
  }

  ionViewDidEnter() {
    if (this.hasUnread) {
      this.markAllRead();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  displayDateTime(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatDateTimeForDisplay(adDate, bsDate) || '';
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  private reloadFirstPage(): void {
    this.page = 1;
    this.load();
    this.pushService.fetchUnreadCount();
  }

  private shouldRefreshNotifications(event: AppSyncEvent): boolean {
    return ['global_refresh', 'notification_changed'].includes(event.type);
  }
}
