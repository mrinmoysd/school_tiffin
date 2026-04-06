export const EMAIL_VALIDATION_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX = /^\+91(?:[6-9]\d{9}|[1-5]\d{8,10})$/;

const PHONE_SEPARATORS_REGEX = /[\s()-]/g;

export const normalizeIndianPhone = (value?: string): string => {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  const compact = trimmed.replace(PHONE_SEPARATORS_REGEX, '');
  if (!compact) return '';

  if (compact.startsWith('+') && !compact.startsWith('+91')) {
    return compact;
  }

  if (compact.startsWith('00') && !compact.startsWith('0091')) {
    return compact;
  }

  let nationalNumber = compact;

  if (nationalNumber.startsWith('+91')) {
    nationalNumber = nationalNumber.slice(3);
  } else if (nationalNumber.startsWith('0091')) {
    nationalNumber = nationalNumber.slice(4);
  } else if (nationalNumber.startsWith('91') && nationalNumber.length >= 12) {
    nationalNumber = nationalNumber.slice(2);
  }

  if (nationalNumber.startsWith('0') && nationalNumber.length >= 10) {
    nationalNumber = nationalNumber.slice(1);
  }

  return `+91${nationalNumber}`;
};

export const isValidIndianPhone = (value?: string): boolean => {
  if (!value || !value.trim()) return true;
  return INDIAN_PHONE_WITH_COUNTRY_CODE_REGEX.test(normalizeIndianPhone(value));
};
