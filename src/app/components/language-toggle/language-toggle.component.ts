import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
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
      [class.language-toggle-toolbar]="placement === 'toolbar'"
      [class.language-toggle-ne]="(language$ | async) === 'ne'"
      (click)="toggle()"
      [attr.aria-label]="languageService.t('common.switch_language')">
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

    :host(.language-toggle-toolbar-host) {
      position: static;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-inline-end: 8px;
      pointer-events: auto;
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

    .language-toggle-toolbar {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.45);
      background: rgba(255, 255, 255, 0.16);
      box-shadow: none;
      font-size: 0.78rem;
    }

    .language-toggle-ne {
      background: #0f766e;
    }

    .language-toggle-toolbar.language-toggle-ne {
      border-color: rgba(255, 255, 255, 0.55);
      background: rgba(15, 118, 110, 0.9);
    }

    @media (min-width: 768px) {
      :host {
        bottom: 18px;
      }
    }
  `],
})
export class LanguageToggleComponent {
  @Input() placement: 'floating' | 'toolbar' = 'floating';

  @HostBinding('class.language-toggle-toolbar-host')
  get toolbarHost(): boolean {
    return this.placement === 'toolbar';
  }

  readonly language$ = this.languageService.language$;

  constructor(
    private authService: AuthService,
    public languageService: LanguageService
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
