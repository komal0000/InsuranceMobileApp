import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton,
  IonCard, IonCardContent, IonIcon, IonSpinner,
  IonBadge
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, personOutline, peopleOutline,
  checkmarkCircleOutline, cameraOutline, trashOutline,
  arrowForwardOutline, arrowBackOutline, searchOutline,
  cardOutline, documentTextOutline, createOutline
} from 'ionicons/icons';
import { EnrollmentService } from '../../services/enrollment.service';
import { GeoService } from '../../services/geo.service';
import { DateService } from '../../services/date.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { LanguageToggleComponent } from '../../components/language-toggle/language-toggle.component';
import { MemberFormComponent } from '../../components/member-form/member-form.component';
import { AddressFormComponent } from './components/address-form.component';
import { HouseholdHeadFormComponent } from './components/household-head-form.component';
import { NidGateComponent } from './components/nid-gate.component';
import { ReviewSubmitComponent } from './components/review-submit.component';
import {
  Enrollment, EnrollmentConfig, FamilyMember, HouseholdHead, NidLookupData, Step1Data,
  SubsidyResult, SubsidySummary
} from '../../interfaces/enrollment.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const STEP_TITLE_KEYS = ['wizard.step1', 'wizard.step2', 'wizard.step3'];

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
    CommonModule, FormsModule,
    AddressFormComponent, HouseholdHeadFormComponent, MemberFormComponent, NidGateComponent, ReviewSubmitComponent,
    LanguageToggleComponent,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton,
    IonCard, IonCardContent, IonIcon, IonSpinner,
    IonBadge
  ],
  templateUrl: './enrollment-wizard.page.html',
  styleUrls: ['./enrollment-wizard.page.scss'],
})
export class EnrollmentWizardPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  enrollmentId!: number;
  enrollment: Enrollment | null = null;
  config: EnrollmentConfig | null = null;
  currentStep = 1;
  saving = false;
  savingDraft = false;
  submitting = false;
  confirmed = false;
  stepTitles = [...STEP_TITLE_KEYS];
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
  temporarySameAsPermanent = true;
  temporaryAddress: Step1Data = {
    province: '', district: '', municipality: '', ward_number: '',
    tole_village: '', full_address: '',
  };
  temporaryDistricts: string[] = [];
  temporaryMunicipalities: string[] = [];
  temporaryWards: string[] = [];
  firstServicePoint = '';
  professionOptions: Array<{ id: number; label: string }> = [
    { id: 1, label: 'Government' },
    { id: 2, label: 'Self Employed' },
    { id: 3, label: 'Salaried' },
    { id: 4, label: 'House Wife' },
    { id: 5, label: 'Agriculture' },
    { id: 6, label: 'Other' },
    { id: 7, label: 'Foreign employment' },
  ];
  qualificationOptions: Array<{ id: number; label: string }> = [
    { id: 1, label: 'Nursery' },
    { id: 2, label: 'Primary' },
    { id: 3, label: 'Secondary' },
    { id: 4, label: 'University' },
    { id: 5, label: 'Post Graduate' },
    { id: 6, label: 'PHD' },
    { id: 7, label: 'Other' },
    { id: 8, label: 'Un-Educated' },
  ];
  nidLockedHeadFields = new Set<string>();

  showNidGate2 = true;
  nidNumber2 = '';
  nidLooking2 = false;
  nidMessage2 = '';

  headData: any = {
    national_id: '',
    first_name: '', last_name: '',
    first_name_ne: '', last_name_ne: '',
    father_name: '', father_name_ne: '',
    mother_name: '', mother_name_ne: '',
    grandfather_name: '', grandfather_name_ne: '',
    gender: '', date_of_birth: '', blood_group: '', marital_status: '',
    mobile_number: '', email: '',
    citizenship_number: '', citizenship_issue_date: '', citizenship_issue_district: '',
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    occupation: '', education_level: '', profession_id: '', qualification_id: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    target_group_front_image: null as File | Blob | null,
    target_group_back_image: null as File | Blob | null,
    basai_sarai_front: null as File | Blob | null,
    basai_sarai_back: null as File | Blob | null,
  };
  headPhotoPreview = '';
  citizenshipFrontPreview = '';
  citizenshipBackPreview = '';
  targetGroupFrontPreview = '';
  targetGroupBackPreview = '';
  basaiSaraiFrontPreview = '';
  basaiSaraiBackPreview = '';

  members: FamilyMember[] = [];
  householdHead: HouseholdHead | null = null;
  showMemberForm = true;
  editingMemberId: number | null = null;
  savingMember = false;
  showNidGateMember = true;
  nidNumberMember = '';
  nidLookingMember = false;
  nidMessageMember = '';
  nidVerifiedHead = false;
  nidVerifiedMember = false;

  newMember: any = {
    first_name: '', last_name: '',
    first_name_ne: '', last_name_ne: '',
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
    private languageService: LanguageService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      locationOutline, personOutline, peopleOutline,
      checkmarkCircleOutline, cameraOutline, trashOutline,
      arrowForwardOutline, arrowBackOutline, searchOutline,
      cardOutline, documentTextOutline, createOutline
    });
    this.refreshStepTitles();
  }

  ngOnInit() {
    this.languageService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshStepTitles());
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('id'));
    const currentBs = this.dateService.getCurrentBs();
    if (!this.headData.date_of_birth) this.headData.date_of_birth = currentBs;
    if (!this.headData.citizenship_issue_date) this.headData.citizenship_issue_date = currentBs;
    this.applyRegisteredMobileNumber();
    this.resetMemberForm();
    this.geoSvc.provinces().subscribe({ next: r => this.provinces = r.data || [] });
    this.enrollmentSvc.getConfig().subscribe({
      next: r => {
        this.config = r.data;
        this.relationshipOptions = this.buildRelationshipOptions((r.data as unknown as { relationship_types?: unknown })?.relationship_types);
        this.professionOptions = this.optionRecordToArray(r.data?.profession_options, this.professionOptions);
        this.qualificationOptions = this.optionRecordToArray(r.data?.qualification_options, this.qualificationOptions);
      },
    });
    this.loadEnrollment();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    this.temporarySameAsPermanent = e.temporary_same_as_permanent ?? true;
    this.firstServicePoint = e.first_service_point || '';
    this.temporaryAddress = {
      province: e.temporary_province || '',
      district: e.temporary_district || '',
      municipality: e.temporary_municipality || '',
      ward_number: String(e.temporary_ward_number || ''),
      tole_village: e.temporary_tole_village || '',
      full_address: e.temporary_full_address || '',
    };
    this.loadTemporaryGeoOptions(this.temporaryAddress);

    // ── Step 2: Household head ────────────────────────────────────────────────
    const head = e.household_head;
    if (head) {
      this.showNidGate2 = false;
      this.headData = {
        national_id: head.national_id || '',
        first_name: head.first_name || '',
        last_name: head.last_name || '',
        first_name_ne: head.first_name_ne || '',
        last_name_ne: head.last_name_ne || '',
        father_name: head.father_name || '',
        father_name_ne: head.father_name_ne || '',
        mother_name: head.mother_name || '',
        mother_name_ne: head.mother_name_ne || '',
        grandfather_name: head.grandfather_name || '',
        grandfather_name_ne: head.grandfather_name_ne || '',
        gender: head.gender || '',
        date_of_birth: this.dateService.formatForDisplay(head.date_of_birth, head.date_of_birth_bs) || '',
        blood_group: head.blood_group || '', marital_status: head.marital_status || '',
        mobile_number: head.mobile_number || this.registeredMobileNumber || '', email: head.email || '',
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
        profession_id: head.profession_id || '',
        qualification_id: head.qualification_id || '',
        photo: null, citizenship_front_image: null, citizenship_back_image: null,
        target_group_front_image: null, target_group_back_image: null,
        basai_sarai_front: null, basai_sarai_back: null,
      };
      this.headPhotoPreview = this.getDocUrl(head, 'photo') || '';
      this.citizenshipFrontPreview = this.getDocUrl(head, 'citizenship_front') || '';
      this.citizenshipBackPreview = this.getDocUrl(head, 'citizenship_back') || '';
      this.targetGroupFrontPreview = this.getDocUrl(head, 'target_group_front') || '';
      this.targetGroupBackPreview = this.getDocUrl(head, 'target_group_back') || '';
    } else {
      this.applyRegisteredMobileNumber();
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
      const serverStep = Number(e.current_step) || 1;
      this.currentStep = Math.min(Math.max(serverStep, 1), 3);
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
    if (this.temporarySameAsPermanent) {
      this.copyPermanentToTemporary();
    }
  }

  copyPermanentToTemporary() {
    if (!this.temporarySameAsPermanent) return;
    this.temporaryAddress = { ...this.step1 };
  }

  onTemporaryProvinceChange(reset = true) {
    if (reset) {
      this.temporaryAddress.district = '';
      this.temporaryAddress.municipality = '';
      this.temporaryAddress.ward_number = '';
      this.temporaryDistricts = [];
      this.temporaryMunicipalities = [];
      this.temporaryWards = [];
    }
    if (this.temporaryAddress.province) {
      this.geoSvc.districts(this.temporaryAddress.province).subscribe({ next: r => this.temporaryDistricts = r.data || [] });
    }
    this.updateTemporaryFullAddress();
  }

  onTemporaryDistrictChange(reset = true) {
    if (reset) {
      this.temporaryAddress.municipality = '';
      this.temporaryAddress.ward_number = '';
      this.temporaryMunicipalities = [];
      this.temporaryWards = [];
    }
    if (this.temporaryAddress.province && this.temporaryAddress.district) {
      this.geoSvc.municipalities(this.temporaryAddress.province, this.temporaryAddress.district)
        .subscribe({ next: r => this.temporaryMunicipalities = r.data || [] });
    }
    this.updateTemporaryFullAddress();
  }

  onTemporaryMunicipalityChange(reset = true) {
    if (reset) {
      this.temporaryAddress.ward_number = '';
      this.temporaryWards = [];
    }
    if (this.temporaryAddress.province && this.temporaryAddress.district && this.temporaryAddress.municipality) {
      this.geoSvc.wards(this.temporaryAddress.province, this.temporaryAddress.district, this.temporaryAddress.municipality)
        .subscribe({ next: r => this.temporaryWards = r.data || [] });
    }
    this.updateTemporaryFullAddress();
  }

  updateTemporaryFullAddress() {
    const parts = [
      this.temporaryAddress.tole_village,
      this.temporaryAddress.ward_number ? `Ward ${this.temporaryAddress.ward_number}` : '',
      this.temporaryAddress.municipality,
      this.temporaryAddress.district,
      this.temporaryAddress.province,
    ].filter(Boolean);
    this.temporaryAddress.full_address = parts.join(', ');
  }

  private loadTemporaryGeoOptions(address: Step1Data) {
    if (!address.province) return;
    this.geoSvc.districts(address.province).subscribe({
      next: r => {
        this.temporaryDistricts = r.data || [];
        if (!address.district) return;
        this.geoSvc.municipalities(address.province, address.district).subscribe({
          next: r2 => {
            this.temporaryMunicipalities = r2.data || [];
            if (!address.municipality) return;
            this.geoSvc.wards(address.province, address.district, address.municipality).subscribe({
              next: r3 => this.temporaryWards = r3.data || [],
            });
          },
        });
      },
    });
  }


  lookupNid2() {
    const nin = this.nidNumber2.trim();
    if (!nin) return;
    if (nin.length < 8) {
      this.nidMessage2 = this.t('wizard.nid_invalid_length');
      return;
    }
    if (this.nidLooking2) return;

    this.nidLooking2 = true;
    this.nidMessage2 = '';
    this.nidVerifiedHead = false;

    this.enrollmentSvc.headNidLookup(this.enrollmentId, nin).subscribe({
      next: (res) => {
        this.nidLooking2 = false;
        if (res.success && res.data) {
          const d = res.data;
          this.nidLockedHeadFields.clear();
          this.headData.national_id                 = d.national_id || d.nin_loc || nin;
          this.headData.first_name                 = d.first_name    || '';
          this.headData.last_name                  = d.last_name     || '';
          this.headData.first_name_ne              = d.first_name_ne || this.headData.first_name_ne;
          this.headData.last_name_ne               = d.last_name_ne  || this.headData.last_name_ne;
          this.headData.father_name                = d.father_name || '';
          this.headData.father_name_ne             = d.father_name_ne || '';
          this.headData.mother_name                = d.mother_name || '';
          this.headData.mother_name_ne             = d.mother_name_ne || '';
          this.headData.grandfather_name           = d.grandfather_name || '';
          this.headData.grandfather_name_ne        = d.grandfather_name_ne || '';
          this.headData.gender                     = d.gender        || '';
          this.headData.date_of_birth              = this.dateService.formatForDisplay(d.date_of_birth, d.date_of_birth_bs) || '';
          this.headData.mobile_number              = d.mobile_number || this.registeredMobileNumber || this.headData.mobile_number || '';
          this.headData.email                      = d.email         || '';
          if (d.citizenship_number)          this.headData.citizenship_number          = d.citizenship_number;
          if (d.citizenship_issue_date_bs)   this.headData.citizenship_issue_date      = d.citizenship_issue_date_bs;
          if (d.citizenship_issue_district)  this.headData.citizenship_issue_district  = d.citizenship_issue_district;
          if (d.photo_url) this.headPhotoPreview = d.photo_url;
          this.applyNidLocation(d);
          this.markLockedHeadFields(d);
          this.nidVerifiedHead = true;
          this.showNidGate2    = false;
        this.showToast(this.t('wizard.nid_verified'), 'success');
        } else {
          this.nidMessage2 = this.languageService.translateText(res.message) || this.t('wizard.nid_no_record');
        }
      },
      error: (err) => {
        this.nidLooking2 = false;
        if (err?.status === 404) {
          this.nidMessage2 = this.t('wizard.nid_no_record');
        } else if (err?.status === 422) {
          this.nidMessage2 = this.t('wizard.nid_invalid_format');
        } else {
          this.nidMessage2 = this.t('wizard.nid_failed');
        }
      },
    });
  }

  skipNidGate2() {
    const manualNid = this.nidNumber2.trim();
    if (manualNid) {
      this.headData.national_id = manualNid;
    }
    this.nidMessage2 = '';
    this.showNidGate2 = false;
  }

  get showHouseholdHeadForm(): boolean {
    return !this.showNidGate2;
  }

  isHeadFieldReadonly(field: string): boolean {
    return this.nidLockedHeadFields.has(field);
  }

  private markLockedHeadFields(d: NidLookupData) {
    const fieldMap: Record<string, keyof NidLookupData> = {
      national_id: 'national_id',
      first_name: 'first_name',
      last_name: 'last_name',
      first_name_ne: 'first_name_ne',
      last_name_ne: 'last_name_ne',
      father_name: 'father_name',
      father_name_ne: 'father_name_ne',
      mother_name: 'mother_name',
      mother_name_ne: 'mother_name_ne',
      grandfather_name: 'grandfather_name',
      grandfather_name_ne: 'grandfather_name_ne',
      gender: 'gender',
      date_of_birth: 'date_of_birth',
      mobile_number: 'mobile_number',
      email: 'email',
      citizenship_number: 'citizenship_number',
      citizenship_issue_date: 'citizenship_issue_date',
      citizenship_issue_district: 'citizenship_issue_district',
    };

    Object.entries(fieldMap).forEach(([field, key]) => {
      if (d[key]) this.nidLockedHeadFields.add(field);
    });
    if (d.province) this.nidLockedHeadFields.add('province');
    if (d.district) this.nidLockedHeadFields.add('district');
    if (d.municipality) this.nidLockedHeadFields.add('municipality');
    if (d.ward_number) this.nidLockedHeadFields.add('ward_number');
    if (d.tole_village) this.nidLockedHeadFields.add('tole_village');
  }

  lookupNidMember() {
    const nin = this.nidNumberMember.trim();
    if (!nin) return;
    if (nin.length < 8) {
      this.nidMessageMember = this.t('wizard.nid_invalid_length');
      return;
    }
    if (this.nidLookingMember) return;

    this.nidLookingMember = true;
    this.nidMessageMember = '';
    this.nidVerifiedMember = false;

    this.enrollmentSvc.nidLookup(nin).subscribe({
      next: (res) => {
        this.nidLookingMember = false;
        if (res.success && res.data) {
          const d = res.data;
          this.newMember.first_name    = d.first_name    || '';
          this.newMember.last_name     = d.last_name     || '';
          this.newMember.first_name_ne = d.first_name_ne || this.newMember.first_name_ne;
          this.newMember.last_name_ne  = d.last_name_ne  || this.newMember.last_name_ne;
          this.newMember.gender        = d.gender        || '';
          this.newMember.date_of_birth = this.dateService.formatForDisplay(d.date_of_birth, d.date_of_birth_bs) || '';
          this.newMember.mobile_number = d.mobile_number || '';
          if (d.citizenship_number)         this.newMember.citizenship_number         = d.citizenship_number;
          if (d.citizenship_issue_date_bs)  this.newMember.citizenship_issue_date     = d.citizenship_issue_date_bs;
          if (d.citizenship_issue_district) this.newMember.citizenship_issue_district = d.citizenship_issue_district;
          if (d.photo_url) this.memberPhotoPreview = d.photo_url;
          this.nidVerifiedMember = true;
          this.showNidGateMember = false;
        this.showToast(this.t('wizard.nid_verified'), 'success');
        } else {
          this.nidMessageMember = this.languageService.translateText(res.message) || this.t('wizard.nid_no_record');
        }
      },
      error: (err) => {
        this.nidLookingMember = false;
        if (err?.status === 404) {
          this.nidMessageMember = this.t('wizard.nid_no_record');
        } else if (err?.status === 422) {
          this.nidMessageMember = this.t('wizard.nid_invalid_format');
        } else {
          this.nidMessageMember = this.t('wizard.nid_failed');
        }
      },
    });
  }

  skipNidGateMember() { this.showNidGateMember = false; }

  private applyNidLocation(d: { province?: string | null; district?: string | null; municipality?: string | null; ward_number?: string | null; tole_village?: string | null }) {
    if (!d.province) {
      return;
    }

    this.step1.province = d.province;
    this.step1.district = '';
    this.step1.municipality = '';
    this.step1.ward_number = d.ward_number ? String(d.ward_number) : '';
    this.step1.tole_village = d.tole_village || this.step1.tole_village || '';
    this.districts = [];
    this.municipalities = [];
    this.wards = [];

    this.geoSvc.districts(d.province).subscribe({
      next: r => {
        this.districts = r.data || [];

        if (!d.district || !this.districts.includes(d.district)) {
          this.updateFullAddress();
          return;
        }

        this.step1.district = d.district;

        this.geoSvc.municipalities(d.province!, d.district).subscribe({
          next: r2 => {
            this.municipalities = r2.data || [];

            if (!d.municipality || !this.municipalities.includes(d.municipality)) {
              this.updateFullAddress();
              return;
            }

            this.step1.municipality = d.municipality;

            this.geoSvc.wards(d.province!, d.district!, d.municipality).subscribe({
              next: r3 => {
                this.wards = r3.data || [];
                if (d.ward_number && this.wards.includes(String(d.ward_number))) {
                  this.step1.ward_number = String(d.ward_number);
                }
                this.updateFullAddress();
              },
            });
          },
        });
      },
    });
  }

  // â”€â”€ Navigation

  async nextStep() {
    if (this.currentStep === 1) {
      if (!this.step1.province || !this.step1.district || !this.step1.municipality || !this.step1.ward_number) {
      this.showToast(this.t('wizard.required_location'), 'warning'); return;
      }
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender ||
          !this.headData.date_of_birth || !this.headData.mobile_number ||
          !this.headData.citizenship_number || !this.headData.marital_status) {
      this.showToast(this.t('wizard.required_fields'), 'warning'); return;
      }
      if (!/^\d{10}$/.test(this.headData.mobile_number)) {
        this.showToast(this.t('wizard.mobile_digits'), 'warning'); return;
      }
      if (this.calculateAge(this.headData.date_of_birth) < 16) {
        this.showToast(this.t('wizard.head_age'), 'warning'); return;
      }
      this.saving = true;
      const fd = this.buildHouseholdHeadFormData();
      this.enrollmentSvc.saveHouseholdHead(this.enrollmentId, fd).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) { this.enrollment = res.data; this.prefillFromEnrollment(res.data); this.currentStep = 2; this.loadEnrollment(); }
        },
        error: () => { this.saving = false; },
      });

    } else if (this.currentStep === 2) {
      this.currentStep = 3;
      this.loadEnrollment();
    }
  }

  prevStep() { if (this.currentStep > 1) this.currentStep--; }

  private buildHouseholdHeadFormData(): FormData {
    if (this.temporarySameAsPermanent) {
      this.copyPermanentToTemporary();
    }

    const fd = new FormData();
    Object.entries({
      ...this.step1,
      temporary_same_as_permanent: this.temporarySameAsPermanent,
      temporary_province: this.temporaryAddress.province,
      temporary_district: this.temporaryAddress.district,
      temporary_municipality: this.temporaryAddress.municipality,
      temporary_ward_number: this.temporaryAddress.ward_number,
      temporary_tole_village: this.temporaryAddress.tole_village,
      temporary_full_address: this.temporaryAddress.full_address,
      first_service_point: this.firstServicePoint,
    }).forEach(([key, val]) => {
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val !== null && val !== undefined && val !== '') fd.append(key, String(val));
    });

    Object.keys(this.headData).forEach(key => {
      if (key === 'middle_name' || key === 'middle_name_ne') return;
      const val = this.headData[key];
      if (val === null || val === undefined) return;
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val instanceof Blob) { fd.append(key, val, `${key}.jpg`); return; }
      if (val !== '') fd.append(key, String(val));
    });

    return fd;
  }

  async saveDraft() {
    this.savingDraft = true;
    if (this.currentStep === 1) {
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender ||
          !this.headData.date_of_birth || !this.headData.mobile_number ||
          !this.headData.citizenship_number || !this.headData.citizenship_issue_date ||
          !this.headData.citizenship_issue_district || !this.headData.marital_status) {
      this.showToast(this.t('wizard.required_before_save'), 'warning');
        this.savingDraft = false; return;
      }
      if (!/^\d{10}$/.test(this.headData.mobile_number)) {
      this.showToast(this.t('wizard.mobile_digits'), 'warning');
        this.savingDraft = false; return;
      }
      if (this.calculateAge(this.headData.date_of_birth) < 16) {
        this.showToast(this.t('wizard.head_age'), 'warning');
        this.savingDraft = false; return;
      }
      this.enrollmentSvc.saveHouseholdHead(this.enrollmentId, this.buildHouseholdHeadFormData()).subscribe({
        next: (res) => {
          this.savingDraft = false;
          if (res.success) {
            this.enrollment = res.data;
          this.showToast(this.t('wizard.draft_saved'), 'success');
          }
        },
      error: () => { this.savingDraft = false; this.showToast(this.t('wizard.draft_failed'), 'danger'); },
      });
    } else {
      this.savingDraft = false;
    }
  }

  goToStep(step: number) { if (step < this.currentStep) this.currentStep = step; }


  private resetMemberForm() {
    const currentBs = this.dateService.getCurrentBs();
    this.editingMemberId = null;
    this.newMember = {
      first_name: '', last_name: '',
      first_name_ne: '', last_name_ne: '',
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
    this.nidVerifiedMember = false;
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
      last_name: member.last_name || '',
      first_name_ne: member.first_name_ne || '',
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
    this.resetMemberForm();
  }

  get isEditingMember(): boolean {
    return this.editingMemberId !== null;
  }

  async saveMember() {
    if (!this.newMember.first_name || !this.newMember.last_name ||
        !this.newMember.gender || !this.newMember.date_of_birth || !this.newMember.relationship) {
      this.showToast(this.t('wizard.member_required'), 'warning'); return;
    }

    const relationship = this.normalizeKey(this.newMember.relationship);
    if (!relationship || !this.availableMemberRelationshipOptions.some(option => option.value === relationship)) {
      this.showToast(this.t('wizard.relationship_invalid'), 'warning'); return;
    }
    if (this.isHeadSingle && SINGLE_HEAD_BLOCKED_RELATIONSHIPS.includes(relationship)) {
      this.showToast(this.t('wizard.relationship_single_block'), 'warning'); return;
    }
    this.newMember.relationship = relationship;
    if (this.newMember.marital_status) {
      this.newMember.marital_status = this.normalizeKey(this.newMember.marital_status);
    }

    if (this.newMember.mobile_number && !/^\d{10}$/.test(this.newMember.mobile_number)) {
      this.showToast(this.t('wizard.mobile_digits'), 'warning'); return;
    }
    const docType = this.newMember.document_type || null;
    if (docType === 'citizenship' && this.calculateAge(this.newMember.date_of_birth) < 16) {
      this.showToast(this.t('wizard.member_age_citizenship'), 'warning'); return;
    }

    this.savingMember = true;
    const fd = new FormData();
    const skippedMemberFields = new Set([
      'middle_name',
      'middle_name_ne',
      'is_target_group',
      'target_group_type',
      'target_group_id_number',
      'target_group_front_image',
      'target_group_back_image',
    ]);
    Object.keys(this.newMember).forEach(key => {
      if (skippedMemberFields.has(key)) return;
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
          const savedMember = res.data;
          this.resetMemberForm();
          if (savedMember) {
            this.upsertLocalMember(savedMember as FamilyMember, wasEditing);
          } else {
            this.loadEnrollment();
          }
          this.showToast(this.t(wasEditing ? 'wizard.member_updated' : 'wizard.member_added'), 'success');
        }
      },
      error: () => { this.savingMember = false; },
    });
  }

  async removeMember(member: FamilyMember) {
    const alert = await this.alertCtrl.create({
      header: this.t('wizard.remove_member_header'),
      message: `${this.t('wizard.remove_member_message')} ${member.first_name} ${member.last_name}`,
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('common.delete'), cssClass: 'danger',
          handler: () => {
            this.enrollmentSvc.removeMember(this.enrollmentId, member.id).subscribe({
              next: () => { this.members = this.members.filter(m => m.id !== member.id); },
            });
          },
        },
      ],
    });
    await alert.present();
  }



  async payAndSubmit() {
    if (!this.confirmed) {
      this.showToast(this.t('wizard.confirm_information'), 'warning');
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
    if (!this.confirmed) { this.showToast(this.t('wizard.confirm_information'), 'warning'); return; }
    this.submitting = true;
    this.enrollmentSvc.submit(this.enrollmentId).subscribe({
      next: async (res) => {
        this.submitting = false;
        await this.openEnrollmentPdf(res.pdf_download_url || res.data?.pdf_download_url || null);
        this.showToast(this.t('wizard.submitted'), 'success');
        this.router.navigateByUrl('/tabs/enrollments');
      },
      error: () => { this.submitting = false; },
    });
  }

  async openEnrollmentPdf(url?: string | null) {
    if (!url) return;

    try {
      await Browser.open({ url });
    } catch {
      this.showToast(this.t('wizard.pdf_open_failed'), 'warning');
    }
  }

  // â”€â”€ Image capture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async captureImage(
    target: 'head' | 'member',
    field: 'photo' | 'citizenship_front_image' | 'citizenship_back_image' |
           'target_group_front_image' | 'target_group_back_image' |
           'basai_sarai_front' | 'basai_sarai_back' |
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
      if (file.size > 2 * 1024 * 1024) { this.showToast(this.t('wizard.image_size'), 'danger'); return; }
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
      else if (field === 'basai_sarai_front') this.basaiSaraiFrontPreview = dataUrl;
      else if (field === 'basai_sarai_back') this.basaiSaraiBackPreview = dataUrl;
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
    return this.languageService.label('status', s);
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
        .map(value => ({ value, label: this.formatRelationship(value) }));
      return this.dedupeRelationshipOptions(options);
    }

    if (raw && typeof raw === 'object') {
      const options = Object.entries(raw as Record<string, unknown>)
        .map(([key, label]) => {
          const value = this.normalizeKey(key);
          if (!value || value === 'self') return null;
          const labelText = typeof label === 'string' && label.trim().length > 0
            ? label.trim()
            : this.formatRelationship(value);
          return { value, label: labelText };
        })
        .filter((option): option is { value: string; label: string } => option !== null);
      return this.dedupeRelationshipOptions(options);
    }

    return [...DEFAULT_MEMBER_RELATIONSHIPS];
  }

  private optionRecordToArray(raw: unknown, fallback: Array<{ id: number; label: string }>): Array<{ id: number; label: string }> {
    if (!raw || typeof raw !== 'object') {
      return fallback;
    }

    return Object.entries(raw as Record<string, string>)
      .map(([id, label]) => ({ id: Number(id), label }))
      .filter(option => Number.isFinite(option.id) && !!option.label);
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

  private get registeredMobileNumber(): string {
    return this.authService.getCurrentUser()?.mobile_number?.trim() || '';
  }

  private applyRegisteredMobileNumber(): void {
    if (!this.headData.mobile_number && this.registeredMobileNumber) {
      this.headData.mobile_number = this.registeredMobileNumber;
    }
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  label(namespace: string, value: string | null | undefined, fallback?: string): string {
    return this.languageService.label(namespace, value, fallback);
  }

  formatNumber(value: string | number | null | undefined, decimals = 0): string {
    return this.languageService.formatNumber(value, decimals);
  }

  formatCurrency(value: string | number | null | undefined, decimals = 0): string {
    return `${this.t('common.currency')} ${this.languageService.formatNumber(value ?? 0, decimals)}`;
  }

  formatRelationship(value: string | null | undefined): string {
    return this.languageService.label('relation', value);
  }

  private upsertLocalMember(member: FamilyMember, wasEditing: boolean): void {
    if (!member?.id) {
      return;
    }

    if (wasEditing) {
      this.members = this.members.map(existing => existing.id === member.id ? member : existing);
      return;
    }

    if (!this.members.some(existing => existing.id === member.id)) {
      this.members = [...this.members, member];
    }
  }

  paySubmitLabel(amount: string | number | null | undefined): string {
    return this.t('renewal_detail.pay_amount_submit').replace(':amount', this.formatCurrency(amount ?? 0, 0));
  }

  private refreshStepTitles(): void {
    this.stepTitles = STEP_TITLE_KEYS.map((key) => this.languageService.t(key));
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
    const t = await this.toastCtrl.create({ message: this.languageService.translateText(message), duration: 2500, color, position: 'top' });
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
