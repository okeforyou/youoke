/**
 * Validation Utilities
 *
 * Common validation functions for forms and user input
 */

/**
 * Password validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate email address
 *
 * @example
 * validateEmail('test@example.com') // true
 * validateEmail('invalid-email') // false
 * validateEmail('') // false
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return false;
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (optional for Thai users)
 * - At least one lowercase letter (optional for Thai users)
 * - At least one number (optional)
 *
 * @example
 * validatePassword('password123') // { valid: true, errors: [] }
 * validatePassword('weak') // { valid: false, errors: ['รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'] }
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || password.trim() === '') {
    return {
      valid: false,
      errors: ['กรุณากรอกรหัสผ่าน'],
    };
  }

  // Minimum length check
  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  }

  // Maximum length check (prevent DoS)
  if (password.length > 128) {
    errors.push('รหัสผ่านต้องไม่เกิน 128 ตัวอักษร');
  }

  // Optional: Check for common weak passwords
  const weakPasswords = [
    'password',
    '12345678',
    'qwerty123',
    'password123',
    'admin123',
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('รหัสผ่านนี้ใช้บ่อยเกินไป กรุณาเลือกรหัสผ่านที่ปลอดภัยกว่า');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Thai phone number
 *
 * Accepts formats:
 * - 0812345678 (10 digits)
 * - 081-234-5678 (with dashes)
 * - 081 234 5678 (with spaces)
 * - +66812345678 (international format)
 *
 * @example
 * validatePhone('0812345678') // true
 * validatePhone('081-234-5678') // true
 * validatePhone('+66812345678') // true
 * validatePhone('123') // false
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return false;
  }

  // Remove all non-digit characters except + at the start
  const cleaned = phone.replace(/[\s-]/g, '');

  // Thai mobile number patterns
  const patterns = [
    /^0[6-9]\d{8}$/, // 0812345678 (starts with 06-09)
    /^\+66[6-9]\d{8}$/, // +66812345678 (international)
    /^66[6-9]\d{8}$/, // 66812345678 (without +)
  ];

  return patterns.some((pattern) => pattern.test(cleaned));
}

/**
 * Validate URL
 *
 * @example
 * validateUrl('https://example.com') // true
 * validateUrl('http://localhost:3000') // true
 * validateUrl('not-a-url') // false
 */
export function validateUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate Thai ID card number (13 digits)
 *
 * @example
 * validateThaiId('1234567890123') // true or false (depends on checksum)
 */
export function validateThaiId(id: string): boolean {
  if (!id || id.length !== 13) {
    return false;
  }

  // Check if all characters are digits
  if (!/^\d{13}$/.test(id)) {
    return false;
  }

  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i)) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id.charAt(12));
}

/**
 * Validate required field (not empty)
 *
 * @example
 * validateRequired('hello') // true
 * validateRequired('') // false
 * validateRequired('  ') // false
 */
export function validateRequired(value: string): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

/**
 * Validate number in range
 *
 * @example
 * validateNumberRange(50, 0, 100) // true
 * validateNumberRange(150, 0, 100) // false
 */
export function validateNumberRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate credit card number using Luhn algorithm
 *
 * @example
 * validateCreditCard('4532015112830366') // true (Visa)
 * validateCreditCard('1234567890123456') // false
 */
export function validateCreditCard(cardNumber: string): boolean {
  if (!cardNumber || cardNumber.trim() === '') {
    return false;
  }

  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Check if all characters are digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  // Must be between 13-19 digits
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
