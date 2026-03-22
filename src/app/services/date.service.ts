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

    try {
      return convertBsToAd(normalized);
    } catch {
      return normalized;
    }
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

  toApiDate(value: string | Date | null | undefined): string {
    return this.bsToAd(value);
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
      normalized[bsField] = this.adToBs(raw);
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
      prepared.append(bsField, this.adToBs(raw));
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
}
