import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  homeOutline, home, documentTextOutline, documentText,
  refreshOutline, refresh, notificationsOutline, notifications,
  personOutline, person
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { PushNotificationService } from '../services/push-notification.service';
import { ApiService } from '../services/api.service';
import { AppSyncEvent, AppSyncService } from '../services/app-sync.service';
import { ApiResponse } from '../interfaces/api-response.interface';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit, OnDestroy {
  unreadCount = 0;
  hideEnrollmentTab = false;
  private readonly destroy$ = new Subject<void>();
  private enrollmentTabRequestId = 0;

  constructor(
    private authService: AuthService,
    private pushService: PushNotificationService,
    private api: ApiService,
    private syncService: AppSyncService
  ) {
    addIcons({
      homeOutline, home, documentTextOutline, documentText,
      refreshOutline, refresh, notificationsOutline, notifications,
      personOutline, person
    });
  }

  ngOnInit() {
    this.pushService.initialize();

    this.pushService.unreadCount
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user?.role !== 'beneficiary') {
          this.hideEnrollmentTab = false;
          return;
        }

        this.refreshEnrollmentTabVisibility();
      });

    this.syncService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.type === 'notification_changed') {
          this.pushService.fetchUnreadCount();
        }

        if (this.shouldRefreshEnrollmentTab(event)) {
          this.refreshEnrollmentTabVisibility();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private shouldRefreshEnrollmentTab(event: AppSyncEvent): boolean {
    return [
      'global_refresh',
      'enrollment_changed',
      'dashboard_changed',
      'tabs_visibility_changed',
    ].includes(event.type);
  }

  private refreshEnrollmentTabVisibility(): void {
    const user = this.authService.getCurrentUser();
    if (user?.role !== 'beneficiary') {
      this.hideEnrollmentTab = false;
      return;
    }

    const requestId = ++this.enrollmentTabRequestId;

    this.api.get<ApiResponse>('/dashboard')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (requestId !== this.enrollmentTabRequestId) {
            return;
          }

          const stats = res.data || {};
          this.hideEnrollmentTab = (stats.active_policies ?? 0) > 0;
        },
        error: () => {
          if (requestId !== this.enrollmentTabRequestId) {
            return;
          }

          // Fail-safe: keep enrollment tab visible instead of locking the user out.
          this.hideEnrollmentTab = false;
        },
      });
  }
}
