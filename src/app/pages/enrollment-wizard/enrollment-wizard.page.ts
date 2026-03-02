import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonIcon, IonSpinner, IonText, IonImg
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, personOutline, peopleOutline, documentOutline,
  checkmarkCircleOutline, cameraOutline, addOutline, trashOutline,
  arrowForwardOutline, arrowBackOutline, cloudUploadOutline
} from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Enrollment, EnrollmentConfig, FamilyMember, EnrollmentDocument, Step1Data } from '../../interfaces/enrollment.interface';
import { GeoItem } from '../../interfaces/geo.interface';

@Component({
  selector: 'app-enrollment-wizard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonIcon, IonSpinner, IonText, IonImg
  ],
  templateUrl: './enrollment-wizard.page.html',
  styleUrls: ['./enrollment-wizard.page.scss'],
})
export class EnrollmentWizardPage implements OnInit {
  enrollmentId!: number;
  enrollment: Enrollment | null = null;
  config: EnrollmentConfig | null = null;
  currentStep = 1;
  saving = false;
  savingMember = false;
  submitting = false;
  showMemberForm = false;

  stepTitles = ['Location', 'Household Head', 'Family Members', 'Documents', 'Review & Submit'];

  // Step 1
  step1: Step1Data = { province: '', district: '', municipality: '', ward_number: '', tole_village: '', full_address: '' };
  provinces: GeoItem[] = [];
  districts: GeoItem[] = [];
  municipalities: GeoItem[] = [];
  wards: GeoItem[] = [];

  // Step 2
  headData: any = {
    first_name: '', last_name: '', gender: '', date_of_birth: '',
    mobile_number: '', citizenship_number: '', photo: null,
    citizenship_front_image: null, citizenship_back_image: null,
  };
  headPhotoPreview = '';
  citizenshipFrontPreview = '';
  citizenshipBackPreview = '';

  // Step 3
  members: FamilyMember[] = [];
  newMember: any = {
    first_name: '', last_name: '', gender: '', date_of_birth: '',
    relationship_type: '', mobile_number: '',
  };

