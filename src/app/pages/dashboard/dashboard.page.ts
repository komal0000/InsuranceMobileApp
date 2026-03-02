import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonIcon, IonRefresher, IonRefresherContent, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline, shieldCheckmarkOutline, refreshOutline,
  cashOutline, peopleOutline, alertCircleOutline, todayOutline,
  arrowForwardOutline, walletOutline, receiptOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonIcon, IonRefresher, IonRefresherContent, IonSpinner
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  user: User | null = null;
  stats: any = {};
  loading = true;
  isBeneficiary = true;
  canCreateEnrollment = true;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      documentTextOutline, shieldCheckmarkOutline, refreshOutline,
      cashOutline, peopleOutline, alertCircleOutline, todayOutline,
      arrowForwardOutline, walletOutline, receiptOutline
    });
  }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.isBeneficiary = this.user?.role === 'beneficiary';
    this.canCreateEnrollment = ['beneficiary', 'enrollment_assistant', 'admin', 'super_admin']
      .includes(this.user?.role || '');
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.api.get<ApiResponse>('/dashboard').subscribe({
      next: (res) => { this.stats = res.data || {}; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  refresh(event: any) {
    this.api.get<ApiResponse>('/dashboard').subscribe({
      next: (res) => { this.stats = res.data || {}; event.target.complete(); },
      error: () => event.target.complete(),
    });
  }

  navigate(path: string) { this.router.navigateByUrl(path); }

  formatRole(role?: string): string {
    return (role || '').replace(/_/g, ' ');
  }
}
