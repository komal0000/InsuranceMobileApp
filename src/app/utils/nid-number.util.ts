const DEVANAGARI_ZERO = 0x0966;
const DEVANAGARI_NINE = 0x096f;

export function normalizeNidInput(value: unknown): string {
  return Array.from(String(value ?? '').trim())
    .map(char => {
      const code = char.codePointAt(0) ?? -1;
      if (code >= DEVANAGARI_ZERO && code <= DEVANAGARI_NINE) {
        return String(code - DEVANAGARI_ZERO);
      }

      return char;
    })
    .join('');
}

export function nidDigits(value: unknown): string {
  return normalizeNidInput(value).replace(/[^0-9]+/g, '');
}

export function isValidNidInput(value: unknown): boolean {
  const normalized = normalizeNidInput(value);
  if (!normalized || !/^[0-9\s-]+$/.test(normalized)) {
    return false;
  }

  const digits = nidDigits(normalized);
  return digits.length >= 1 && digits.length <= 10;
}

export function canonicalNid(value: unknown): string {
  return nidDigits(value);
}

export function nidLookupValue(value: unknown): string {
  return normalizeNidInput(value).replace(/\s+/g, '');
}
