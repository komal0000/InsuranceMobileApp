import { of } from 'rxjs';
import { EnrollmentWizardPage } from './enrollment-wizard.page';
import { ApiResponse } from '../../interfaces/api-response.interface';

describe('EnrollmentWizardPage', () => {
  function response(data: string[]): ApiResponse<string[]> {
    return {
      success: true,
      message: 'Loaded.',
      data,
    };
  }

  function toastController() {
    return {
      create: jasmine.createSpy().and.returnValue(Promise.resolve({
        present: jasmine.createSpy().and.returnValue(Promise.resolve()),
      })),
    };
  }

  function createPage(overrides: {
    enrollmentSvc?: unknown;
    geoSvc?: unknown;
    dateService?: unknown;
  } = {}) {
    return new EnrollmentWizardPage(
      {} as any,
      {} as any,
      (overrides.enrollmentSvc || {}) as any,
      (overrides.geoSvc || {}) as any,
      (overrides.dateService || {}) as any,
      toastController() as any,
      {} as any
    );
  }

  it('starts new household details behind the NID gate', () => {
    const page = createPage();

    expect(page.showNidGate2).toBeTrue();
    expect(page.showHouseholdHeadForm).toBeFalse();
  });

  it('manual NID fallback reveals the form and preserves the typed NID', () => {
    const page = createPage();
    page.nidNumber2 = ' 123456789 ';
    page.nidMessage2 = 'Lookup failed.';

    page.skipNidGate2();

    expect(page.showNidGate2).toBeFalse();
    expect(page.showHouseholdHeadForm).toBeTrue();
    expect(page.headData.national_id).toBe('123456789');
    expect(page.nidMessage2).toBe('');
    expect(page.nidLockedHeadFields.size).toBe(0);
  });

  it('prefills cascading location fields from mapped NID data', () => {
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Kathmandu']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Kathmandu Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['1', '2']))),
    };

    const page = new EnrollmentWizardPage(
      {} as any,
      {} as any,
      {} as any,
      geoSvc as any,
      {} as any,
      {} as any,
      {} as any
    );

    (page as any).applyNidLocation({
      province: 'Bagamati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
    });

    expect(page.step1.province).toBe('Bagamati');
    expect(page.step1.district).toBe('Kathmandu');
    expect(page.step1.municipality).toBe('Kathmandu Metropolitan City');
    expect(page.districts).toEqual(['Kathmandu']);
    expect(page.municipalities).toEqual(['Kathmandu Metropolitan City']);
    expect(page.wards).toEqual(['1', '2']);
    expect(geoSvc.districts).toHaveBeenCalledWith('Bagamati');
    expect(geoSvc.municipalities).toHaveBeenCalledWith('Bagamati', 'Kathmandu');
    expect(geoSvc.wards).toHaveBeenCalledWith('Bagamati', 'Kathmandu', 'Kathmandu Metropolitan City');
  });

  it('loads mapped household-head NID address, citizenship district, and JPEG photo', () => {
    const enrollmentSvc = {
      headNidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          national_id: '123456789',
          first_name: 'Komal',
          last_name: 'Shrestha',
          citizenship_number: '311022/65843',
          citizenship_issue_date_bs: '2066-08-04',
          citizenship_issue_district: 'Makawanpur',
          province: 'Bagamati',
          district: 'Makawanpur',
          municipality: 'Hetauda Sub-Metropolitan City',
          ward_number: '9',
          tole_village: 'Madanpath',
          photo_url: 'data:image/jpeg;base64,abc123',
        },
      })),
    };
    const geoSvc = {
      districts: jasmine.createSpy().and.returnValue(of(response(['Makawanpur']))),
      municipalities: jasmine.createSpy().and.returnValue(of(response(['Hetauda Sub-Metropolitan City']))),
      wards: jasmine.createSpy().and.returnValue(of(response(['9', '10']))),
    };

    const page = new EnrollmentWizardPage(
      {} as any,
      {} as any,
      enrollmentSvc as any,
      geoSvc as any,
      { formatForDisplay: (_ad?: string, bs?: string) => bs || '' } as any,
      toastController() as any,
      {} as any
    );

    page.enrollmentId = 4;
    page.nidNumber2 = '123456789';
    page.lookupNid2();

    expect(page.step1.province).toBe('Bagamati');
    expect(page.step1.district).toBe('Makawanpur');
    expect(page.step1.municipality).toBe('Hetauda Sub-Metropolitan City');
    expect(page.step1.ward_number).toBe('9');
    expect(page.step1.tole_village).toBe('Madanpath');
    expect(page.headData.citizenship_issue_district).toBe('Makawanpur');
    expect(page.headPhotoPreview).toBe('data:image/jpeg;base64,abc123');
    expect(page.isHeadFieldReadonly('citizenship_issue_district')).toBeTrue();
    expect(enrollmentSvc.headNidLookup).toHaveBeenCalledWith(4, '123456789');
  });

  it('loads member NID citizenship district and JPEG photo preview', () => {
    const enrollmentSvc = {
      nidLookup: jasmine.createSpy().and.returnValue(of({
        success: true,
        message: 'Verified.',
        data: {
          first_name: 'Sita',
          last_name: 'Shrestha',
          citizenship_number: '98765',
          citizenship_issue_date_bs: '2070-01-02',
          citizenship_issue_district: 'Makawanpur',
          photo_url: 'data:image/jpeg;base64,member123',
        },
      })),
    };

    const page = new EnrollmentWizardPage(
      {} as any,
      {} as any,
      enrollmentSvc as any,
      {} as any,
      { formatForDisplay: (_ad?: string, bs?: string) => bs || '' } as any,
      toastController() as any,
      {} as any
    );

    page.nidNumberMember = '123456789';
    page.lookupNidMember();

    expect(page.newMember.citizenship_issue_district).toBe('Makawanpur');
    expect(page.memberPhotoPreview).toBe('data:image/jpeg;base64,member123');
    expect(page.nidVerifiedMember).toBeTrue();
    expect(enrollmentSvc.nidLookup).toHaveBeenCalledWith('123456789');
  });
});
