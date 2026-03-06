import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { RegisterRequest } from '../../interfaces/user.interface';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { GeoItem } from '../../interfaces/geo.interface';
import { addIcons } from 'ionicons';
import {
  personAddOutline, shieldCheckmarkOutline, arrowBackOutline,
  personOutline, callOutline, cardOutline, calendarOutline,
  locationOutline, mailOutline, lockClosedOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
    IonSpinner, IonIcon
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  formData: RegisterRequest = {
    name: '', name_ne: '', mobile_number: '', national_id: '',
    date_of_birth: '', province: '', district: '', email: '',
    password: '', password_confirmation: '',
  };
  provinces: GeoItem[] = [];
  districts: GeoItem[] = [];
  loading = false;

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      personAddOutline, shieldCheckmarkOutline, arrowBackOutline,
      personOutline, callOutline, cardOutline, calendarOutline,
      locationOutline, mailOutline, lockClosedOutline
    });
  }

  ngOnInit() { this.loadProvinces(); }

  loadProvinces() {
    this.api.get<ApiResponse<GeoItem[]>>('/geo/provinces').subscribe({
      next: (res) => {
        this.provinces = res.data || [];
        console.log('Provinces loaded:', this.provinces);
      },
    });
  }

  onProvinceChange() {
    this.formData.district = '';
    this.districts = [];
    if (this.formData.province) {
      this.api.get<ApiResponse<GeoItem[]>>(`/geo/districts/${this.formData.province}`).subscribe({
        next: (res) => {
           this.districts = res.data || [];
           console.log('Districts loaded:', this.districts);
          },
      });
    }
  }

  async register() {
    if (!this.formData.name || !this.formData.mobile_number || !this.formData.password) {
      const toast = await this.toastCtrl.create({ message: 'Please fill in all required fields', duration: 2000, color: 'warning', position: 'top' });
      await toast.present(); return;
    }
    if (!/^\d{10}$/.test(this.formData.mobile_number)) {
      const toast = await this.toastCtrl.create({ message: 'Mobile number must be exactly 10 digits', duration: 2000, color: 'warning', position: 'top' });
      await toast.present(); return;
    }
    if (this.formData.password !== this.formData.password_confirmation) {
      const toast = await this.toastCtrl.create({ message: 'Passwords do not match', duration: 2000, color: 'danger', position: 'top' });
      await toast.present(); return;
    }
    this.loading = true;
    this.authService.register(this.formData).subscribe({
      next: async (res) => {
        this.loading = false;
        if (res.success) {
          const toast = await this.toastCtrl.create({ message: 'Registration successful!', duration: 1500, color: 'success', position: 'top' });
          await toast.present();
          this.router.navigateByUrl('/tabs/dashboard');
        }
      },
      error: () => { this.loading = false; },
    });
  }
}
