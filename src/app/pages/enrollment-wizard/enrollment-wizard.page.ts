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
import { DateService } from '../../services/date.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { NepaliInputDirective } from '../../directives/nepali-input.directive';
import { BsDatePickerComponent } from '../../components/bs-date-picker/bs-date-picker.component';
import {
  Enrollment, EnrollmentConfig, FamilyMember, HouseholdHead, Step1Data,
  SubsidyResult, SubsidySummary
} from '../../interfaces/enrollment.interface';

const STEP_TITLES = ['Household Info', 'Household Head', 'Family Members', 'Review & Submit'];

const DEFAULT_MEMBER_RELATIONSHIPS: Array<{ value: string; label: string }> = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandson', label: 'Grandson' },
  { value: 'granddaughter', label: 'Granddaughter' },
  { value: 'father_in_law', label: 'Father In Law' },
  { value: 'mother_in_law', label: 'Mother In Law' },
  { value: 'son_in_law', label: 'Son In Law' },
  { value: 'daughter_in_law', label: 'Daughter In Law' },
  { value: 'other', label: 'Other' },
];

const SINGLE_HEAD_BLOCKED_RELATIONSHIPS = ['spouse', 'son', 'daughter'];

@Component({
  selector: 'app-enrollment-wizard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NepaliInputDirective, BsDatePickerComponent,
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
  savingDraft = false;
  submitting = false;
  confirmed = false;
  stepTitles = STEP_TITLES;
  relationshipOptions: Array<{ value: string; label: string }> = [...DEFAULT_MEMBER_RELATIONSHIPS];
  private initialLoad = true;

  // Subsidy data from API
  subsidyResults: SubsidyResult[] = [];
  subsidySummary: SubsidySummary | null = null;


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
  householdHead: HouseholdHead | null = null;
  showMemberForm = false;
  editingMemberId: number | null = null;
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
    document_type: '',
    citizenship_number: '', citizenship_issue_date: '', citizenship_issue_district: '',
    birth_certificate_number: '', birth_certificate_issue_date: '',
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    birth_certificate_front_image: null as File | Blob | null,
    birth_certificate_back_image: null as File | Blob | null,
    target_group_front_image: null as File | Blob | null,
    target_group_back_image: null as File | Blob | null,
  };
  memberPhotoPreview = '';
  memberCitizenshipFrontPreview = '';
  memberCitizenshipBackPreview = '';
  memberBirthCertFrontPreview = '';
  memberBirthCertBackPreview = '';
  memberTargetGroupFrontPreview = '';
  memberTargetGroupBackPreview = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private enrollmentSvc: EnrollmentService,
    private geoSvc: GeoService,
    private dateService: DateService,
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
    const currentBs = this.dateService.getCurrentBs();
    if (!this.headData.date_of_birth) this.headData.date_of_birth = currentBs;
    if (!this.headData.citizenship_issue_date) this.headData.citizenship_issue_date = currentBs;
    this.geoSvc.provinces().subscribe({ next: r => this.provinces = r.data || [] });
    this.enrollmentSvc.getConfig().subscribe({
      next: r => {
        this.config = r.data;
        this.relationshipOptions = this.buildRelationshipOptions((r.data as unknown as { relationship_types?: unknown })?.relationship_types);
      },
    });
    this.loadEnrollment();
  }

  loadEnrollment() {
    this.enrollmentSvc.get(this.enrollmentId).subscribe({
      next: (res) => {
        this.enrollment = res.data;
        this.subsidyResults = res.subsidy_results || [];
        this.subsidySummary = res.subsidy_summary || null;
        this.prefillFromEnrollment(res.data);
      },
    });
  }

  private prefillFromEnrollment(e: Enrollment) {
    // ── Step 1: Location ─────────────────────────────────────────────────────
    if (e.province) {
      this.step1 = {
        province: e.province || '',
        district: e.district || '',
        municipality: e.municipality || '',
        ward_number: String(e.ward_number || ''),
        tole_village: e.tole_village || '',
        full_address: e.full_address || '',
      };
      // Chain geo cascades sequentially so each level's options are present
      // before the bound value is evaluated by ion-select
      this.geoSvc.districts(e.province).subscribe({
        next: r => {
          this.districts = r.data || [];
          if (e.district) {
            this.geoSvc.municipalities(e.province, e.district).subscribe({
              next: r2 => {
                this.municipalities = r2.data || [];
                if (e.municipality) {
                  this.geoSvc.wards(e.province, e.district, e.municipality).subscribe({
                    next: r3 => { this.wards = r3.data || []; },
                  });
                }
              },
            });
          }
        },
      });
      this.updateFullAddress();
    }

    // ── Step 2: Household head ────────────────────────────────────────────────
    const head = e.household_head;
    if (head) {
      this.showNidGate2 = false;
      this.headData = {
        first_name: head.first_name || '', middle_name: head.middle_name || '',
        last_name: head.last_name || '',
        first_name_ne: head.first_name_ne || '', middle_name_ne: head.middle_name_ne || '',
        last_name_ne: head.last_name_ne || '',
        gender: head.gender || '',
        date_of_birth: this.dateService.formatForDisplay(head.date_of_birth, head.date_of_birth_bs) || '',
        blood_group: head.blood_group || '', marital_status: head.marital_status || '',
        mobile_number: head.mobile_number || '', email: head.email || '',
        citizenship_number: head.citizenship_number || '',
        citizenship_issue_date: this.dateService.formatForDisplay(
          head.citizenship_issue_date,
          head.citizenship_issue_date_bs
        ) || '',
        citizenship_issue_district: head.citizenship_issue_district || '',
        is_target_group: !!head.is_target_group,
        target_group_type: head.target_group_type || '',
        target_group_id_number: head.target_group_id_number || '',
        occupation: head.occupation || '', education_level: head.education_level || '',
        photo: null, citizenship_front_image: null, citizenship_back_image: null,
        target_group_front_image: null, target_group_back_image: null,
      };
      this.headPhotoPreview = this.getDocUrl(head, 'photo') || '';
      this.citizenshipFrontPreview = this.getDocUrl(head, 'citizenship_front') || '';
      this.citizenshipBackPreview = this.getDocUrl(head, 'citizenship_back') || '';
      this.targetGroupFrontPreview = this.getDocUrl(head, 'target_group_front') || '';
      this.targetGroupBackPreview = this.getDocUrl(head, 'target_group_back') || '';
    }

    // ── Step 3: Family members ────────────────────────────────────────────────
    this.householdHead = head || null;
    this.members = ((e.family_members || e.members || []) as FamilyMember[]).map(member => ({
      ...member,
      date_of_birth_bs: this.dateService.formatForDisplay(member.date_of_birth, member.date_of_birth_bs) || '',
      citizenship_issue_date_bs: this.dateService.formatForDisplay(
        member.citizenship_issue_date,
        member.citizenship_issue_date_bs
      ) || '',
      birth_certificate_issue_date_bs: this.dateService.formatForDisplay(
        member.birth_certificate_issue_date,
        member.birth_certificate_issue_date_bs
      ) || '',
    }));
    if (this.initialLoad) {
      this.initialLoad = false;
      // Use current_step from the server (1-3). If 4 (submitted), go to step 3.
      const serverStep = Number(e.current_step) || 1;
      this.currentStep = Math.min(serverStep, 3);
    }
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
          this.headData.date_of_birth = this.dateService.formatForDisplay(d.date_of_birth, d.date_of_birth_bs) || '';
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
          this.newMember.date_of_birth = this.dateService.formatForDisplay(d.date_of_birth, d.date_of_birth_bs) || '';
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
      if (!/^\d{10}$/.test(this.headData.mobile_number)) {
        this.showToast('Mobile number must be exactly 10 digits.', 'warning'); return;
      }
      if (this.calculateAge(this.headData.date_of_birth) < 16) {
        this.showToast('Household head must be at least 16 years old.', 'warning'); return;
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
          if (res.success) { this.enrollment = res.data; this.prefillFromEnrollment(res.data); this.currentStep = 3; this.loadEnrollment(); }
        },
        error: () => { this.saving = false; },
      });

    } else if (this.currentStep === 3) {
      this.currentStep = 4;
      this.loadEnrollment();
    }
  }

  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  async saveDraft() {
    this.savingDraft = true;
    if (this.currentStep === 1) {
      if (!this.step1.province || !this.step1.district || !this.step1.municipality || !this.step1.ward_number) {
        this.showToast('Please select at least province, district, municipality and ward to save.', 'warning');
        this.savingDraft = false; return;
      }
      this.enrollmentSvc.saveStep1(this.enrollmentId, this.step1).subscribe({
        next: (res) => {
          this.savingDraft = false;
          if (res.success) { this.enrollment = res.data; this.showToast('Draft saved.', 'success'); }
        },
        error: () => { this.savingDraft = false; this.showToast('Failed to save draft.', 'danger'); },
      });
    } else if (this.currentStep === 2) {
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender ||
          !this.headData.date_of_birth || !this.headData.mobile_number ||
          !this.headData.citizenship_number || !this.headData.citizenship_issue_date ||
          !this.headData.citizenship_issue_district || !this.headData.marital_status) {
        this.showToast('Please fill all required fields before saving.', 'warning');
        this.savingDraft = false; return;
      }
      if (!/^\d{10}$/.test(this.headData.mobile_number)) {
        this.showToast('Mobile number must be exactly 10 digits.', 'warning');
        this.savingDraft = false; return;
      }
      if (this.calculateAge(this.headData.date_of_birth) < 16) {
        this.showToast('Household head must be at least 16 years old.', 'warning');
        this.savingDraft = false; return;
      }
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
          this.savingDraft = false;
          if (res.success) {
            this.enrollment = res.data;
            this.showToast('Draft saved.', 'success');
          }
        },
        error: () => { this.savingDraft = false; this.showToast('Failed to save draft.', 'danger'); },
      });
    } else {
      this.savingDraft = false;
    }
  }

  goToStep(step: number) { if (step < this.currentStep) this.currentStep = step; }


  showAddMember() {
    const currentBs = this.dateService.getCurrentBs();
    this.editingMemberId = null;
    this.newMember = {
      first_name: '', middle_name: '', last_name: '',
      first_name_ne: '', middle_name_ne: '', last_name_ne: '',
      gender: '', date_of_birth: currentBs, relationship: '',
      blood_group: '', marital_status: '', mobile_number: '',
      document_type: '',
      citizenship_number: '', citizenship_issue_date: currentBs, citizenship_issue_district: '',
      birth_certificate_number: '', birth_certificate_issue_date: currentBs,
      is_target_group: false,
      target_group_type: '', target_group_id_number: '',
      photo: null, citizenship_front_image: null, citizenship_back_image: null,
      birth_certificate_front_image: null, birth_certificate_back_image: null,
      target_group_front_image: null, target_group_back_image: null,
    };
    this.memberPhotoPreview = '';
    this.memberCitizenshipFrontPreview = '';
    this.memberCitizenshipBackPreview = '';
    this.memberBirthCertFrontPreview = '';
    this.memberBirthCertBackPreview = '';
    this.memberTargetGroupFrontPreview = '';
    this.memberTargetGroupBackPreview = '';
    this.nidNumberMember = ''; this.nidMessageMember = '';
    this.showNidGateMember = true;
    this.showMemberForm = true;
  }

  editMember(member: FamilyMember) {
    this.editingMemberId = member.id;
    this.showNidGateMember = false;
    this.showMemberForm = true;
    this.nidNumberMember = '';
    this.nidMessageMember = '';

    this.newMember = {
      first_name: member.first_name || '',
      middle_name: member.middle_name || '',
      last_name: member.last_name || '',
      first_name_ne: member.first_name_ne || '',
      middle_name_ne: member.middle_name_ne || '',
      last_name_ne: member.last_name_ne || '',
      gender: member.gender || '',
      date_of_birth: this.dateService.formatForDisplay(member.date_of_birth, member.date_of_birth_bs) || '',
      relationship: member.relationship || member.relationship_type || '',
      blood_group: member.blood_group || '',
      marital_status: member.marital_status || '',
      mobile_number: member.mobile_number || '',
      document_type: member.document_type || '',
      citizenship_number: member.citizenship_number || '',
      citizenship_issue_date: this.dateService.formatForDisplay(
        member.citizenship_issue_date,
        member.citizenship_issue_date_bs
      ) || '',
      citizenship_issue_district: member.citizenship_issue_district || '',
      birth_certificate_number: member.birth_certificate_number || '',
      birth_certificate_issue_date: this.dateService.formatForDisplay(
        member.birth_certificate_issue_date,
        member.birth_certificate_issue_date_bs
      ) || '',
      is_target_group: !!member.is_target_group,
      target_group_type: member.target_group_type || '',
      target_group_id_number: member.target_group_id_number || '',
      photo: null,
      citizenship_front_image: null,
      citizenship_back_image: null,
      birth_certificate_front_image: null,
      birth_certificate_back_image: null,
      target_group_front_image: null,
      target_group_back_image: null,
    };

    this.memberPhotoPreview = this.getDocUrl(member, 'photo') || '';
    this.memberCitizenshipFrontPreview = this.getDocUrl(member, 'citizenship_front') || '';
    this.memberCitizenshipBackPreview = this.getDocUrl(member, 'citizenship_back') || '';
    this.memberBirthCertFrontPreview = this.getDocUrl(member, 'birth_certificate_front') || '';
    this.memberBirthCertBackPreview = this.getDocUrl(member, 'birth_certificate_back') || '';
    this.memberTargetGroupFrontPreview = this.getDocUrl(member, 'target_group_front') || '';
    this.memberTargetGroupBackPreview = this.getDocUrl(member, 'target_group_back') || '';
  }

  cancelAddMember() {
    this.showMemberForm = false;
    this.editingMemberId = null;
  }

  get isEditingMember(): boolean {
    return this.editingMemberId !== null;
  }

  async saveMember() {
    if (!this.newMember.first_name || !this.newMember.last_name ||
        !this.newMember.gender || !this.newMember.date_of_birth || !this.newMember.relationship) {
      this.showToast('Please fill all required member fields.', 'warning'); return;
    }

    const relationship = this.normalizeKey(this.newMember.relationship);
    if (!relationship || !this.availableMemberRelationshipOptions.some(option => option.value === relationship)) {
      this.showToast('Please select a valid relationship.', 'warning'); return;
    }
    if (this.isHeadSingle && SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(relationship)) {
      this.showToast('Spouse, son, and daughter relationships are not allowed when household head marital status is single.', 'warning'); return;
    }
    this.newMember.relationship = relationship;
    if (this.newMember.marital_status) {
      this.newMember.marital_status = this.normalizeKey(this.newMember.marital_status);
    }

    if (this.newMember.mobile_number && !/^\d{10}$/.test(this.newMember.mobile_number)) {
      this.showToast('Mobile number must be exactly 10 digits.', 'warning'); return;
    }
    const docType = this.newMember.document_type || null;
    if (docType === 'citizenship' && this.calculateAge(this.newMember.date_of_birth) < 16) {
      this.showToast('Member with citizenship document must be at least 16 years old.', 'warning'); return;
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

    const saveRequest = this.isEditingMember && this.editingMemberId !== null
      ? this.enrollmentSvc.updateMember(this.enrollmentId, this.editingMemberId, fd)
      : this.enrollmentSvc.addMember(this.enrollmentId, fd);
    const wasEditing = this.isEditingMember;

    saveRequest.subscribe({
      next: async (res) => {
        this.savingMember = false;
        if (res.success) {
          this.showMemberForm = false;
          this.editingMemberId = null;
          this.loadEnrollment();
          this.showToast(wasEditing ? 'Member updated successfully.' : 'Member added successfully.', 'success');
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



  async payAndSubmit() {
    if (!this.confirmed) {
      this.showToast('Please confirm the information is accurate.', 'warning');
      return;
    }
    // Use subsidy-adjusted premium if available, otherwise raw premium
    const amount = this.subsidySummary
      ? this.subsidySummary.final_premium
      : this.premiumBreakdown.total;
    // Navigate to the payment page with enrollment context
    this.router.navigate(['/payment'], {
      queryParams: {
        enrollmentId: this.enrollmentId,
        amount,
        type: 'new',
        policyNumber: this.enrollment?.enrollment_number || '',
      },
    });
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
           'target_group_front_image' | 'target_group_back_image' |
           'birth_certificate_front_image' | 'birth_certificate_back_image'
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
      else if (field === 'citizenship_front_image') this.memberCitizenshipFrontPreview = dataUrl;
      else if (field === 'citizenship_back_image') this.memberCitizenshipBackPreview = dataUrl;
      else if (field === 'birth_certificate_front_image') this.memberBirthCertFrontPreview = dataUrl;
      else if (field === 'birth_certificate_back_image') this.memberBirthCertBackPreview = dataUrl;
      else if (field === 'target_group_front_image') this.memberTargetGroupFrontPreview = dataUrl;
      else if (field === 'target_group_back_image') this.memberTargetGroupBackPreview = dataUrl;
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

  getDocUrl(member: any, type: string): string | null {
    if (!member?.documents?.length) return null;
    const doc = member.documents.find((d: any) => d.document_type === type);
    return doc?.url || null;
  }

  getAge(adDate?: string | null, bsDate?: string | null): number {
    return this.dateService.calculateAgeFromDates(adDate, bsDate);
  }

  displayDate(adDate?: string | null, bsDate?: string | null): string {
    return this.dateService.formatForDisplay(adDate, bsDate) || '—';
  }

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get isHeadSingle(): boolean {
    return this.normalizeKey(this.headData?.marital_status) === 'single';
  }

  get availableMemberRelationshipOptions(): Array<{ value: string; label: string }> {
    if (!this.isHeadSingle) {
      return this.relationshipOptions;
    }

    return this.relationshipOptions.filter(option => !SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(option.value));
  }

  private buildRelationshipOptions(raw: unknown): Array<{ value: string; label: string }> {
    if (Array.isArray(raw)) {
      const options = raw
        .map(item => this.normalizeKey(item))
        .filter((value): value is string => value.length > 0 && value !== 'self')
        .map(value => ({ value, label: this.formatStatus(value) }));
      return this.dedupeRelationshipOptions(options);
    }

    if (raw && typeof raw === 'object') {
      const options = Object.entries(raw as Record<string, unknown>)
        .map(([key, label]) => {
          const value = this.normalizeKey(key);
          if (!value || value === 'self') return null;
          const labelText = typeof label === 'string' && label.trim().length > 0
            ? label.trim()
            : this.formatStatus(value);
          return { value, label: labelText };
        })
        .filter((option): option is { value: string; label: string } => option !== null);
      return this.dedupeRelationshipOptions(options);
    }

    return [...DEFAULT_MEMBER_RELATIONSHIPS];
  }

  private dedupeRelationshipOptions(options: Array<{ value: string; label: string }>): Array<{ value: string; label: string }> {
    if (!options.length) {
      return [...DEFAULT_MEMBER_RELATIONSHIPS];
    }

    const seen = new Set<string>();
    const deduped: Array<{ value: string; label: string }> = [];
    for (const option of options) {
      if (seen.has(option.value)) {
        continue;
      }

      seen.add(option.value);
      deduped.push(option);
    }

    return deduped;
  }

  private normalizeKey(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  private confirmationLabels: Record<string, string> = {
    normal: 'Normal',
    ultra_poor: 'Ultra Poor',
    fchv: 'FCHV',
    senior_citizen: 'Senior Citizen',
    hiv: 'HIV',
    leprosy: 'Leprosy',
    null_disability: 'Null Disability',
    mdr_tb: 'MDR-TB',
  };

  getConfirmationLabel(type: string): string {
    return this.confirmationLabels[type] || type;
  }

  getBenefitLabel(result: SubsidyResult): string {
    if (result.benefit_type === 'full_premium_waiver') return '100% Free';
    if (result.benefit_type === 'percentage_discount') return `${result.benefit_value}% Discount`;
    if (result.benefit_type === 'fixed_discount') return `Rs. ${result.benefit_value} Discount`;
    return result.benefit_type;
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }

  private calculateAge(dob: string): number {
    return this.dateService.calculateAge(dob, 'bs');
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
