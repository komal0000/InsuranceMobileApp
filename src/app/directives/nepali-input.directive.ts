import { Directive, HostListener, Optional, Self } from '@angular/core';
import { NgModel } from '@angular/forms';
import nepalify from 'nepalify';

/**
 * Directive for ion-input that transliterates English keystrokes to Nepali (Devanagari).
 * Uses nepalify.format() (romanized layout) on every ionInput event.
 * nepalify.format() is idempotent on already-converted Devanagari characters.
 *
 * Usage:
 *   <ion-input appNepaliInput [(ngModel)]="model.first_name_ne"></ion-input>
 */
@Directive({
  selector: 'ion-input[appNepaliInput]',
  standalone: true,
})
export class NepaliInputDirective {
  private converting = false;

  constructor(
    @Optional() @Self() private ngModel: NgModel,
  ) {}

  @HostListener('ionInput', ['$event'])
  onIonInput(event: any) {
    if (this.converting) return;

    const ionEl = event.target;
    const raw: string = ionEl?.value ?? '';
    if (!raw) return;

    const converted = nepalify.format(raw);
    if (converted === raw) return;

    this.converting = true;
    ionEl.value = converted;

    if (this.ngModel?.control) {
      this.ngModel.control.setValue(converted, { emitEvent: false });
      this.ngModel.viewToModelUpdate(converted);
    }
    this.converting = false;
  }
}
