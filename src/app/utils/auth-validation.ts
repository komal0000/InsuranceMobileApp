export function normalizeSpaces(value?: string | null): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

const DEVANAGARI_NAME_CHARS = /^[\u0900-\u0903\u0904-\u0939\u093C\u093E-\u094D\u0951-\u0957\u0958-\u095F\u0962\u0963\u0972-\u097F ]+$/u;
const DEVANAGARI_BASE_LETTER = /[\u0904-\u0939\u0958-\u095F\u0972-\u097F]/u;
const NEPALI_DIGITS = '०१२३४५६७८९';

export function isEnglishFullName(value?: string | null): boolean {
  return /^[A-Za-z]+(?: [A-Za-z]+)+$/.test(normalizeSpaces(value));
}

export function isEnglishNamePart(value?: string | null): boolean {
  const name = normalizeSpaces(value);

  return !name || /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name);
}

export function isNepaliFullName(value?: string | null): boolean {
  const name = normalizeSpaces(value);

  if (!isNepaliNamePart(name)) {
    return false;
  }

  const words = name.split(' ').filter(Boolean);

  return words.length >= 2;
}

export function isNepaliNamePart(value?: string | null): boolean {
  const name = normalizeSpaces(value);

  if (!name) {
    return true;
  }

  if (!DEVANAGARI_NAME_CHARS.test(name) || /[0-9\u0966-\u096F\u0964\u0965]/u.test(name)) {
    return false;
  }

  return name.split(' ').filter(Boolean).every((word) => DEVANAGARI_BASE_LETTER.test(word));
}

export function normalizeDigitsOnly(value?: string | null): string {
  return String(value || '')
    .replace(/[०-९]/g, (char) => String(NEPALI_DIGITS.indexOf(char)))
    .replace(/\D/g, '');
}

export function isStrongPassword(value?: string | null): boolean {
  const password = value || '';

  return Array.from(password).length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}
