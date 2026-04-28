import { Directive, ElementRef, HostListener, Optional, Self } from '@angular/core';
import { NgModel } from '@angular/forms';
import { TransliterateService } from '../services/transliterate.service';

type IonInputEvent = CustomEvent<{ value?: string | null }> & {
  target: HTMLIonInputElement | null;
};

/**
 * Converts romanized Nepali text in Ionic inputs when the user commits the value.
 */
@Directive({
  selector: 'ion-input[appNepaliInput]',
  standalone: true,
})
export class NepaliInputDirective {
  private converting = false;

  constructor(
    private host: ElementRef<HTMLIonInputElement>,
    @Optional() @Self() private ngModel: NgModel,
    private transliterateService: TransliterateService,
  ) {}

  @HostListener('ionInput', ['$event'])
  onIonInput(event: IonInputEvent) {
    this.readValue(event);
  }

  @HostListener('ionChange', ['$event'])
  onIonChange(event: IonInputEvent) {
    this.normalizeValue(event);
  }

  @HostListener('ionBlur', ['$event'])
  onIonBlur(event: IonInputEvent) {
    this.normalizeValue(event);
  }

  private normalizeValue(event: IonInputEvent) {
    if (this.converting) {
      return;
    }

    const raw = this.readValue(event);
    if (!raw.trim()) {
      return;
    }

    const converted = this.transliterateService.transliterate(raw);
    if (converted === raw) {
      return;
    }

    this.converting = true;
    this.writeValue(converted);
    this.converting = false;
  }

  private readValue(event: IonInputEvent): string {
    const value = event.detail?.value ?? event.target?.value ?? this.host.nativeElement.value ?? '';
    return String(value);
  }

  private writeValue(value: string) {
    const ionEl = this.host.nativeElement;
    ionEl.value = value;
    void ionEl.getInputElement?.().then(input => {
      input.value = value;
    });

    if (this.ngModel?.control) {
      this.ngModel.control.setValue(value, { emitEvent: false });
      this.ngModel.viewToModelUpdate(value);
    }
  }
}
