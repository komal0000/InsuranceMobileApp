import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, home, documentTextOutline, documentText,
  refreshOutline, refresh, notificationsOutline, notifications,
  personOutline, person
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  constructor(private authService: AuthService) {
    addIcons({
      homeOutline, home, documentTextOutline, documentText,
      refreshOutline, refresh, notificationsOutline, notifications,
      personOutline, person
    });
  }
}
