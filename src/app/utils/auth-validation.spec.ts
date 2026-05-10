import { isEnglishFullName, isNepaliFullName, isStrongPassword, normalizeSpaces } from './auth-validation';

describe('auth validation utilities', () => {
  it('validates existing name helpers', () => {
    expect(normalizeSpaces('  Sita   Sharma  ')).toBe('Sita Sharma');
    expect(isEnglishFullName('Sita Sharma')).toBeTrue();
    expect(isEnglishFullName('Sita')).toBeFalse();
    expect(isNepaliFullName('सीता शर्मा')).toBeTrue();
    expect(isNepaliFullName('Sita Sharma')).toBeFalse();
  });

  it('keeps existing ASCII strong password behavior', () => {
    expect(isStrongPassword('Password123!')).toBeTrue();
    expect(isStrongPassword('Password123')).toBeFalse();
    expect(isStrongPassword('password123!')).toBeFalse();
  });

  it('rejects passwords that only reach eight JavaScript code units through surrogate pairs', () => {
    const password = 'Aa1!😀😀';

    expect(password.length).toBe(8);
    expect(Array.from(password).length).toBe(6);
    expect(isStrongPassword(password)).toBeFalse();
  });

  it('accepts valid eight-character Unicode passwords by code point count', () => {
    expect(Array.from('Aa1!界界界界').length).toBe(8);
    expect(isStrongPassword('Aa1!界界界界')).toBeTrue();
  });
});
