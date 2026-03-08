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

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {
  unreadCount = 0;

  constructor(
    private authService: AuthService,
    private pushService: PushNotificationService
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
  }
}
