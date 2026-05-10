export function normalizeSpaces(value?: string | null): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

export function isEnglishFullName(value?: string | null): boolean {
  return /^[A-Za-z]+(?: [A-Za-z]+)+$/.test(normalizeSpaces(value));
}

export function isNepaliFullName(value?: string | null): boolean {
  const name = normalizeSpaces(value);

  if (!/^[\u0900-\u097F ]+$/u.test(name) || /[0-9\u0966-\u096F\u0964\u0965]/u.test(name)) {
    return false;
  }

  const words = name.split(' ').filter(Boolean);

  return words.length >= 2 && words.every((word) => /[\u0904-\u0939\u0958-\u095F]/u.test(word));
}

export function isStrongPassword(value?: string | null): boolean {
  const password = value || '';

  return Array.from(password).length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}
