export const INDIAN_PHONE_DIGITS = 10;

const INDIAN_PHONE_PATTERN = /^\d{10}$/;

export function sanitizeIndianPhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, INDIAN_PHONE_DIGITS);
}

export function isValidIndianPhone(value: string): boolean {
  return INDIAN_PHONE_PATTERN.test(value);
}
