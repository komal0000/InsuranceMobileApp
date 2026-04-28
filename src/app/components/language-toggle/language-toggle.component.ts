import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AppLanguage, LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="language-toggle"
      [class.language-toggle-ne]="(language$ | async) === 'ne'"
      (click)="toggle()"
      aria-label="Switch language">
      <span>{{ (language$ | async) === 'ne' ? 'EN' : 'ने' }}</span>
    </button>
  `,
  styles: [`
    :host {
      position: fixed;
      right: 14px;
      bottom: calc(env(safe-area-inset-bottom) + 76px);
      z-index: 10000;
      pointer-events: none;
    }

    .language-toggle {
      pointer-events: auto;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: #003087;
      color: #fff;
      box-shadow: 0 8px 22px rgba(0, 48, 135, 0.25);
      font-size: 0.86rem;
      font-weight: 700;
      line-height: 1;
    }

    .language-toggle-ne {
      background: #0f766e;
    }

    @media (min-width: 768px) {
      :host {
        bottom: 18px;
      }
    }
  `],
})
export class LanguageToggleComponent {
  readonly language$ = this.languageService.language$;

  constructor(
    private authService: AuthService,
    private languageService: LanguageService
  ) {}

  toggle(): void {
    const next = this.languageService.toggleLanguage();

    if (!this.authService.isAuthenticated()) {
      void this.languageService.setLocalLanguage(next);
      return;
    }

    this.authService.updateLanguage(next as AppLanguage).subscribe({
      error: () => {
        void this.languageService.setLocalLanguage(next);
      },
    });
  }
}
