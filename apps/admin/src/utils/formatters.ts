import dayjs from 'dayjs';

/**
 * Format currency amount (from paise to rupees)
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const value = amount / 100;
  if (currency === 'INR') {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return `$${value.toLocaleString('en-US')}`;
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, format: string = 'MMM DD, YYYY'): string => {
  return dayjs(date).format(format);
};

/**
 * Format date time
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('MMM DD, YYYY HH:mm');
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Format Indian phone number
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number = 50): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

/**
 * Format a user full name from first/last name
 */
export const formatUserName = (
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
  } | null,
): string => {
  if (!user) return '';
  const splitName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (splitName) return splitName;
  return user.fullName?.trim() || '';
};

/**
 * Capitalize each word in plain text
 */
export const toCapitalizedWords = (value?: string | null): string => {
  if (!value) return '';

  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';

  return normalized
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format a student full name from first/last name
 */
export const formatStudentName = (student?: {
  firstName?: string | null;
  lastName?: string | null;
}): string => {
  if (!student) return '';
  return [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
