import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthenticatedImageDirective } from './authenticated-image.directive';

@Component({
  standalone: true,
  imports: [AuthenticatedImageDirective],
  template: '<img [appAuthenticatedImage]="src" alt="preview">',
})
class HostComponent {
  src: string | null = null;
}

describe('AuthenticatedImageDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let http: jasmine.SpyObj<{ get: (...args: unknown[]) => unknown }>;
  let api: { formatImageUrl: jasmine.Spy };

  beforeEach(async () => {
    http = jasmine.createSpyObj('HttpClient', ['get']);
    api = {
      formatImageUrl: jasmine.createSpy('formatImageUrl').and.callFake((url: string | null | undefined) => url || null),
    };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: HttpClient, useValue: http },
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('passes through local data URLs without fetching', () => {
    const dataUrl = 'data:image/png;base64,abc';

    fixture.componentInstance.src = dataUrl;
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(dataUrl);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('fetches protected document URLs as blobs and sets an object URL', () => {
    const protectedUrl = 'http://localhost:8000/api/documents/member/1/photo.jpg';
    const blob = new Blob(['image'], { type: 'image/jpeg' });
    const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:protected-photo');
    spyOn(URL, 'revokeObjectURL');
    http.get.and.returnValue(of(blob));

    fixture.componentInstance.src = protectedUrl;
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(http.get).toHaveBeenCalledWith(protectedUrl, { responseType: 'blob' });
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(img.getAttribute('src')).toBe('blob:protected-photo');
  });

  it('clears the image when a protected document fetch fails', () => {
    const protectedUrl = 'http://localhost:8000/api/documents/member/1/photo.jpg';
    http.get.and.returnValue(throwError(() => new Error('unauthorized')));

    fixture.componentInstance.src = protectedUrl;
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.hasAttribute('src')).toBeFalse();
  });

  it('revokes created object URLs on destroy', () => {
    const protectedUrl = 'http://localhost:8000/api/documents/member/1/photo.jpg';
    spyOn(URL, 'createObjectURL').and.returnValue('blob:protected-photo');
    const revokeObjectUrl = spyOn(URL, 'revokeObjectURL');
    http.get.and.returnValue(of(new Blob(['image'], { type: 'image/jpeg' })));

    fixture.componentInstance.src = protectedUrl;
    fixture.detectChanges();
    fixture.destroy();

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:protected-photo');
  });
});
