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
});
