import { HttpClient } from '@angular/common/http';
import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';

@Directive({
  selector: 'img[appAuthenticatedImage]',
  standalone: true,
})
export class AuthenticatedImageDirective implements OnChanges, OnDestroy {
  @Input('appAuthenticatedImage') imageUrl: string | null | undefined;

  private readonly img = inject(ElementRef<HTMLImageElement>).nativeElement;
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private request?: Subscription;
  private objectUrl?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if ('imageUrl' in changes) {
      this.loadImage(this.imageUrl);
    }
  }

  ngOnDestroy(): void {
    this.cancelRequest();
    this.revokeObjectUrl();
  }

  private loadImage(value: string | null | undefined): void {
    this.cancelRequest();
    this.revokeObjectUrl();

    const normalizedUrl = this.api.formatImageUrl(value);
    if (!normalizedUrl) {
      this.clearImage();
      return;
    }

    if (!this.shouldFetchAsBlob(normalizedUrl)) {
      this.img.src = normalizedUrl;
      return;
    }

    this.clearImage();
    this.request = this.http.get(normalizedUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.img.src = this.objectUrl;
      },
      error: () => {
        this.clearImage();
      },
    });
  }

  private shouldFetchAsBlob(url: string): boolean {
    if (!/^https?:\/\//i.test(url)) {
      return false;
    }

    try {
      const path = new URL(url).pathname;
      return path.startsWith('/api/documents/') || path.startsWith('/documents/');
    } catch {
      return false;
    }
  }

  private clearImage(): void {
    this.img.removeAttribute('src');
  }

  private cancelRequest(): void {
    this.request?.unsubscribe();
    this.request = undefined;
  }

  private revokeObjectUrl(): void {
    if (!this.objectUrl) {
      return;
    }

    URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }
}
