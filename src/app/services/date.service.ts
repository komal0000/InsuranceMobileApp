import { Injectable } from '@angular/core';
import {
  adToBs as convertAdToBs,
  bsToAd as convertBsToAd,
  fromDateInt as convertFromDateInt,
  getCurrentBS,
  getDaysInNepaliMonth,
  isValidNepaliDate,
  toDateInt as convertToDateInt,
} from '../../utils/nepali-calendar';

@Injectable({ providedIn: 'root' })
export class DateService {
  private readonly isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  adToBs(value: string | Date | null | undefined): string {
    const normalized = this.normalizeDate(value);
    if (!normalized) {
      return '';
    }

    if (!this.isAdDate(normalized)) {
      return normalized;
    }

    try {
      return convertAdToBs(normalized);
    } catch {
      return normalized;
    }
  }

  bsToAd(value: string | Date | null | undefined): string {
    const normalized = this.normalizeDate(value);
    if (!normalized) {
      return '';
    }

    if (this.isBsDate(normalized)) {
      try {
        return convertBsToAd(normalized);
      } catch {
        return normalized;
      }
    }

    if (this.isAdDate(normalized)) {
      return normalized;
    }

    return normalized;
  }

  getCurrentBs(): string {
    return getCurrentBS();
  }

  toDateInt(value: string | Date | null | undefined): number | null {
    const normalized = this.normalizeDate(value);
    return normalized ? convertToDateInt(normalized) : null;
  }

  fromDateInt(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }

    return convertFromDateInt(value);
  }

  isValidBsDate(value: string | null | undefined): boolean {
    return !!value && isValidNepaliDate(value);
  }

  getDaysInBsMonth(year: number, month: number): number {
    return getDaysInNepaliMonth(year, month);
  }

  formatForDisplay(adDate?: string | null, bsDate?: string | null): string {
    if (bsDate) {
      return this.normalizeDate(bsDate) ?? bsDate;
    }

    if (!adDate) {
      return '';
    }

    return this.adToBs(adDate);
  }

  formatDateTimeForDisplay(
    adDate?: string | null,
    bsDate?: string | null,
    includeSeconds = false
  ): string {
    const datePart = this.formatForDisplay(adDate, bsDate);
    if (!datePart) {
      return '';
    }

    const timePart = this.extractTime(adDate ?? bsDate ?? null);
    if (!timePart) {
      return datePart;
    }

    const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
    const safeTime = includeSeconds
      ? `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
      : `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;

    return `${datePart} ${safeTime}`;
  }

  toApiDate(value: string | Date | null | undefined): string {
    const normalized = this.normalizeDate(value);
    if (!normalized) {
      return '';
    }

    return this.isBsDate(normalized) ? this.bsToAd(normalized) : normalized;
  }

  calculateAge(value: string | Date | null | undefined): number {
    const adDate = this.toApiDate(value);
    const parts = this.extractIsoParts(adDate);
    if (!parts) {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - parts.year;
    const monthDiff = (today.getMonth() + 1) - parts.month;

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parts.day)) {
      age--;
    }

    return Math.max(age, 0);
  }

  preparePayloadForApi<T extends Record<string, unknown>>(payload: T, dateFields: string[]): T {
    const normalized = { ...payload } as Record<string, unknown>;

    for (const field of dateFields) {
      const bsField = `${field}_bs`;
      const raw = this.getStringValue(normalized[field]) ?? this.getStringValue(normalized[bsField]);

      if (!raw) {
        normalized[field] = null;
        normalized[bsField] = null;
        continue;
      }

      normalized[field] = this.toApiDate(raw);
      normalized[bsField] = this.normalizeDate(raw) ?? raw;
    }

    return normalized as T;
  }

  prepareFormDataForApi(formData: FormData, dateFields: string[]): FormData {
    const prepared = new FormData();
    const managedKeys = new Set<string>();

    for (const field of dateFields) {
      managedKeys.add(field);
      managedKeys.add(`${field}_bs`);
    }

    formData.forEach((value, key) => {
      if (!managedKeys.has(key)) {
        prepared.append(key, value);
      }
    });

    for (const field of dateFields) {
      const bsField = `${field}_bs`;
      const raw = this.getStringValue(formData.get(field)) ?? this.getStringValue(formData.get(bsField));

      if (!raw) {
        continue;
      }

      prepared.append(field, this.toApiDate(raw));
      prepared.append(bsField, this.normalizeDate(raw) ?? raw);
    }

    return prepared;
  }

  isBsDate(value: string | null | undefined): boolean {
    if (!value || !this.isoDatePattern.test(value)) {
      return false;
    }

    const year = Number(value.slice(0, 4));
    return year >= 2000 && year <= 2090 && this.isValidBsDate(value);
  }

  isAdDate(value: string | null | undefined): boolean {
    if (!value || !this.isoDatePattern.test(value)) {
      return false;
    }

    const year = Number(value.slice(0, 4));
    return year >= 1943 && year <= 2034;
  }

  private normalizeDate(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (this.isoDatePattern.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.length >= 10 && this.isoDatePattern.test(trimmed.slice(0, 10))) {
      return trimmed.slice(0, 10);
    }

    return null;
  }

  private getStringValue(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private extractIsoParts(value: string | null | undefined): { year: number; month: number; day: number } | null {
    if (!value || !this.isoDatePattern.test(value)) {
      return null;
    }

    return {
      year: Number(value.slice(0, 4)),
      month: Number(value.slice(5, 7)),
      day: Number(value.slice(8, 10)),
    };
  }

  private extractTime(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return [
        String(value.getHours()).padStart(2, '0'),
        String(value.getMinutes()).padStart(2, '0'),
        String(value.getSeconds()).padStart(2, '0'),
      ].join(':');
    }

    const trimmed = value.trim();
    const match = trimmed.match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/);
    return match ? match[1] : null;
  }
}
