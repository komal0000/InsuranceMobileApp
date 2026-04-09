import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { AppSyncService } from './app-sync.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private unreadCount$ = new BehaviorSubject<number>(0);
  unreadCount = this.unreadCount$.asObservable();

  constructor(
    private api: ApiService,
    private router: Router,
    private zone: NgZone,
    private syncService: AppSyncService
  ) {}

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.fetchUnreadCount();
      return;
    }

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      this.fetchUnreadCount();
      return;
    }

    await PushNotifications.register();

    // Token received — send to backend
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('FCM token:', token.value);
      this.registerToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('FCM registration error:', error);
    });

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received in foreground:', notification);
      this.zone.run(() => {
        this.fetchUnreadCount();
        this.syncService.emitFromNotificationData(notification.data);
      });
    });

    // User tapped on notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push action performed:', action);
      const data = action.notification.data;
      this.zone.run(() => {
        this.fetchUnreadCount();
        this.syncService.emitFromNotificationData(data);

        if (data?.enrollment_id) {
          this.router.navigate(['/enrollment-detail', data.enrollment_id]);
        } else if (data?.renewal_id) {
          this.router.navigate(['/renewal-detail', data.renewal_id]);
        } else {
          this.router.navigate(['/tabs/notifications']);
        }
      });
    });

    this.fetchUnreadCount();
  }

  private registerToken(token: string): void {
    const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
    this.api.post('/device-tokens', { token, platform }).subscribe({
      error: (err) => console.error('Failed to register FCM token:', err),
    });
  }

  removeToken(token: string): void {
    this.api.delete('/device-tokens', { token }).subscribe({
      error: (err) => console.error('Failed to remove FCM token:', err),
    });
  }

  fetchUnreadCount(): void {
    this.api.get<{ success: boolean; data: { unread_count: number } }>('/notifications/unread-count').subscribe({
      next: (res) => {
        if (res.success) {
          this.unreadCount$.next(res.data.unread_count);
        }
      },
      error: () => {},
    });
  }

  decrementUnread(): void {
    const current = this.unreadCount$.value;
    if (current > 0) {
      this.unreadCount$.next(current - 1);
    }
  }

  resetUnread(): void {
    this.unreadCount$.next(0);
  }
}
