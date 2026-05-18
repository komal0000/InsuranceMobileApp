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
  cardOutline, documentTextOutline, createOutline, addOutline
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
  ServicePointOption, SubsidyResult, SubsidySummary
} from '../../interfaces/enrollment.interface';
import { canonicalNid, isValidNidInput, nidLookupValue } from '../../utils/nid-number.util';
import { isNepaliNamePart, normalizeDigitsOnly } from '../../utils/auth-validation';
import {
  RelationshipGenderMap,
  genderForRelationship,
  normalizeRelationshipGenderMap,
} from '../../utils/relationship-gender.util';
import {
  RelationshipBlockMap,
  blockedRelationshipsForHeadMaritalStatus,
  defaultRelationshipBlockMap,
  isRelationshipBlockedForHeadMaritalStatus,
  normalizeRelationshipBlockMap,
} from '../../utils/relationship-marital-status.util';
import { requiresRemovalDocument } from '../../utils/member-removal-document.util';
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
  { value: 'brother_in_law', label: 'Brother In Law' },
  { value: 'sister_in_law', label: 'Sister In Law' },
  { value: 'son_in_law', label: 'Son In Law' },
  { value: 'daughter_in_law', label: 'Daughter In Law' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_UPLOAD_LIMITS = {
  max_file_bytes: 2 * 1024 * 1024,
  max_post_bytes: 20 * 1024 * 1024,
};

const HOUSEHOLD_HEAD_UPLOAD_FIELDS = [
  'photo',
  'citizenship_front_image',
  'citizenship_back_image',
  'birth_certificate_front_image',
  'target_group_front_image',
  'target_group_back_image',
  'basai_sarai_front',
  'basai_sarai_back',
];

const HOUSEHOLD_HEAD_NEPALI_NAME_FIELDS = [
  'first_name_ne',
  'middle_name_ne',
  'last_name_ne',
  'father_first_name_ne',
  'father_last_name_ne',
  'father_name_ne',
  'mother_first_name_ne',
  'mother_last_name_ne',
  'mother_name_ne',
  'grandfather_first_name_ne',
  'grandfather_last_name_ne',
  'grandfather_name_ne',
];

const MEMBER_NEPALI_NAME_FIELDS = [
  'first_name_ne',
  'middle_name_ne',
  'last_name_ne',
];

interface VerifiedNidField {
  label: string;
  value: string;
}

interface VerifiedNidGroup {
  title: string;
  fields: VerifiedNidField[];
}

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
  relationshipGenderMap: RelationshipGenderMap = {};
  relationshipBlockedByHeadMaritalStatus: RelationshipBlockMap = defaultRelationshipBlockMap();
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
  temporarySameAsPermanent = false;
  temporaryAddress: Step1Data = {
    province: '', district: '', municipality: '', ward_number: '',
    tole_village: '', full_address: '',
  };
  temporaryDistricts: string[] = [];
  temporaryMunicipalities: string[] = [];
  temporaryWards: string[] = [];
  servicePointOptions: ServicePointOption[] = [];
  firstServicePointId: number | string = '';
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
    father_first_name: '', father_last_name: '',
    father_first_name_ne: '', father_last_name_ne: '',
    father_name: '', father_name_ne: '',
    mother_first_name: '', mother_last_name: '',
    mother_first_name_ne: '', mother_last_name_ne: '',
    mother_name: '', mother_name_ne: '',
    grandfather_first_name: '', grandfather_last_name: '',
    grandfather_first_name_ne: '', grandfather_last_name_ne: '',
    grandfather_name: '', grandfather_name_ne: '',
    gender: '', date_of_birth: '', blood_group: '', marital_status: '',
    mobile_number: '', email: '',
    document_type: 'citizenship',
    citizenship_number: '', citizenship_issue_date: '', citizenship_issue_district: '',
    birth_certificate_number: '', birth_certificate_issue_date: '',
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    occupation: '', education_level: '', profession_id: '', qualification_id: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    birth_certificate_front_image: null as File | Blob | null,
    target_group_front_image: null as File | Blob | null,
    target_group_back_image: null as File | Blob | null,
    basai_sarai_front: null as File | Blob | null,
    basai_sarai_back: null as File | Blob | null,
  };
  headPhotoPreview = '';
  citizenshipFrontPreview = '';
  citizenshipBackPreview = '';
  birthCertificateFrontPreview = '';
  targetGroupFrontPreview = '';
  targetGroupBackPreview = '';
  basaiSaraiFrontPreview = '';
  basaiSaraiBackPreview = '';

  members: FamilyMember[] = [];
  householdHead: HouseholdHead | null = null;
  showMemberForm = false;
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
    first_service_point_id: '',
    occupation: '',
    document_type: '',
    citizenship_number: '', citizenship_issue_date: '', citizenship_issue_district: '',
    birth_certificate_number: '', birth_certificate_issue_date: '',
    is_target_group: false, target_group_type: '', target_group_id_number: '',
    photo: null as File | Blob | null,
    citizenship_front_image: null as File | Blob | null,
    citizenship_back_image: null as File | Blob | null,
    birth_certificate_front_image: null as File | Blob | null,
    target_group_front_image: null as File | Blob | null,
    target_group_back_image: null as File | Blob | null,
  };
  memberPhotoPreview = '';
  memberCitizenshipFrontPreview = '';
  memberCitizenshipBackPreview = '';
  memberBirthCertFrontPreview = '';
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
      cardOutline, documentTextOutline, createOutline, addOutline
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
    this.applyRegisteredContactDetails();
    this.resetMemberForm();
    this.geoSvc.provinces().subscribe({ next: r => this.provinces = r.data || [] });
    this.enrollmentSvc.getConfig().subscribe({
      next: r => {
        this.config = r.data;
        const configData = r.data as EnrollmentConfig & {
          relationship_types?: unknown;
          relationship_gender_map?: unknown;
          relationship_blocked_by_head_marital_status?: unknown;
        };
        this.relationshipOptions = this.buildRelationshipOptions(configData?.relationship_types);
        this.relationshipGenderMap = normalizeRelationshipGenderMap(configData?.relationship_gender_map);
        this.relationshipBlockedByHeadMaritalStatus = normalizeRelationshipBlockMap(
          configData?.relationship_blocked_by_head_marital_status,
        );
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
    this.firstServicePointId = e.first_service_point_id || '';
    this.firstServicePoint = e.first_service_point || '';

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
      this.loadServicePoints(true);
    }

    this.temporarySameAsPermanent = e.temporary_same_as_permanent ?? false;
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
    this.nidLockedHeadFields.clear();
    this.nidVerifiedHead = false;
    if (head) {
      this.showNidGate2 = false;
      this.headData = {
        national_id: head.national_id || '',
        first_name: head.first_name || '',
        last_name: head.last_name || '',
        first_name_ne: head.first_name_ne || '',
        last_name_ne: head.last_name_ne || '',
        father_first_name: head.father_first_name || '',
        father_last_name: head.father_last_name || '',
        father_first_name_ne: head.father_first_name_ne || '',
        father_last_name_ne: head.father_last_name_ne || '',
        father_name: head.father_name || '',
        father_name_ne: head.father_name_ne || '',
        mother_first_name: head.mother_first_name || '',
        mother_last_name: head.mother_last_name || '',
        mother_first_name_ne: head.mother_first_name_ne || '',
        mother_last_name_ne: head.mother_last_name_ne || '',
        mother_name: head.mother_name || '',
        mother_name_ne: head.mother_name_ne || '',
        grandfather_first_name: head.grandfather_first_name || '',
        grandfather_last_name: head.grandfather_last_name || '',
        grandfather_first_name_ne: head.grandfather_first_name_ne || '',
        grandfather_last_name_ne: head.grandfather_last_name_ne || '',
        grandfather_name: head.grandfather_name || '',
        grandfather_name_ne: head.grandfather_name_ne || '',
        gender: head.gender || '',
        date_of_birth: this.dateService.formatForDisplay(head.date_of_birth, head.date_of_birth_bs) || '',
        blood_group: head.blood_group || '', marital_status: head.marital_status || '',
        mobile_number: head.mobile_number || this.registeredMobileNumber || '',
        email: head.email || this.registeredEmail || '',
        document_type: head.document_type || 'citizenship',
        citizenship_number: head.citizenship_number || '',
        citizenship_issue_date: this.dateService.formatForDisplay(
          head.citizenship_issue_date,
          head.citizenship_issue_date_bs
        ) || '',
        citizenship_issue_district: head.citizenship_issue_district || '',
        birth_certificate_number: head.birth_certificate_number || '',
        birth_certificate_issue_date: this.dateService.formatForDisplay(
          head.birth_certificate_issue_date,
          head.birth_certificate_issue_date_bs
        ) || '',
        is_target_group: !!head.is_target_group,
        target_group_type: head.target_group_type || '',
        target_group_id_number: head.target_group_id_number || '',
        occupation: head.occupation || '', education_level: head.education_level || '',
        profession_id: head.profession_id || '',
        qualification_id: head.qualification_id || '',
        photo: null, citizenship_front_image: null, citizenship_back_image: null,
        birth_certificate_front_image: null,
        target_group_front_image: null, target_group_back_image: null,
        basai_sarai_front: null, basai_sarai_back: null,
      };
      this.applyParentNameData(this.headData);
      this.headPhotoPreview = this.getDocUrl(head, 'photo') || '';
      this.citizenshipFrontPreview = this.getDocUrl(head, 'citizenship_front') || '';
      this.citizenshipBackPreview = this.getDocUrl(head, 'citizenship_back') || '';
      this.birthCertificateFrontPreview = this.getDocUrl(head, 'birth_certificate_front') || '';
      this.targetGroupFrontPreview = this.getDocUrl(head, 'target_group_front') || '';
      this.targetGroupBackPreview = this.getDocUrl(head, 'target_group_back') || '';
      this.syncHouseholdHeadDocumentType();
      if (head.nid_verified_at && head.nid_raw_payload) {
        this.nidVerifiedHead = true;
        this.markLockedHeadFields(head.nid_raw_payload as NidLookupData);
        this.syncHouseholdHeadDocumentType();
      }
    } else {
      this.applyRegisteredContactDetails();
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
      this.servicePointOptions = [];
      this.firstServicePointId = '';
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
      this.firstServicePointId = '';
    }
    if (this.step1.province && this.step1.district) {
      this.geoSvc.municipalities(this.step1.province, this.step1.district)
        .subscribe({ next: r => this.municipalities = r.data || [] });
    }
    this.loadServicePoints(false);
    this.updateFullAddress();
  }

  private loadServicePoints(preserveSelection = true) {
    if (!this.step1.province || !this.step1.district) {
      this.servicePointOptions = [];
      if (!preserveSelection) this.firstServicePointId = '';
      return;
    }

    const selected = this.firstServicePointId;
    this.geoSvc.servicePoints(this.step1.province, this.step1.district).subscribe({
      next: r => {
        this.servicePointOptions = r.data || [];
        const stillAvailable = this.servicePointOptions.some(option => String(option.id) === String(selected));
        this.firstServicePointId = preserveSelection && stillAvailable ? selected : '';
      },
      error: () => {
        this.servicePointOptions = [];
        if (!preserveSelection) this.firstServicePointId = '';
      },
    });
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
    if (!this.isValidNid(nin)) {
      this.nidMessage2 = this.t('wizard.nid_invalid_length');
      return;
    }
    const lookupNin = nidLookupValue(nin);
    if (this.nidLooking2) return;

    this.nidLooking2 = true;
    this.nidMessage2 = '';
    this.nidVerifiedHead = false;

    this.enrollmentSvc.headNidLookup(this.enrollmentId, lookupNin).subscribe({
      next: (res) => {
        this.nidLooking2 = false;
        if (res.success && res.data) {
          const d = res.data;
          this.nidLockedHeadFields.clear();
          this.headData.national_id                 = canonicalNid(d.national_id || d.nin_loc || lookupNin);
          this.headData.first_name                 = d.first_name    || '';
          this.headData.last_name                  = d.last_name     || '';
          this.headData.first_name_ne              = d.first_name_ne || this.headData.first_name_ne;
          this.headData.last_name_ne               = d.last_name_ne  || this.headData.last_name_ne;
          this.applyParentNameData(d);
          this.headData.gender                     = d.gender        || '';
          this.headData.date_of_birth              = this.dateService.formatForDisplay(d.date_of_birth, d.date_of_birth_bs) || '';
          this.headData.mobile_number              = d.mobile_number || this.registeredMobileNumber || this.headData.mobile_number || '';
          this.headData.email                      = d.email || this.headData.email || this.registeredEmail || '';
          if (d.citizenship_number)          this.headData.citizenship_number          = d.citizenship_number;
          if (d.citizenship_issue_date_bs)   this.headData.citizenship_issue_date      = d.citizenship_issue_date_bs;
          if (d.citizenship_issue_district)  this.headData.citizenship_issue_district  = d.citizenship_issue_district;
          if (d.photo_url) this.headPhotoPreview = d.photo_url;
          this.applyNidLocation(d);
          this.markLockedHeadFields(d);
          this.syncHouseholdHeadDocumentType();
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
          this.nidMessage2 = this.errorMessage(err, 'wizard.nid_invalid_format');
        } else {
          this.nidMessage2 = this.t('wizard.nid_failed');
        }
      },
    });
  }

  skipNidGate2() {
    const manualNid = this.nidNumber2.trim();
    if (manualNid) {
      if (!this.isValidNid(manualNid)) {
        this.nidMessage2 = this.t('wizard.nid_invalid_length');
        return;
      }
      this.headData.national_id = canonicalNid(manualNid);
    }
    this.nidLockedHeadFields.clear();
    this.nidVerifiedHead = false;
    this.nidMessage2 = '';
    this.showNidGate2 = false;
  }

  get showHouseholdHeadForm(): boolean {
    return !this.showNidGate2;
  }

  get householdHeadUsesBirthCertificate(): boolean {
    return this.isHouseholdHeadUnderSixteen();
  }

  onHouseholdHeadIdentityModeChange(): void {
    this.syncHouseholdHeadDocumentType();
  }

  isHeadFieldReadonly(field: string): boolean {
    return this.nidLockedHeadFields.has(field);
  }

  get verifiedNidGroups(): VerifiedNidGroup[] {
    if (!this.nidVerifiedHead) {
      return [];
    }

    const groups: Array<{ title: string; fields: Array<{ key: string; label: string }> }> = [
      {
        title: this.text('wizard.personal_information', 'Personal Information'),
        fields: [
          { key: 'national_id', label: this.text('wizard.national_id_number', 'National ID Number') },
          { key: 'first_name', label: this.text('wizard.first_name', 'First Name') },
          { key: 'last_name', label: this.text('wizard.last_name', 'Last Name') },
          { key: 'first_name_ne', label: this.text('wizard.first_name_ne', 'First Name (नेपाली)') },
          { key: 'last_name_ne', label: this.text('wizard.last_name_ne', 'Last Name (नेपाली)') },
          { key: 'gender', label: this.text('wizard.gender', 'Gender') },
          { key: 'date_of_birth', label: this.text('wizard.date_of_birth', 'Date of Birth') },
          { key: 'mobile_number', label: this.text('profile.mobile_number', 'Mobile Number') },
          { key: 'email', label: this.text('profile.email', 'Email') },
        ],
      },
      {
        title: this.text('wizard.parent_grandparent_information', 'Parent and Grandparent Information'),
        fields: [
          { key: 'father_first_name', label: this.text('wizard.father_first_name', 'Father First Name') },
          { key: 'father_last_name', label: this.text('wizard.father_last_name', 'Father Last Name') },
          { key: 'father_first_name_ne', label: this.text('wizard.father_first_name_ne', 'Father First Name (नेपाली)') },
          { key: 'father_last_name_ne', label: this.text('wizard.father_last_name_ne', 'Father Last Name (नेपाली)') },
          { key: 'mother_first_name', label: this.text('wizard.mother_first_name', 'Mother First Name') },
          { key: 'mother_last_name', label: this.text('wizard.mother_last_name', 'Mother Last Name') },
          { key: 'mother_first_name_ne', label: this.text('wizard.mother_first_name_ne', 'Mother First Name (नेपाली)') },
          { key: 'mother_last_name_ne', label: this.text('wizard.mother_last_name_ne', 'Mother Last Name (नेपाली)') },
          { key: 'grandfather_first_name', label: this.text('wizard.grandfather_first_name', 'Grandfather First Name') },
          { key: 'grandfather_last_name', label: this.text('wizard.grandfather_last_name', 'Grandfather Last Name') },
          { key: 'grandfather_first_name_ne', label: this.text('wizard.grandfather_first_name_ne', 'Grandfather First Name (नेपाली)') },
          { key: 'grandfather_last_name_ne', label: this.text('wizard.grandfather_last_name_ne', 'Grandfather Last Name (नेपाली)') },
        ],
      },
      {
        title: this.text('wizard.citizenship_information', 'Citizenship Information'),
        fields: [
          { key: 'citizenship_number', label: this.text('wizard.citizenship_number', 'Citizenship Number') },
          { key: 'citizenship_issue_date', label: this.text('wizard.citizenship_issue_date', 'Citizenship Issue Date') },
          { key: 'citizenship_issue_district', label: this.text('wizard.citizenship_issue_district', 'Citizenship Issue District') },
        ],
      },
      {
        title: this.text('wizard.permanent_address', 'Permanent Address'),
        fields: [
          { key: 'province', label: this.text('wizard.province', 'Province') },
          { key: 'district', label: this.text('wizard.district', 'District') },
          { key: 'municipality', label: this.text('wizard.municipality', 'Municipality') },
          { key: 'ward_number', label: this.text('wizard.ward_number', 'Ward Number') },
          { key: 'tole_village', label: this.text('wizard.tole_village', 'Tole / Village') },
        ],
      },
    ];

    return groups
      .map(group => ({
        title: group.title,
        fields: group.fields
          .filter(field => this.nidLockedHeadFields.has(field.key))
          .map(field => ({ label: field.label, value: this.verifiedNidValue(field.key) }))
          .filter(field => field.value.length > 0),
      }))
      .filter(group => group.fields.length > 0);
  }

  private verifiedNidValue(field: string): string {
    const addressFields: Record<string, string | undefined> = {
      province: this.step1.province,
      district: this.step1.district,
      municipality: this.step1.municipality,
      ward_number: this.step1.ward_number,
      tole_village: this.step1.tole_village,
    };
    const rawValue = Object.prototype.hasOwnProperty.call(addressFields, field)
      ? addressFields[field]
      : this.headData?.[field];
    const value = this.compactText(rawValue);

    if (field === 'gender' && value) {
      return this.label('gender', value, this.titleize(value));
    }

    return value;
  }

  private compactText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  private text(key: string, fallback: string): string {
    const translated = this.languageService.t(key);
    return translated === key ? fallback : translated;
  }

  private isValidNid(value: string): boolean {
    return isValidNidInput(value);
  }

  private titleize(value: string): string {
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private splitDisplayName(value: unknown): { first: string; last: string } {
    const normalized = String(value || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return { first: '', last: '' };
    }

    const parts = normalized.split(' ');
    const last = parts.pop() || '';

    return { first: parts.join(' '), last };
  }

  private composeDisplayName(first: unknown, last: unknown): string {
    return [first, last]
      .map(value => String(value || '').trim())
      .filter(Boolean)
      .join(' ');
  }

  private applyParentNameData(source: Partial<NidLookupData> | Record<string, any>): void {
    const data = source as Record<string, any>;

    (['father', 'mother', 'grandfather'] as const).forEach(relation => {
      const english = this.splitDisplayName(data[`${relation}_name`] || '');
      const nepali = this.splitDisplayName(data[`${relation}_name_ne`] || '');
      const first = String(data[`${relation}_first_name`] || english.first || '').trim();
      const last = String(data[`${relation}_last_name`] || english.last || '').trim();
      const firstNe = String(data[`${relation}_first_name_ne`] || nepali.first || '').trim();
      const lastNe = String(data[`${relation}_last_name_ne`] || nepali.last || '').trim();

      this.headData[`${relation}_first_name`] = first;
      this.headData[`${relation}_last_name`] = last;
      this.headData[`${relation}_first_name_ne`] = firstNe;
      this.headData[`${relation}_last_name_ne`] = lastNe;
      this.headData[`${relation}_name`] = this.composeDisplayName(first, last);
      this.headData[`${relation}_name_ne`] = this.composeDisplayName(firstNe, lastNe);
    });
  }

  private markLockedHeadFields(d: NidLookupData) {
    const fieldMap: Record<string, Array<keyof NidLookupData>> = {
      national_id: ['national_id', 'nin_loc'],
      first_name: ['first_name'],
      last_name: ['last_name'],
      first_name_ne: ['first_name_ne'],
      last_name_ne: ['last_name_ne'],
      father_first_name: ['father_first_name', 'father_name'],
      father_last_name: ['father_last_name', 'father_name'],
      father_first_name_ne: ['father_first_name_ne', 'father_name_ne'],
      father_last_name_ne: ['father_last_name_ne', 'father_name_ne'],
      mother_first_name: ['mother_first_name', 'mother_name'],
      mother_last_name: ['mother_last_name', 'mother_name'],
      mother_first_name_ne: ['mother_first_name_ne', 'mother_name_ne'],
      mother_last_name_ne: ['mother_last_name_ne', 'mother_name_ne'],
      grandfather_first_name: ['grandfather_first_name', 'grandfather_name'],
      grandfather_last_name: ['grandfather_last_name', 'grandfather_name'],
      grandfather_first_name_ne: ['grandfather_first_name_ne', 'grandfather_name_ne'],
      grandfather_last_name_ne: ['grandfather_last_name_ne', 'grandfather_name_ne'],
      gender: ['gender'],
      date_of_birth: ['date_of_birth', 'date_of_birth_bs', 'dob_loc'],
      mobile_number: ['mobile_number'],
      email: ['email'],
      citizenship_number: ['citizenship_number'],
      citizenship_issue_date: ['citizenship_issue_date', 'citizenship_issue_date_bs'],
      citizenship_issue_district: ['citizenship_issue_district'],
    };

    Object.entries(fieldMap).forEach(([field, keys]) => {
      if (keys.some(key => d[key]) && String(this.headData[field] || '').trim() !== '') {
        this.nidLockedHeadFields.add(field);
      }
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
    if (!this.isValidNid(nin)) {
      this.nidMessageMember = this.t('wizard.nid_invalid_length');
      return;
    }
    const lookupNin = nidLookupValue(nin);
    if (this.nidLookingMember) return;

    this.nidLookingMember = true;
    this.nidMessageMember = '';
    this.nidVerifiedMember = false;

    this.enrollmentSvc.nidLookup(lookupNin).subscribe({
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
          this.newMember.occupation    = d.occupation    || this.newMember.occupation;
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
    this.servicePointOptions = [];
    this.firstServicePointId = '';

    this.geoSvc.districts(d.province).subscribe({
      next: r => {
        this.districts = r.data || [];

        if (!d.district || !this.districts.includes(d.district)) {
          this.updateFullAddress();
          return;
        }

        this.step1.district = d.district;
        this.loadServicePoints(false);

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
      this.syncHouseholdHeadDocumentType();
      if (!this.step1.province || !this.step1.district || !this.step1.municipality || !this.step1.ward_number) {
      this.showToast(this.t('wizard.required_location'), 'warning'); return;
      }
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender ||
          !this.headData.date_of_birth || !this.headData.mobile_number || !this.headData.marital_status) {
      this.showToast(this.t('wizard.required_fields'), 'warning'); return;
      }
      if (this.hasInvalidNepaliNameParts(this.headData, HOUSEHOLD_HEAD_NEPALI_NAME_FIELDS)) {
        this.showToast(this.t('wizard.nepali_name_format'), 'warning'); return;
      }
      if (!/^\d{10}$/.test(this.headData.mobile_number)) {
        this.showToast(this.t('wizard.mobile_digits'), 'warning'); return;
      }
      if (this.headData.national_id && !this.isValidNid(this.headData.national_id)) {
        this.showToast(this.t('wizard.nid_invalid_length'), 'warning'); return;
      }
      const headAge = this.calculateAge(this.headData.date_of_birth);
      if (headAge < 1 || headAge > 100) {
        this.showToast(this.t('wizard.head_age_range'), 'warning'); return;
      }
      if (this.householdHeadUsesBirthCertificate) {
        if (!this.headData.birth_certificate_number || !this.headData.birth_certificate_issue_date ||
            (!this.headData.birth_certificate_front_image && !this.birthCertificateFrontPreview)) {
          this.showToast(this.t('wizard.birth_certificate_required'), 'warning'); return;
        }
      } else if (!this.headData.citizenship_number || !this.headData.citizenship_issue_date ||
          !this.headData.citizenship_issue_district) {
        this.showToast(this.t('wizard.required_fields'), 'warning'); return;
      } else if (!this.hasValidCitizenshipIssueDate(this.headData.date_of_birth, this.headData.citizenship_issue_date)) {
        this.showToast(this.t('wizard.citizenship_issue_age'), 'warning'); return;
      }
      this.clearInactiveHouseholdHeadUploads();
      const uploadErrorKey = this.householdHeadUploadErrorKey();
      if (uploadErrorKey) {
        this.showToast(this.t(uploadErrorKey), 'warning'); return;
      }
      this.saving = true;
      const fd = this.buildHouseholdHeadFormData();
      this.enrollmentSvc.saveHouseholdHead(this.enrollmentId, fd).subscribe({
        next: (res) => {
          this.saving = false;
          if (res.success) { this.enrollment = res.data; this.prefillFromEnrollment(res.data); this.currentStep = 2; this.loadEnrollment(); }
        },
        error: (err) => {
          this.saving = false;
          this.showToast(this.errorMessage(err, 'wizard.save_failed'), 'danger');
        },
      });

    } else if (this.currentStep === 2) {
      this.currentStep = 3;
      this.loadEnrollment();
    }
  }

  prevStep() { if (this.currentStep > 1) this.currentStep--; }

	  private uploadLimits() {
    return {
      max_file_bytes: this.config?.upload_limits?.max_file_bytes || DEFAULT_UPLOAD_LIMITS.max_file_bytes,
      max_post_bytes: this.config?.upload_limits?.max_post_bytes || DEFAULT_UPLOAD_LIMITS.max_post_bytes,
    };
	  }

  private hasInvalidNepaliNameParts(source: any, fields: string[]): boolean {
    return fields.some(field => !isNepaliNamePart(source?.[field]));
  }

  private activeHouseholdHeadUploadFields(): Set<string> {
    const fields = new Set<string>(['photo']);
    const usesBirthCertificate = this.householdHeadUsesBirthCertificate;

    if (usesBirthCertificate) {
      fields.add('birth_certificate_front_image');
    } else if (!this.nidVerifiedHead) {
      fields.add('citizenship_front_image');
      fields.add('citizenship_back_image');
    }

    if (this.headData.is_target_group && this.headData.target_group_type !== 'senior_citizen') {
      fields.add('target_group_front_image');
      fields.add('target_group_back_image');
    }

    if (!this.temporarySameAsPermanent) {
      fields.add('basai_sarai_front');
      fields.add('basai_sarai_back');
    }

    return fields;
  }

  private clearInactiveHouseholdHeadUploads(): void {
    const activeFields = this.activeHouseholdHeadUploadFields();

    HOUSEHOLD_HEAD_UPLOAD_FIELDS.forEach(field => {
      if (activeFields.has(field)) {
        return;
      }

      this.headData[field] = null;
      if (field === 'citizenship_front_image') this.citizenshipFrontPreview = '';
      else if (field === 'citizenship_back_image') this.citizenshipBackPreview = '';
      else if (field === 'birth_certificate_front_image') this.birthCertificateFrontPreview = '';
      else if (field === 'target_group_front_image') this.targetGroupFrontPreview = '';
      else if (field === 'target_group_back_image') this.targetGroupBackPreview = '';
      else if (field === 'basai_sarai_front') this.basaiSaraiFrontPreview = '';
      else if (field === 'basai_sarai_back') this.basaiSaraiBackPreview = '';
    });
  }

  private householdHeadUploadErrorKey(): string | null {
    const limits = this.uploadLimits();
    const activeFields = this.activeHouseholdHeadUploadFields();
    let totalBytes = 0;

    activeFields.forEach(field => {
      const value = this.headData[field];
      if (!(value instanceof Blob)) {
        return;
      }

      totalBytes += value.size;
    });

    for (const field of activeFields) {
      const value = this.headData[field];
      if (value instanceof Blob && limits.max_file_bytes > 0 && value.size > limits.max_file_bytes) {
        return 'wizard.upload_file_too_large';
      }
    }

    if (limits.max_post_bytes > 0 && totalBytes > limits.max_post_bytes) {
      return 'wizard.upload_total_too_large';
    }

    return null;
  }

  private buildHouseholdHeadFormData(): FormData {
    if (this.temporarySameAsPermanent) {
      this.copyPermanentToTemporary();
    }
    const usesBirthCertificate = this.syncHouseholdHeadDocumentType();
    this.clearInactiveHouseholdHeadUploads();
    this.applyParentNameData(this.headData);
    const activeUploadFields = this.activeHouseholdHeadUploadFields();

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
      first_service_point_id: this.firstServicePointId,
    }).forEach(([key, val]) => {
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val !== null && val !== undefined && val !== '') fd.append(key, String(val));
    });

    const skippedIdentityFields = usesBirthCertificate
      ? new Set(['citizenship_number', 'citizenship_issue_date', 'citizenship_issue_district', 'citizenship_front_image', 'citizenship_back_image'])
      : new Set(['birth_certificate_number', 'birth_certificate_issue_date', 'birth_certificate_front_image']);

    Object.keys(this.headData).forEach(key => {
      if (key === 'middle_name' || key === 'middle_name_ne') return;
      if (skippedIdentityFields.has(key)) return;
      const val = this.headData[key];
      if (val === null || val === undefined) return;
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val instanceof Blob) {
        if (!activeUploadFields.has(key)) return;
        fd.append(key, val, `${key}.jpg`); return;
      }
      if (val !== '') {
        const stringValue = key === 'national_id'
          ? canonicalNid(val)
          : key === 'citizenship_number'
            ? normalizeDigitsOnly(String(val))
            : String(val);
        if (stringValue !== '') fd.append(key, stringValue);
      }
    });

    return fd;
  }

  async saveDraft() {
    this.savingDraft = true;
    if (this.currentStep === 1) {
      this.syncHouseholdHeadDocumentType();
      if (!this.headData.first_name || !this.headData.last_name || !this.headData.gender ||
          !this.headData.date_of_birth || !this.headData.mobile_number ||
          !this.headData.marital_status) {
      this.showToast(this.t('wizard.required_before_save'), 'warning');
        this.savingDraft = false; return;
      }
      if (!/^\d{10}$/.test(this.headData.mobile_number)) {
      this.showToast(this.t('wizard.mobile_digits'), 'warning');
        this.savingDraft = false; return;
      }
      if (this.headData.national_id && !this.isValidNid(this.headData.national_id)) {
        this.showToast(this.t('wizard.nid_invalid_length'), 'warning');
        this.savingDraft = false; return;
      }
      if (this.hasInvalidNepaliNameParts(this.headData, HOUSEHOLD_HEAD_NEPALI_NAME_FIELDS)) {
        this.showToast(this.t('wizard.nepali_name_format'), 'warning');
        this.savingDraft = false; return;
      }
      const headAge = this.calculateAge(this.headData.date_of_birth);
      if (headAge < 1 || headAge > 100) {
        this.showToast(this.t('wizard.head_age_range'), 'warning');
        this.savingDraft = false; return;
      }
      if (this.householdHeadUsesBirthCertificate) {
        if (!this.headData.birth_certificate_number || !this.headData.birth_certificate_issue_date ||
            (!this.headData.birth_certificate_front_image && !this.birthCertificateFrontPreview)) {
          this.showToast(this.t('wizard.birth_certificate_required'), 'warning');
          this.savingDraft = false; return;
        }
      } else if (!this.headData.citizenship_number || !this.headData.citizenship_issue_date ||
          !this.headData.citizenship_issue_district) {
        this.showToast(this.t('wizard.required_before_save'), 'warning');
        this.savingDraft = false; return;
      } else if (!this.hasValidCitizenshipIssueDate(this.headData.date_of_birth, this.headData.citizenship_issue_date)) {
        this.showToast(this.t('wizard.citizenship_issue_age'), 'warning');
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
      error: (err) => {
        this.savingDraft = false;
        this.showToast(this.errorMessage(err, 'wizard.draft_failed'), 'danger');
      },
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
      first_service_point_id: '',
      occupation: '',
      document_type: '',
      citizenship_number: '', citizenship_issue_date: currentBs, citizenship_issue_district: '',
      birth_certificate_number: '', birth_certificate_issue_date: currentBs,
      is_target_group: false,
      target_group_type: '', target_group_id_number: '',
      photo: null, citizenship_front_image: null, citizenship_back_image: null,
      birth_certificate_front_image: null,
      target_group_front_image: null, target_group_back_image: null,
    };
    this.memberPhotoPreview = '';
    this.memberCitizenshipFrontPreview = '';
    this.memberCitizenshipBackPreview = '';
    this.memberBirthCertFrontPreview = '';
    this.memberTargetGroupFrontPreview = '';
    this.memberTargetGroupBackPreview = '';
    this.nidNumberMember = ''; this.nidMessageMember = '';
    this.nidVerifiedMember = false;
    this.showNidGateMember = true;
    this.showMemberForm = false;
  }

  showAddMember() {
    this.resetMemberForm();
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
      first_service_point_id: member.first_service_point_id || '',
      first_service_point: member.first_service_point || '',
      occupation: member.occupation || '',
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
      target_group_front_image: null,
      target_group_back_image: null,
    };

    this.memberPhotoPreview = this.getDocUrl(member, 'photo') || '';
    this.memberCitizenshipFrontPreview = this.getDocUrl(member, 'citizenship_front') || '';
    this.memberCitizenshipBackPreview = this.getDocUrl(member, 'citizenship_back') || '';
    this.memberBirthCertFrontPreview = this.getDocUrl(member, 'birth_certificate_front') || '';
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
    this.applyMemberRelationshipGender(this.newMember.relationship);

    if (!this.newMember.first_name || !this.newMember.last_name ||
        !this.newMember.gender || !this.newMember.date_of_birth || !this.newMember.relationship) {
      this.showToast(this.t('wizard.member_required'), 'warning'); return;
    }
    if (this.hasInvalidNepaliNameParts(this.newMember, MEMBER_NEPALI_NAME_FIELDS)) {
      this.showToast(this.t('wizard.nepali_name_format'), 'warning'); return;
    }

    const relationship = this.normalizeKey(this.newMember.relationship);
    if (this.isRelationshipBlockedForHead(relationship)) {
      this.showToast(this.t('wizard.relationship_marital_status_block'), 'warning'); return;
    }
    if (!relationship || !this.availableMemberRelationshipOptions.some(option => option.value === relationship)) {
      this.showToast(this.t('wizard.relationship_invalid'), 'warning'); return;
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
    if (docType === 'citizenship' && this.newMember.citizenship_issue_date &&
        !this.hasValidCitizenshipIssueDate(this.newMember.date_of_birth, this.newMember.citizenship_issue_date)) {
      this.showToast(this.t('wizard.citizenship_issue_age'), 'warning'); return;
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
      'first_service_point',
    ]);
    Object.keys(this.newMember).forEach(key => {
      if (skippedMemberFields.has(key)) return;
      const val = this.newMember[key];
      if (key === 'first_service_point_id' && (val === null || val === undefined || val === '')) {
        fd.append(key, '');
        return;
      }
      if (val === null || val === undefined || val === '') return;
      if (typeof val === 'boolean') { fd.append(key, val ? '1' : '0'); return; }
      if (val instanceof Blob) { fd.append(key, val, `${key}.jpg`); return; }
      if (key === 'citizenship_number') {
        const digits = normalizeDigitsOnly(String(val));
        if (digits !== '') fd.append(key, digits);
        return;
      }
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
      error: (err) => {
        this.savingMember = false;
        this.showToast(this.errorMessage(err, 'wizard.member_save_failed'), 'danger');
      },
    });
  }

  async removeMember(member: FamilyMember) {
    const removalDocumentRequired = requiresRemovalDocument(member, {
      enrollmentStatus: this.enrollment?.status,
      enrollmentApprovedAt: this.enrollment?.approved_at,
    });
    const deathDocument = removalDocumentRequired ? await this.selectRemovalDocument() : undefined;
    if (removalDocumentRequired && !deathDocument) {
      this.showToast(this.t('wizard.death_document_required'), 'warning');
      return;
    }
    const removalDocument = deathDocument ?? undefined;

    const alert = await this.alertCtrl.create({
      header: this.t('wizard.remove_member_header'),
      message: `${this.t('wizard.remove_member_message')} ${member.first_name} ${member.last_name}`,
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('common.delete'), cssClass: 'danger',
          handler: () => {
            this.enrollmentSvc.removeMember(this.enrollmentId, member.id, removalDocument).subscribe({
              next: () => {
                this.members = this.members.filter(m => m.id !== member.id);
                this.showToast(this.t('wizard.member_removed'), 'success');
              },
              error: () => {
                this.showToast(this.t('wizard.member_remove_failed'), 'danger');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private selectRemovalDocument(): Promise<File | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      let resolved = false;
      const finish = (file: File | null) => {
        if (resolved) {
          return;
        }

        resolved = true;
        window.removeEventListener('focus', handleFocus);
        resolve(file);
      };
      const handleFocus = () => {
        window.setTimeout(() => {
          if (!input.files?.length) {
            finish(null);
          }
        }, 300);
      };
      input.type = 'file';
      input.accept = 'image/jpg,image/jpeg,image/png,application/pdf';
      input.onchange = (event: Event) => {
        const file = (event.target as HTMLInputElement | null)?.files?.[0] ?? null;
        if (!file) {
          finish(null);
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          this.showToast(this.t('wizard.death_document_size'), 'danger');
          finish(null);
          return;
        }

        finish(file);
      };
      input.addEventListener('cancel', () => finish(null), { once: true });
      window.addEventListener('focus', handleFocus, { once: true });
      input.click();
    });
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
           'birth_certificate_front_image'
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
      const maxFileBytes = this.uploadLimits().max_file_bytes;
      if (maxFileBytes > 0 && file.size > maxFileBytes) { this.showToast(this.t('wizard.image_size'), 'danger'); return; }
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
      else if (field === 'birth_certificate_front_image') this.birthCertificateFrontPreview = dataUrl;
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

  get hasBlockedRelationshipOptions(): boolean {
    const blocked = blockedRelationshipsForHeadMaritalStatus(
      this.relationshipBlockedByHeadMaritalStatus,
      this.headData?.marital_status,
    );
    return blocked.some(relationship => this.relationshipOptions.some(option => option.value === relationship));
  }

  get availableMemberRelationshipOptions(): Array<{ value: string; label: string }> {
    const blocked = blockedRelationshipsForHeadMaritalStatus(
      this.relationshipBlockedByHeadMaritalStatus,
      this.headData?.marital_status,
    );
    if (!blocked.length) {
      return this.relationshipOptions;
    }

    return this.relationshipOptions.filter(option => !blocked.includes(option.value));
  }

  private isRelationshipBlockedForHead(relationship: string): boolean {
    return isRelationshipBlockedForHeadMaritalStatus(
      this.relationshipBlockedByHeadMaritalStatus,
      this.headData?.marital_status,
      relationship,
    );
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

  private applyMemberRelationshipGender(relationship: unknown): void {
    const gender = genderForRelationship(this.relationshipGenderMap, relationship);
    if (gender) {
      this.newMember.gender = gender;
    }
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

  private get registeredEmail(): string {
    return this.authService.getCurrentUser()?.email?.trim() || '';
  }

  private applyRegisteredContactDetails(): void {
    if (!this.headData.mobile_number && this.registeredMobileNumber) {
      this.headData.mobile_number = this.registeredMobileNumber;
    }

    if (!this.headData.email && this.registeredEmail) {
      this.headData.email = this.registeredEmail;
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

  getConfirmationLabel(type: string): string {
    if (type === 'normal') {
      return this.t('wizard.normal');
    }

    return this.languageService.label('target_group', type, type);
  }

  getBenefitLabel(result: SubsidyResult): string {
    if (result.benefit_type === 'full_premium_waiver') return this.t('benefit.full_premium_waiver');
    if (result.benefit_type === 'percentage_discount') return `${this.formatNumber(result.benefit_value)}% ${this.t('benefit.percentage_discount')}`;
    if (result.benefit_type === 'fixed_discount') return `${this.formatCurrency(result.benefit_value)} ${this.t('benefit.fixed_discount')}`;
    return this.languageService.translateText(result.benefit_type);
  }

  private async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message: this.languageService.translateText(message), duration: 2500, color, position: 'top' });
    await t.present();
  }

  private errorMessage(error: any, fallbackKey: string): string {
    const validationErrors = error?.error?.errors;
    const firstValidation = validationErrors
      ? Object.values(validationErrors).reduce<string | null>((found, value) => {
          if (found) return found;
          if (typeof value === 'string') return value;
          if (Array.isArray(value)) {
            return value.find((item): item is string => typeof item === 'string') || null;
          }
          return null;
        }, null)
      : null;
    const message = firstValidation || error?.error?.message;

    return this.languageService.translateText(message) || this.t(fallbackKey);
  }

  private isHouseholdHeadUnderSixteen(): boolean {
    if (!this.headData?.date_of_birth) {
      return false;
    }

    const age = this.calculateAge(this.headData.date_of_birth);
    return Number.isFinite(age) && age < 16;
  }

  private syncHouseholdHeadDocumentType(): boolean {
    const usesBirthCertificate = this.isHouseholdHeadUnderSixteen();
    this.headData.document_type = usesBirthCertificate ? 'birth_certificate' : 'citizenship';

    if (usesBirthCertificate) {
      this.headData.citizenship_number = '';
      this.headData.citizenship_issue_date = '';
      this.headData.citizenship_issue_district = '';
      this.headData.citizenship_front_image = null;
      this.headData.citizenship_back_image = null;
      this.citizenshipFrontPreview = '';
      this.citizenshipBackPreview = '';
      this.nidLockedHeadFields.delete('citizenship_number');
      this.nidLockedHeadFields.delete('citizenship_issue_date');
      this.nidLockedHeadFields.delete('citizenship_issue_district');
    } else {
      this.headData.birth_certificate_number = '';
      this.headData.birth_certificate_issue_date = '';
      this.headData.birth_certificate_front_image = null;
      this.birthCertificateFrontPreview = '';
    }

    return usesBirthCertificate;
  }

  private calculateAge(dob: string): number {
    if (!dob) {
      return 0;
    }

    if (typeof this.dateService.calculateAge === 'function') {
      return this.dateService.calculateAge(dob, 'bs');
    }

    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) {
      return 0;
    }
    if (parsed > new Date()) {
      return 100;
    }

    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const monthDelta = today.getMonth() - parsed.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsed.getDate())) {
      age--;
    }

    return age;
  }

  private hasValidCitizenshipIssueDate(dateOfBirth?: string, issueDate?: string): boolean {
    if (!dateOfBirth || !issueDate) {
      return false;
    }

    const validator = this.dateService.isCitizenshipIssueDateValid;
    return typeof validator === 'function'
      ? validator.call(this.dateService, dateOfBirth, issueDate, 'bs')
      : true;
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
