import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonIcon, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarClearOutline, calendarOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { DateService } from '../../services/date.service';
import { LanguageService } from '../../services/language.service';

interface BsDateValue {
  year: number;
  month: number;
  day: number;
}

interface CalendarCell {
  day: number;
  iso: string;
  selected: boolean;
  today: boolean;
}

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const FALLBACK_TODAY: BsDateValue = { year: 2081, month: 12, day: 6 };
const MIN_SELECTABLE_YEAR = 1970;
const MAX_SELECTABLE_YEAR = 2100;

@Component({
  selector: 'app-bs-date-picker',
  standalone: true,
  imports: [CommonModule, IonIcon, IonModal],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BsDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="picker-shell">
      <label *ngIf="label" class="picker-label">
        {{ label }}<span *ngIf="required"> *</span>
      </label>

      <div class="trigger-field" [class.is-disabled]="disabled" [class.is-invalid]="inputInvalid">
        <input
          type="text"
          class="trigger-input"
          [value]="inputValue"
          [placeholder]="effectivePlaceholder"
          [disabled]="disabled"
          inputmode="numeric"
          maxlength="10"
          autocomplete="off"
          aria-label="BS date"
          (input)="onTextInput($event)"
          (blur)="onTextBlur()"
          (keydown.enter)="onTextEnter($event)"
        />

        <button
          type="button"
          class="trigger-icon"
          [attr.aria-label]="t('common.select_bs_date')"
          [disabled]="disabled"
          (click)="openSheet(); $event.stopPropagation()"
        >
          <ion-icon name="calendar-outline"></ion-icon>
        </button>
      </div>
    </div>

    <ion-modal
      [isOpen]="isOpen"
      (didDismiss)="closeSheet()"
      [breakpoints]="[0, 0.55, 0.7]"
      [initialBreakpoint]="0.55"
      [backdropDismiss]="true"
      [showBackdrop]="true"
      cssClass="bs-date-modal"
    >
      <ng-template>
        <div class="sheet-panel">
          <div class="sheet-handle" aria-hidden="true"></div>

          <header class="sheet-header">
            <div class="header-copy">
              <span class="header-label">{{ t('common.bikram_sambat') }}</span>
              <strong class="header-title">{{ selectedFullDate || t('common.select_bs_date') }}</strong>
            </div>
          </header>

          <div class="calendar-toolbar">
            <button type="button" class="nav-button" (click)="goToPreviousMonth()" [attr.aria-label]="t('common.previous_month')">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>

            <div class="select-group">
              <select class="picker-select month-select" (change)="onMonthChange($event)">
                <option *ngFor="let month of months; let index = index" [value]="index + 1" [selected]="index + 1 === viewMonth">
                  {{ month }}
                </option>
              </select>

              <select class="picker-select year-select" (change)="onYearChange($event)">
                <option *ngFor="let year of years" [value]="year" [selected]="year === viewYear">{{ formatNumberForLocale(year) }}</option>
              </select>
            </div>

            <button type="button" class="nav-button" (click)="goToNextMonth()" [attr.aria-label]="t('common.next_month')">
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>

          <div class="weekday-row">
            <span
              *ngFor="let dayName of weekdayLabels; let index = index"
              class="weekday"
              [class.saturday]="index === 6"
            >
              {{ dayName }}
            </span>
          </div>

          <div class="calendar-grid">
            <div *ngFor="let _ of leadingPlaceholders" class="day-placeholder"></div>

            <button
              *ngFor="let cell of calendarCells"
              type="button"
              class="day-cell"
              [class.is-today]="cell.today"
              [class.is-selected]="cell.selected"
              (click)="selectDay(cell.day)"
            >
              <span class="day-number">{{ formatNumberForLocale(cell.day) }}</span>
              <span *ngIf="cell.today && !cell.selected" class="today-dot" aria-hidden="true"></span>
            </button>
          </div>

          <footer class="sheet-footer">
            <button type="button" class="footer-button subtle" (click)="selectToday()">
              <ion-icon name="calendar-clear-outline"></ion-icon>
              <span>{{ t('common.today') }}</span>
            </button>

            <button type="button" class="footer-button accent" (click)="closeSheet()">
              <span>{{ t('common.confirm') }}</span>
            </button>
          </footer>

          <button *ngIf="selectedDate" type="button" class="clear-link" (click)="clearSelection()">
            {{ t('common.clear') }}
          </button>
        </div>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      color: #4a1010;
      font-size: 14px;
    }

    * {
      box-sizing: border-box;
    }

    .picker-shell {
      width: 100%;
    }

    .picker-label {
      display: inline-block;
      margin-bottom: 6px;
      color: #6b0f0f;
      font-size: 14px;
      font-weight: 600;
    }

    .trigger-field {
      width: 100%;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 12px;
      border: 1px solid rgba(139, 26, 26, 0.18);
      border-radius: 12px;
      background: #fff;
      color: inherit;
      text-align: left;
      box-shadow: 0 3px 10px rgba(107, 15, 15, 0.06);
    }

    .trigger-field.is-disabled {
      opacity: 0.6;
      box-shadow: none;
    }

    .trigger-field.is-invalid {
      border-color: #dc3545;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.12);
    }

    .trigger-input {
      flex: 1;
      min-width: 0;
      width: 100%;
      border: 0;
      outline: none;
      background: transparent;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.35;
      color: #5d1b1b;
    }

    .trigger-input::placeholder {
      color: #9a6d6d;
      font-weight: 500;
    }

    .trigger-input:disabled {
      opacity: 1;
    }

    .trigger-icon,
    .nav-button,
    .day-cell,
    .footer-button {
      min-width: 44px;
      min-height: 44px;
    }

    .trigger-icon {
      width: 44px;
      height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 12px;
      background: #8b1a1a;
      color: #fff;
      font-size: 20px;
      flex-shrink: 0;
      cursor: pointer;
    }

    .sheet-panel {
      width: 100%;
      max-width: 316px;
      margin: 0 auto;
      padding: 8px 12px 16px;
      background: #fff;
      color: #4a1010;
      font-size: 14px;
    }

    .sheet-handle {
      width: 28px;
      height: 3px;
      border-radius: 999px;
      background: rgba(107, 15, 15, 0.2);
      margin: 0 auto 6px;
    }

    .sheet-header {
      padding: 0 4px 6px;
    }

    .header-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-label {
      color: #8b1a1a;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .header-title {
      color: #4a1010;
      font-size: 15px;
      line-height: 1.2;
      font-weight: 700;
    }

    .calendar-toolbar {
      display: grid;
      grid-template-columns: 36px minmax(0, 1fr) 36px;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
    }

    .nav-button {
      border: 0;
      border-radius: 999px;
      background: #f8eaea;
      color: #8b1a1a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      min-height: 36px;
      font-size: 16px;
    }

    .select-group {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 82px;
      gap: 6px;
    }

    .picker-select {
      width: 100%;
      min-height: 36px;
      border: 1px solid rgba(139, 26, 26, 0.18);
      border-radius: 10px;
      background: #fff;
      color: #5d1b1b;
      font-size: 14px;
      font-weight: 600;
      padding: 0 9px;
      outline: none;
    }

    .picker-select:focus {
      border-color: #8b1a1a;
      box-shadow: 0 0 0 3px rgba(139, 26, 26, 0.14);
    }

    .weekday-row,
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 2px;
    }

    .weekday-row {
      margin-bottom: 2px;
    }

    .weekday {
      min-height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7d5757;
      font-size: 10px;
      font-weight: 600;
    }

    .weekday.saturday {
      color: #b22222;
    }

    .day-placeholder {
      min-height: 32px;
      aspect-ratio: 1;
    }

    .day-cell {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      border: 0;
      min-width: 32px;
      min-height: 32px;
      border-radius: 999px;
      background: transparent;
      color: #4a1010;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .day-number {
      position: relative;
      z-index: 1;
    }

    .day-cell.is-today {
      box-shadow: inset 0 0 0 1px rgba(91, 36, 205, 0.25);
      color: #5b24cd;
    }

    .day-cell.is-selected {
      background: linear-gradient(135deg, #6f3dff 0%, #4f2de0 100%);
      color: #fff;
      box-shadow: 0 10px 18px rgba(93, 55, 229, 0.28);
    }

    .today-dot {
      position: absolute;
      left: 50%;
      bottom: 5px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #c8971a;
      transform: translateX(-50%);
    }

    .sheet-footer {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
    }

    .footer-button {
      border: 0;
      border-radius: 999px;
      min-height: 36px;
      font-size: 13px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 10px;
    }

    .footer-button.accent {
      background: linear-gradient(135deg, #6f3dff 0%, #4f2de0 100%);
      color: #fff;
      box-shadow: 0 10px 20px rgba(93, 55, 229, 0.22);
    }

    .footer-button.subtle {
      background: #f3edff;
      color: #5b24cd;
    }

    .clear-link {
      width: 100%;
      margin-top: 8px;
      border: 0;
      background: transparent;
      color: #9a6d6d;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
    }

    .trigger-field:active,
    .nav-button:active,
    .day-cell:active,
    .footer-button:active,
    .clear-link:active {
      transform: scale(0.96);
    }

    @media (max-width: 360px) {
      .select-group {
        grid-template-columns: minmax(0, 1fr) 76px;
      }

      .day-cell {
        min-width: 30px;
        min-height: 30px;
        font-size: 11px;
      }
    }
  `],
})
export class BsDatePickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Output() bsDateChange = new EventEmitter<string>();

  readonly englishMonths = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashoj', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  readonly nepaliMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
  readonly englishWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly nepaliWeekdays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];
  readonly years: number[];

  isOpen = false;
  selectedDate: BsDateValue | null = null;
  todayDate: BsDateValue;
  viewYear: number;
  viewMonth: number;
  inputValue = '';
  inputInvalid = false;

  private closeTimeout: ReturnType<typeof setTimeout> | null = null;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(
    private dateService: DateService,
    private languageService: LanguageService
  ) {
    addIcons({
      calendarClearOutline,
      calendarOutline,
      chevronBackOutline,
      chevronForwardOutline,
    });

    this.todayDate = this.resolveTodayDate();
    this.years = this.buildYearOptions();
    this.viewYear = this.todayDate.year;
    this.viewMonth = this.todayDate.month;
  }

  get displayValue(): string {
    return this.selectedDate ? this.formatNumberForLocale(this.toDisplayIso(this.selectedDate)) : '';
  }

  get selectedFullDate(): string {
    if (!this.selectedDate) {
      return '';
    }

    return this.displayValue;
  }

  get effectivePlaceholder(): string {
    return this.placeholder || this.t('common.select_bs_date');
  }

  get months(): string[] {
    return this.languageService.currentLanguage === 'ne' ? this.nepaliMonths : this.englishMonths;
  }

  get weekdayLabels(): string[] {
    return this.languageService.currentLanguage === 'ne' ? this.nepaliWeekdays : this.englishWeekdays;
  }

  get leadingPlaceholders(): null[] {
    return Array.from({ length: this.getMonthStartOffset(this.viewYear, this.viewMonth) }, () => null);
  }

  get calendarCells(): CalendarCell[] {
    const totalDays = this.getDaysInMonth(this.viewYear, this.viewMonth);

    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const nextDate = { year: this.viewYear, month: this.viewMonth, day };

      return {
        day,
        iso: this.toIso(nextDate),
        selected: this.isSameDate(this.selectedDate, nextDate),
        today: this.isSameDate(this.todayDate, nextDate),
      };
    });
  }

  writeValue(value: string | null): void {
    if (!value) {
      this.selectedDate = null;
      this.inputValue = '';
      this.inputInvalid = false;
      this.viewYear = this.todayDate.year;
      this.viewMonth = this.todayDate.month;
      return;
    }

    let parsed = this.parseBsDate(value);

    if (!parsed) {
      parsed = this.parseBsDate(this.dateService.adToBs(value));
    }

    if (!parsed || !this.isYearSelectable(parsed.year)) {
      this.selectedDate = null;
      this.inputValue = '';
      this.inputInvalid = false;
      this.viewYear = this.todayDate.year;
      this.viewMonth = this.todayDate.month;
      return;
    }

    this.selectedDate = parsed;
    this.viewYear = parsed.year;
    this.viewMonth = parsed.month;
    this.inputValue = this.displayValue;
    this.inputInvalid = false;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onTextInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.inputValue = raw.replace(/-/g, '/');
    this.inputInvalid = false;
  }

  onTextBlur(): void {
    this.commitTypedInput();
    this.onTouched();
  }

  onTextEnter(event: Event): void {
    event.preventDefault();
    this.commitTypedInput();
  }

  openSheet(): void {
    if (this.disabled) {
      return;
    }

    const hasValidSelection = this.selectedDate !== null && this.isYearSelectable(this.selectedDate.year);
    const focusDate: BsDateValue = hasValidSelection
      ? this.selectedDate as BsDateValue
      : this.todayDate;
    this.viewYear = focusDate.year;
    this.viewMonth = focusDate.month;
    this.isOpen = true;
    this.scrollSelectedIntoView();
  }

  closeSheet(): void {
    this.isOpen = false;
    this.onTouched();
  }

  onMonthChange(event: Event): void {
    const nextMonth = Number((event.target as HTMLSelectElement).value);
    if (nextMonth >= 1 && nextMonth <= 12) {
      this.viewMonth = nextMonth;
    }
  }

  onYearChange(event: Event): void {
    const nextYear = Number((event.target as HTMLSelectElement).value);
    if (this.years.includes(nextYear)) {
      this.viewYear = nextYear;
    }
  }

  goToPreviousMonth(): void {
    if (this.viewMonth === 1) {
      this.viewMonth = 12;
      this.viewYear = Math.max(MIN_SELECTABLE_YEAR, this.viewYear - 1);
      return;
    }

    this.viewMonth -= 1;
  }

  goToNextMonth(): void {
    if (this.viewMonth === 12) {
      this.viewMonth = 1;
      this.viewYear = Math.min(MAX_SELECTABLE_YEAR, this.viewYear + 1);
      return;
    }

    this.viewMonth += 1;
  }

  selectDay(day: number): void {
    this.commitValue({ year: this.viewYear, month: this.viewMonth, day });
    this.scrollSelectedIntoView();
    this.scheduleClose();
  }

  selectToday(): void {
    this.viewYear = this.todayDate.year;
    this.viewMonth = this.todayDate.month;
    this.commitValue(this.todayDate);
    this.scheduleClose();
  }

  clearSelection(): void {
    this.selectedDate = null;
    this.inputValue = '';
    this.inputInvalid = false;
    this.onChange('');
    this.bsDateChange.emit('');
    this.closeSheet();
  }

  ngOnDestroy(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }

  toNepaliNumber(value: string | number): string {
    return String(value).replace(/\d/g, digit => NEPALI_DIGITS[Number(digit)]);
  }

  t(key: string): string {
    return this.languageService.t(key);
  }

  formatNumberForLocale(value: string | number): string {
    return this.languageService.currentLanguage === 'ne'
      ? this.toNepaliNumber(value)
      : String(value);
  }

  private commitValue(date: BsDateValue): void {
    const iso = this.toIso(date);
    this.selectedDate = date;
    this.inputValue = this.displayValue;
    this.inputInvalid = false;
    this.onChange(iso);
    this.bsDateChange.emit(iso);
  }

  private commitTypedInput(): void {
    if (this.disabled) {
      return;
    }

    const raw = this.inputValue.trim();
    if (!raw) {
      this.clearSelection();
      return;
    }

    const parsed = this.parseBsDate(raw);
    if (!parsed) {
      this.inputInvalid = true;
      return;
    }

    this.viewYear = parsed.year;
    this.viewMonth = parsed.month;
    this.commitValue(parsed);
  }

  private scheduleClose(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    this.closeTimeout = setTimeout(() => this.closeSheet(), 180);
  }

  private scrollSelectedIntoView(): void {
    setTimeout(() => {
      document.querySelector('.day-cell.is-selected')?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }, 100);
  }

  private resolveTodayDate(): BsDateValue {
    const fromCurrentBs = this.parseBsDate(this.dateService.getCurrentBs());
    if (fromCurrentBs) {
      return fromCurrentBs;
    }

    const fromConvertedAd = this.parseBsDate(this.dateService.adToBs(new Date()));
    return fromConvertedAd ?? FALLBACK_TODAY;
  }

  private parseBsDate(value: string | null | undefined): BsDateValue | null {
    if (!value) {
      return null;
    }

    const normalized = this.normalizeDateInput(value);
    if (!normalized) {
      return null;
    }

    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const parsed = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };

    if (!this.isYearSelectable(parsed.year) || parsed.month < 1 || parsed.month > 12 || parsed.day < 1) {
      return null;
    }

    if (parsed.day > this.getDaysInMonth(parsed.year, parsed.month)) {
      return null;
    }

    return parsed;
  }

  private normalizeDateInput(value: string): string | null {
    const normalizedDigits = Array.from(value.trim()).map(char => {
      const index = NEPALI_DIGITS.indexOf(char);
      return index >= 0 ? String(index) : char;
    }).join('');
    const normalized = normalizedDigits.replace(/-/g, '/').replace(/\s+/g, '');
    const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

    if (!match) {
      return null;
    }

    return [
      match[1],
      match[2].padStart(2, '0'),
      match[3].padStart(2, '0'),
    ].join('-');
  }

  private buildYearOptions(): number[] {
    return Array.from(
      { length: MAX_SELECTABLE_YEAR - MIN_SELECTABLE_YEAR + 1 },
      (_, index) => MAX_SELECTABLE_YEAR - index,
    );
  }

  private isYearSelectable(year: number): boolean {
    return Number.isInteger(year) && year >= MIN_SELECTABLE_YEAR && year <= MAX_SELECTABLE_YEAR;
  }

  private toIso(date: BsDateValue): string {
    return [
      String(date.year).padStart(4, '0'),
      String(date.month).padStart(2, '0'),
      String(date.day).padStart(2, '0'),
    ].join('-');
  }

  private toDisplayIso(date: BsDateValue): string {
    return this.toIso(date).replace(/-/g, '/');
  }

  private getDaysInMonth(year: number, month: number): number {
    const currentMonthAd = this.toAdDate(this.toIso({ year, month, day: 1 }));
    const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    const nextMonthAd = this.toAdDate(this.toIso({ year: nextMonth.year, month: nextMonth.month, day: 1 }));

    if (currentMonthAd && nextMonthAd) {
      const diff = Math.round((nextMonthAd.getTime() - currentMonthAd.getTime()) / 86400000);
      if (diff >= 28 && diff <= 32) {
        return diff;
      }
    }

    return this.getFallbackDaysInMonth(year, month);
  }

  private getMonthStartOffset(year: number, month: number): number {
    const adDate = this.toAdDate(this.toIso({ year, month, day: 1 }));
    if (adDate) {
      return adDate.getUTCDay();
    }

    return this.getFallbackMonthStartOffset(year, month);
  }

  private toAdDate(bsIso: string): Date | null {
    const adIso = this.dateService.bsToAd(bsIso);
    const parts = this.parseIsoParts(adIso);

    if (!parts) {
      return null;
    }

    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  }

  private parseIsoParts(value: string | null | undefined): BsDateValue | null {
    if (!value) {
      return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  private getFallbackDaysInMonth(year: number, month: number): number {
    const fallback: Record<number, number[]> = {
      2081: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    };

    return fallback[year]?.[month - 1] ?? fallback[2081][month - 1];
  }

  private getFallbackMonthStartOffset(year: number, month: number): number {
    const anchorYear = 2081;
    const anchorMonth = 12;
    const anchorOffset = 2;

    if (year === anchorYear && month === anchorMonth) {
      return anchorOffset;
    }

    let offset = anchorOffset;
    let currentYear = anchorYear;
    let currentMonth = anchorMonth;

    while (currentYear < year || (currentYear === year && currentMonth < month)) {
      const daysInCurrentMonth = this.getFallbackDaysInMonth(currentYear, currentMonth);
      offset = (offset + (daysInCurrentMonth % 7)) % 7;

      if (currentMonth === 12) {
        currentMonth = 1;
        currentYear += 1;
      } else {
        currentMonth += 1;
      }
    }

    while (currentYear > year || (currentYear === year && currentMonth > month)) {
      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear -= 1;
      } else {
        currentMonth -= 1;
      }

      const previousDays = this.getFallbackDaysInMonth(currentYear, currentMonth);
      offset = (offset - (previousDays % 7) + 7) % 7;
    }

    return offset;
  }

  private isSameDate(left: BsDateValue | null, right: BsDateValue | null): boolean {
    if (!left || !right) {
      return false;
    }

    return left.year === right.year && left.month === right.month && left.day === right.day;
  }
}