  // Step 4
  documents: EnrollmentDocument[] = [];
  docType = 'citizenship';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      locationOutline, personOutline, peopleOutline, documentOutline,
      checkmarkCircleOutline, cameraOutline, addOutline, trashOutline,
      arrowForwardOutline, arrowBackOutline, cloudUploadOutline
    });
  }

  ngOnInit() {
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadConfig();
    this.loadProvinces();
    this.loadEnrollment();
  }

  loadConfig() {
    this.api.get<ApiResponse<EnrollmentConfig>>('/enrollment-config').subscribe({
      next: (res) => { this.config = res.data; },
    });
  }

  loadProvinces() {
    this.api.get<ApiResponse<GeoItem[]>>('/geo/provinces').subscribe({
      next: (res) => { this.provinces = res.data || []; },
    });
  }

  loadEnrollment() {
    this.api.get<ApiResponse<Enrollment>>(`/enrollments/${this.enrollmentId}`).subscribe({
      next: (res) => {
        this.enrollment = res.data;
        // Pre-fill step1
        if (this.enrollment.province) {
          this.step1 = {
            province: this.enrollment.province || '',
            district: this.enrollment.district || '',
            municipality: this.enrollment.municipality || '',
            ward_number: this.enrollment.ward_number || '',
            tole_village: this.enrollment.tole_village || '',
            full_address: this.enrollment.full_address || '',
          };
          if (this.step1.province) this.onProvinceChange(false);
          if (this.step1.district) this.onDistrictChange(false);
          if (this.step1.municipality) this.onMunicipalityChange(false);
        }
        // Pre-fill members & documents
        this.members = (this.enrollment.members || []).filter(m => !m.is_household_head);
        this.documents = this.enrollment.documents || [];
        // Pre-fill head fields
        if (this.enrollment.household_head) {
          const hh = this.enrollment.household_head;
          this.headData = {
            first_name: hh.first_name, last_name: hh.last_name,
            gender: hh.gender, date_of_birth: hh.date_of_birth,
            mobile_number: hh.mobile_number || '', citizenship_number: hh.citizenship_number || '',
            photo: null, citizenship_front_image: null, citizenship_back_image: null,
          };
          this.headPhotoPreview = hh.photo || '';
          this.citizenshipFrontPreview = hh.citizenship_front_image || '';
          this.citizenshipBackPreview = hh.citizenship_back_image || '';
        }
      },
    });
  }

  onProvinceChange(resetChild = true) {
    if (resetChild) {
      this.step1.district = '';
      this.step1.municipality = '';
      this.step1.ward_number = '';
      this.districts = [];
      this.municipalities = [];
      this.wards = [];
    }
    if (this.step1.province) {
      this.api.get<ApiResponse<GeoItem[]>>(`/geo/districts/${this.step1.province}`).subscribe({
        next: (res) => { this.districts = res.data || []; },
      });
    }
  }

  onDistrictChange(resetChild = true) {
    if (resetChild) {
      this.step1.municipality = '';
      this.step1.ward_number = '';
      this.municipalities = [];
      this.wards = [];
    }
    if (this.step1.province && this.step1.district) {
      this.api.get<ApiResponse<GeoItem[]>>(`/geo/municipalities/${this.step1.province}/${this.step1.district}`).subscribe({
        next: (res) => { this.municipalities = res.data || []; },
      });
    }
  }

  onMunicipalityChange(resetChild = true) {
    if (resetChild) {
      this.step1.ward_number = '';
      this.wards = [];
    }
    if (this.step1.province && this.step1.district && this.step1.municipality) {
      this.api.get<ApiResponse<GeoItem[]>>(`/geo/wards/${this.step1.province}/${this.step1.district}/${this.step1.municipality}`).subscribe({
        next: (res) => { this.wards = res.data || []; },
      });
    }
  }

  async nextStep() {
    if (this.currentStep === 1) {
      if (!this.step1.province || !this.step1.district || !this.step1.municipality || !this.step1.ward_number) {
        const toast = await this.toastCtrl.create({
          message: 'Please fill in all required location fields', duration: 2000, color: 'warning', position: 'top',
        });
        await toast.present();
        return;
      }
      this.saving = true;
      this.api.post<ApiResponse>(`/enrollments/${this.enrollmentId}/step1`, this.step1).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) this.currentStep++;
        },
        error: () => { this.saving = false; },
      });
    } else if (this.currentStep === 2) {
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender || !this.headData.date_of_birth) {
        const toast = await this.toastCtrl.create({
          message: 'Please fill in all required head fields', duration: 2000, color: 'warning', position: 'top',
        });
        await toast.present();
        return;
      }
      this.saving = true;
      const fd = new FormData();
      Object.keys(this.headData).forEach(key => {
        if (this.headData[key] !== null && this.headData[key] !== '') {
          fd.append(key, this.headData[key]);
        }
      });
      this.api.postFormData<ApiResponse>(`/enrollments/${this.enrollmentId}/step2`, fd).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) {
            this.loadEnrollment();
            this.currentStep++;
          }
        },
        error: () => { this.saving = false; },
      });
    } else if (this.currentStep === 3 || this.currentStep === 4) {
      this.currentStep++;
      if (this.currentStep === 5) this.loadEnrollment();
    }
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  showAddMember() {
    this.newMember = {
      first_name: '', last_name: '', gender: '', date_of_birth: '',
      relationship_type: '', mobile_number: '',
    };
    this.showMemberForm = true;
  }

  async addMember() {
    if (!this.newMember.first_name || !this.newMember.last_name || !this.newMember.gender || !this.newMember.date_of_birth || !this.newMember.relationship_type) {
      const toast = await this.toastCtrl.create({
        message: 'Please fill in all required member fields', duration: 2000, color: 'warning', position: 'top',
      });
      await toast.present();
      return;
    }
    this.savingMember = true;
    const fd = new FormData();
    Object.keys(this.newMember).forEach(key => {
      if (this.newMember[key]) fd.append(key, this.newMember[key]);
    });
    this.api.postFormData<ApiResponse<FamilyMember>>(`/enrollments/${this.enrollmentId}/members`, fd).subscribe({
      next: async (res) => {
        this.savingMember = false;
        if (res.success) {
          this.members.push(res.data);
          this.showMemberForm = false;
          const toast = await this.toastCtrl.create({
            message: 'Member added', duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
        }
      },
      error: () => { this.savingMember = false; },
    });
  }

  async removeMember(member: FamilyMember) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Member',
      message: `Remove ${member.first_name} ${member.last_name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          cssClass: 'danger',
          handler: () => {
            this.api.delete<ApiResponse>(`/enrollments/${this.enrollmentId}/members/${member.id}`).subscribe({
              next: () => {
                this.members = this.members.filter(m => m.id !== member.id);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async captureImage(field: 'photo' | 'citizenship_front' | 'citizenship_back') {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 800,
      });

      if (image.dataUrl) {
        const blob = this.dataUrlToBlob(image.dataUrl);
        if (field === 'photo') {
          this.headData.photo = blob;
          this.headPhotoPreview = image.dataUrl;
        } else if (field === 'citizenship_front') {
          this.headData.citizenship_front_image = blob;
          this.citizenshipFrontPreview = image.dataUrl;
        } else {
          this.headData.citizenship_back_image = blob;
          this.citizenshipBackPreview = image.dataUrl;
        }
      }
    } catch (e) {
      // Camera not available or user cancelled — fallback to file input
      this.triggerFileInput(field);
    }
  }

  triggerFileInput(field: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          if (field === 'photo') {
            this.headData.photo = file;
            this.headPhotoPreview = dataUrl;
          } else if (field === 'citizenship_front') {
            this.headData.citizenship_front_image = file;
            this.citizenshipFrontPreview = dataUrl;
          } else {
            this.headData.citizenship_back_image = file;
            this.citizenshipBackPreview = dataUrl;
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  async captureDocument() {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200,
      });
      if (image.dataUrl) {
        const blob = this.dataUrlToBlob(image.dataUrl);
        this.uploadDocument(blob, 'captured_document.jpg');
      }
    } catch {
      this.pickDocument();
    }
  }

  pickDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) this.uploadDocument(file, file.name);
    };
    input.click();
  }

  uploadDocument(file: Blob, filename: string) {
    const fd = new FormData();
    fd.append('document_type', this.docType);
    fd.append('file', file, filename);
    this.api.postFormData<ApiResponse<EnrollmentDocument>>(`/enrollments/${this.enrollmentId}/documents`, fd).subscribe({
      next: async (res) => {
        if (res.success) {
          this.documents.push(res.data);
          const toast = await this.toastCtrl.create({
            message: 'Document uploaded', duration: 1500, color: 'success', position: 'top',
          });
          await toast.present();
        }
      },
    });
  }

  async removeDocument(doc: EnrollmentDocument) {
    this.api.delete<ApiResponse>(`/enrollments/${this.enrollmentId}/documents/${doc.id}`).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => d.id !== doc.id);
      },
    });
  }

  async submitEnrollment() {
    this.submitting = true;
    this.api.post<ApiResponse>(`/enrollments/${this.enrollmentId}/submit`, {}).subscribe({
      next: async (res) => {
        this.submitting = false;
        const toast = await this.toastCtrl.create({
          message: res.message || 'Enrollment submitted successfully!',
          duration: 2000, color: 'success', position: 'top',
        });
        await toast.present();
        this.router.navigateByUrl('/tabs/enrollments');
      },
      error: () => { this.submitting = false; },
    });
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const byteStr = atob(parts[1]);
    const ab = new ArrayBuffer(byteStr.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
    return new Blob([ab], { type: mime });
  }
}
