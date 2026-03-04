import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonIcon, IonSpinner,
  IonToggle, IonLabel, IonAccordion, IonAccordionGroup,
  IonBadge, IonCheckbox
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, personOutline, peopleOutline,
  checkmarkCircleOutline, cameraOutline, addOutline, trashOutline,
  arrowForwardOutline, arrowBackOutline, searchOutline,
  cardOutline, documentTextOutline, cashOutline, createOutline
} from 'ionicons/icons';
import { EnrollmentService } from '../../services/enrollment.service';
import { GeoService } from '../../services/geo.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import {
  Enrollment, EnrollmentConfig, FamilyMember, Step1Data
} from '../../interfaces/enrollment.interface';

const STEP_TITLES = ['Household Info', 'Household Head', 'Family Members', 'Review & Submit'];

@Component({
  selector: 'app-enrollment-wizard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonItem, IonInput, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonIcon, IonSpinner,
    IonToggle, IonLabel, IonAccordion, IonAccordionGroup,
    IonBadge, IonCheckbox
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
  submitting = false;
  confirmed = false;
  stepTitles = STEP_TITLES;


  step1: Step1Data = {
    province: '', district: '', municipality: '', ward_number: '',
    tole_village: '', full_address: '',
  };
  provinces: string[] = [];
  districts: string[] = [];
  municipalities: string[] = [];
  wards: string[] = [];

  showNidGate2 = true;
  nidNumber2 = '';
  nidLooking2 = false;
  nidMessage2 = '';

  headData: any = {
    first_name: '', middle_name: '', last_name: '',
    first_name_ne: '', middle_name_ne: '', last_name_ne: '',
    gender: '', date_of_birth: '', blood_group: '', marital_status: '',
    mobile_number: '', email: '',
    citizenship_number: '', citizenship_issue_date: '', citizenship_issue_district: '',
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    occupation: '', education_level: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    target_group_front_image: null as File | Blob | null,
    target_group_back_image: null as File | Blob | null,
  };
  headPhotoPreview = '';
  citizenshipFrontPreview = '';
  citizenshipBackPreview = '';
  targetGroupFrontPreview = '';
  targetGroupBackPreview = '';

  members: FamilyMember[] = [];
  householdHead: FamilyMember | null = null;
  showMemberForm = false;
  savingMember = false;
  showNidGateMember = true;
  nidNumberMember = '';
  nidLookingMember = false;
  nidMessageMember = '';

  newMember: any = {
    first_name: '', middle_name: '', last_name: '',
    first_name_ne: '', middle_name_ne: '', last_name_ne: '',
    gender: '', date_of_birth: '', relationship: '',
    blood_group: '', marital_status: '', mobile_number: '',
    citizenship_number: '',
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    photo: null as File | Blob | null,
  };
  memberPhotoPreview = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private enrollmentSvc: EnrollmentService,
    private geoSvc: GeoService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      locationOutline, personOutline, peopleOutline,
      checkmarkCircleOutline, cameraOutline, addOutline, trashOutline,
      arrowForwardOutline, arrowBackOutline, searchOutline,
      cardOutline, documentTextOutline, cashOutline, createOutline
    });
  }

  ngOnInit() {
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.geoSvc.provinces().subscribe({ next: r => this.provinces = r.data || [] });
    this.enrollmentSvc.getConfig().subscribe({ next: r => this.config = r.data });
    this.loadEnrollment();
  }

  loadEnrollment() {
    this.enrollmentSvc.get(this.enrollmentId).subscribe({
      next: (res) => { this.enrollment = res.data; this.prefillFromEnrollment(res.data); },
    });
  }

  private prefillFromEnrollment(e: Enrollment) {
    if (e.province) {
      this.step1 = {
        province: e.province || '',
        district: e.district || '',
        municipality: e.municipality || '',
        ward_number: String(e.ward_number || ''),
        tole_village: e.tole_village || '',
        full_address: e.full_address || '',
      };
      if (e.province)     this.onProvinceChange(false);
      if (e.district)     this.onDistrictChange(false);
      if (e.municipality) this.onMunicipalityChange(false);
    }
    const head = e.household_head;
    if (head) {
      this.showNidGate2 = false;
      this.headData = {
        first_name: head.first_name || '', middle_name: head.middle_name || '',
        last_name: head.last_name || '',
        first_name_ne: head.first_name_ne || '', middle_name_ne: head.middle_name_ne || '',
        last_name_ne: head.last_name_ne || '',
        gender: head.gender || '', date_of_birth: head.date_of_birth || '',
        blood_group: head.blood_group || '', marital_status: head.marital_status || '',
        mobile_number: head.mobile_number || '', email: head.email || '',
        citizenship_number: head.citizenship_number || '',
        citizenship_issue_date: head.citizenship_issue_date || '',
        citizenship_issue_district: head.citizenship_issue_district || '',
        is_target_group: !!head.is_target_group,
        target_group_type: head.target_group_type || '',
        target_group_id_number: head.target_group_id_number || '',
        occupation: head.occupation || '', education_level: head.education_level || '',
        photo: null, citizenship_front_image: null, citizenship_back_image: null,
        target_group_front_image: null, target_group_back_image: null,
      };
      this.headPhotoPreview = head.photo || '';
      this.citizenshipFrontPreview = head.citizenship_front_image || '';
      this.citizenshipBackPreview = head.citizenship_back_image || '';
      this.targetGroupFrontPreview = head.target_group_front_image || '';
      this.targetGroupBackPreview = head.target_group_back_image || '';
    }
    const all = e.family_members || e.members || [];
    this.householdHead = all.find(m => m.is_household_head) || head || null;
    this.members = all.filter(m => !m.is_household_head);
    if (e.current_step && e.current_step > 1) this.currentStep = e.current_step;
  }


  onProvinceChange(reset = true) {
    if (reset) {
      this.step1.district = ''; this.step1.municipality = ''; this.step1.ward_number = '';
      this.districts = []; this.municipalities = []; this.wards = [];
    }
    if (this.step1.province) {
      this.geoSvc.districts(this.step1.province).subscribe({ next: r => this.districts = r.data || [] });
    }
    this.updateFullAddress();
  }

  onDistrictChange(reset = true) {
    if (reset) {
      this.step1.municipality = ''; this.step1.ward_number = '';
      this.municipalities = []; this.wards = [];
    }
    if (this.step1.province && this.step1.district) {
      this.geoSvc.municipalities(this.step1.province, this.step1.district)
        .subscribe({ next: r => this.municipalities = r.data || [] });
    }
    this.updateFullAddress();
  }

  onMunicipalityChange(reset = true) {
    if (reset) { this.step1.ward_number = ''; this.wards = []; }
    if (this.step1.province && this.step1.district && this.step1.municipality) {
      this.geoSvc.wards(this.step1.province, this.step1.district, this.step1.municipality)
        .subscribe({ next: r => this.wards = r.data || [] });
    }
    this.updateFullAddress();
  }

  updateFullAddress() {
    const parts = [
      this.step1.tole_village,
      this.step1.ward_number ? `Ward ${this.step1.ward_number}` : '',
      this.step1.municipality, this.step1.district, this.step1.province,
    ].filter(Boolean);
    this.step1.full_address = parts.join(', ');
  }


  lookupNid2() {
    if (!this.nidNumber2.trim()) return;
    this.nidLooking2 = true;
    this.nidMessage2 = '';
    this.enrollmentSvc.nidLookup(this.nidNumber2.trim()).subscribe({
      next: (res) => {
        this.nidLooking2 = false;
        if (res.success && res.data) {
          const d = res.data;
          this.headData.first_name = d.first_name || '';
          this.headData.last_name = d.last_name || '';
          this.headData.gender = d.gender || '';
          this.headData.date_of_birth = d.date_of_birth || '';
          this.headData.mobile_number = d.mobile_number || '';
          this.headData.email = d.email || '';
          this.showNidGate2 = false;
          this.showToast('Record found! Fields have been auto-filled.', 'success');
        } else {
          this.nidMessage2 = 'No record found. Please fill the form manually.';
        }
      },
      error: () => { this.nidLooking2 = false; this.nidMessage2 = 'No record found. Please fill the form manually.'; },
    });
  }

  skipNidGate2() { this.showNidGate2 = false; }

  lookupNidMember() {
    if (!this.nidNumberMember.trim()) return;
    this.nidLookingMember = true;
    this.nidMessageMember = '';
    this.enrollmentSvc.nidLookup(this.nidNumberMember.trim()).subscribe({
      next: (res) => {
        this.nidLookingMember = false;
        if (res.success && res.data) {
          const d = res.data;
          this.newMember.first_name = d.first_name || '';
          this.newMember.last_name = d.last_name || '';
          this.newMember.gender = d.gender || '';
          this.newMember.date_of_birth = d.date_of_birth || '';
          this.newMember.mobile_number = d.mobile_number || '';
          this.showNidGateMember = false;
          this.showToast('Record found! Fields have been auto-filled.', 'success');
        } else {
          this.nidMessageMember = 'No record found. Please fill the form manually.';
        }
      },
      error: () => { this.nidLookingMember = false; this.nidMessageMember = 'No record found. Please fill the form manually.'; },
    });
  }

  skipNidGateMember() { this.showNidGateMember = false; }

  // â”€â”€ Navigation

  async nextStep() {
    if (this.currentStep === 1) {
      if (!this.step1.province || !this.step1.district || !this.step1.municipality || !this.step1.ward_number) {
        this.showToast('Please fill all required location fields.', 'warning'); return;
      }
      this.saving = true;
      this.enrollmentSvc.saveStep1(this.enrollmentId, this.step1).subscribe({
        next: (res) => { this.saving = false; if (res.success) { this.enrollment = res.data; this.currentStep = 2; } },
        error: () => { this.saving = false; },
      });

    } else if (this.currentStep === 2) {
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender ||
          !this.headData.date_of_birth || !this.headData.mobile_number ||
          !this.headData.citizenship_number || !this.headData.marital_status) {
        this.showToast('Please fill all required fields.', 'warning'); return;
      }
      this.saving = true;
      const fd = new FormData();
      Object.keys(this.headData).forEach(key => {
        const val = this.headData[key];
        if (val === null || val === undefined) return;
        if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
        if (val instanceof Blob) { fd.append(key, val, `${key}.jpg`); return; }
        if (val !== '') fd.append(key, String(val));
      });
      this.enrollmentSvc.saveStep2(this.enrollmentId, fd).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) { this.enrollment = res.data; this.prefillFromEnrollment(res.data); this.currentStep = 3; }
        },
        error: () => { this.saving = false; },
      });

    } else if (this.currentStep === 3) {
      this.currentStep = 4;
      this.loadEnrollment();
    }
  }

  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  goToStep(step: number) { if (step < this.currentStep) this.currentStep = step; }


  showAddMember() {
    this.newMember = {
      first_name: '', middle_name: '', last_name: '',
      first_name_ne: '', middle_name_ne: '', last_name_ne: '',
      gender: '', date_of_birth: '', relationship: '',
      blood_group: '', marital_status: '', mobile_number: '',
      citizenship_number: '', is_target_group: false,
      target_group_type: '', target_group_id_number: '', photo: null,
    };
    this.memberPhotoPreview = '';
    this.nidNumberMember = ''; this.nidMessageMember = '';
    this.showNidGateMember = true;
    this.showMemberForm = true;
  }

  cancelAddMember() { this.showMemberForm = false; }

  async addMember() {
    if (!this.newMember.first_name || !this.newMember.last_name ||
        !this.newMember.gender || !this.newMember.date_of_birth || !this.newMember.relationship) {
      this.showToast('Please fill all required member fields.', 'warning'); return;
    }
    this.savingMember = true;
    const fd = new FormData();
    Object.keys(this.newMember).forEach(key => {
      const val = this.newMember[key];
      if (val === null || val === undefined || val === '') return;
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val instanceof Blob) { fd.append(key, val, `${key}.jpg`); return; }
      fd.append(key, String(val));
    });
    this.enrollmentSvc.addMember(this.enrollmentId, fd).subscribe({
      next: async (res) => {
        this.savingMember = false;
        if (res.success) {
          this.members.push(res.data);
          this.showMemberForm = false;
          this.loadEnrollment();
          this.showToast('Member added successfully.', 'success');
        }
      },
      error: () => { this.savingMember = false; },
    });
  }

  async removeMember(member: FamilyMember) {
    const alert = await this.alertCtrl.create({
      header: 'Remove Member',
      message: `Remove ${member.first_name} ${member.last_name} from this enrollment?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove', cssClass: 'danger',
          handler: () => {
            this.enrollmentSvc.removeMember(this.enrollmentId, member.id).subscribe({
              next: () => { this.members = this.members.filter(m => m.id !== member.id); this.loadEnrollment(); },
            });
          },
        },
      ],
    });
    await alert.present();
  }



  async submitEnrollment() {
    if (!this.confirmed) { this.showToast('Please confirm the information is accurate.', 'warning'); return; }
    this.submitting = true;
    this.enrollmentSvc.submit(this.enrollmentId).subscribe({
      next: async () => {
        this.submitting = false;
        this.showToast('Enrollment submitted for verification!', 'success');
        this.router.navigateByUrl('/tabs/enrollments');
      },
      error: () => { this.submitting = false; },
    });
  }

  // â”€â”€ Image capture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async captureImage(
    target: 'head' | 'member',
    field: 'photo' | 'citizenship_front_image' | 'citizenship_back_image' |
           'target_group_front_image' | 'target_group_back_image'
  ) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, width: 1024,
      });
      if (image.dataUrl) this.applyImage(target, field, this.dataUrlToBlob(image.dataUrl), image.dataUrl);
    } catch {
      this.fallbackFileInput(target, field);
    }
  }

  private fallbackFileInput(target: 'head' | 'member', field: string) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpg,image/jpeg,image/png';
    input.onchange = (event: any) => {
      const file: File = event.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { this.showToast('Image must be less than 2MB.', 'danger'); return; }
      const reader = new FileReader();
      reader.onload = () => this.applyImage(target, field as any, file, reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private applyImage(target: 'head' | 'member', field: string, blob: Blob, dataUrl: string) {
    if (target === 'head') {
      this.headData[field] = blob;
      if (field === 'photo') this.headPhotoPreview = dataUrl;
      else if (field === 'citizenship_front_image') this.citizenshipFrontPreview = dataUrl;
      else if (field === 'citizenship_back_image') this.citizenshipBackPreview = dataUrl;
      else if (field === 'target_group_front_image') this.targetGroupFrontPreview = dataUrl;
      else if (field === 'target_group_back_image') this.targetGroupBackPreview = dataUrl;
    } else {
      this.newMember[field] = blob;
      if (field === 'photo') this.memberPhotoPreview = dataUrl;
    }
  }

  // â”€â”€ Computed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  get premiumBreakdown() {
    const cfg = this.config;
    const totalMembers = (this.members?.length || 0) + 1;
    const base = cfg?.base_premium_amount || 3500;
    const baseCount = cfg?.base_premium_member_count || 5;
    const extraRate = cfg?.additional_member_premium || 700;
    const extra = Math.max(0, totalMembers - baseCount) * extraRate;
    return { base, extra, total: base + extra, members: totalMembers };
  }

  getAge(dob: string): number {
    if (!dob) return 0;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
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
