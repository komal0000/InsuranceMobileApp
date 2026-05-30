import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(value: string): string {
    return this.languageService.t(value);
  }
}
