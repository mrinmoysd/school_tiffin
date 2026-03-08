export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const INDIAN_PHONE_WITH_CODE_REGEX = /^\+91[6-9]\d{9}$/;
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_STRENGTH_MESSAGE =
  'Password must be at least 8 characters and include one uppercase letter and one number';
