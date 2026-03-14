import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge
} from '@ionic/angular/standalone';
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
export class TabsPage implements OnInit {
  unreadCount = 0;
  hideEnrollmentTab = false;

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
    this.pushService.unreadCount.subscribe(count => {
      this.unreadCount = count;
    });

    // Hide enrollment tab only when the beneficiary has an active policy
    // (draft / pending enrollments should still show the tab)
    const user = this.authService.getCurrentUser();
    if (user?.role === 'beneficiary') {
      this.api.get<ApiResponse>('/dashboard').subscribe({
        next: (res) => {
          const stats = res.data || {};
          this.hideEnrollmentTab = (stats.active_policies ?? 0) > 0;
        },
      });
    }
  }
}
