const PHONE_SEPARATORS_REGEX = /[\s()-]/g;

export const normalizeIndianPhone = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

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
