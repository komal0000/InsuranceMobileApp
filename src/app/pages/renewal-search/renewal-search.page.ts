import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonIcon, IonSpinner, IonText
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, arrowForwardOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';

@Component({
  selector: 'app-renewal-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonIcon, IonSpinner, IonText
  ],
  templateUrl: './renewal-search.page.html',
  styleUrls: ['./renewal-search.page.scss'],
})
export class RenewalSearchPage {
  searchType: string = 'enrollment_number';
  searchValue = '';
  searching = false;
  results: any[] | null = null;
  canInitiateRenewal = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private toastCtrl: ToastController,
    private authService: AuthService
  ) {
    addIcons({ searchOutline, arrowForwardOutline });
    const role = this.authService.getCurrentUser()?.role || '';
    this.canInitiateRenewal = ['beneficiary', 'enrollment_assistant'].includes(role);
  }

  searchPolicy() {
    if (!this.canInitiateRenewal || !this.searchValue) return;
    this.searching = true;
    this.api.post<ApiResponse>('/renewals/search', {
      search_type: this.searchType,
      search_value: this.searchValue,
    }).subscribe({
      next: (res) => {
        this.searching = false;
        this.results = Array.isArray(res.data) ? res.data : [res.data];
      },
      error: () => { this.searching = false; },
    });
  }

  async initiateRenewal(enrollment: any) {
    if (!this.canInitiateRenewal) return;

    this.api.post<ApiResponse>('/renewals/initiate', { enrollment_id: enrollment.id }).subscribe({
      next: async (res) => {
        if (res.success) {
          const toast = await this.toastCtrl.create({
            message: 'Renewal initiated', duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
          this.router.navigateByUrl(`/renewal-detail/${res.data.id}`);
        }
      },
    });
  }
}
