import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  homeOutline, home, documentTextOutline, documentText,
  refreshOutline, refresh, notificationsOutline, notifications,
  personOutline, person
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { PushNotificationService } from '../services/push-notification.service';
import { ApiService } from '../services/api.service';
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

  constructor(
    private authService: AuthService,
    private pushService: PushNotificationService,
    private api: ApiService
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
      .pipe(
        takeUntil(this.destroy$),
        switchMap((user) => {
          // Reset to visible whenever session changes, then apply beneficiary rule.
          this.hideEnrollmentTab = false;

          if (user?.role !== 'beneficiary') {
            return of(null);
          }

          return this.api.get<ApiResponse>('/dashboard');
        })
      )
      .subscribe({
        next: (res) => {
          if (!res) {
            return;
          }

          const stats = res.data || {};
          // Hide enrollment tab only when the beneficiary has an active policy.
          this.hideEnrollmentTab = (stats.active_policies ?? 0) > 0;
        },
        error: () => {
          // Fail-safe: keep enrollment tab visible instead of locking the user out.
          this.hideEnrollmentTab = false;
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
