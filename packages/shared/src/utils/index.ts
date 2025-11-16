/**
 * Shared Utility Functions
 */

import { SUPPORTED_LOCALES, SUPPORTED_TIMEZONES } from '../constants';

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generates a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Validates locale string
 */
export function isValidLocale(locale: string): boolean {
  return SUPPORTED_LOCALES.includes(locale as any);
}

/**
 * Validates timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  return SUPPORTED_TIMEZONES.includes(timezone as any);
}

/**
 * Formats duration in minutes to human-readable string
 */
export function formatDuration(minutes: number, locale: string = 'pt-BR'): string {
  if (minutes < 60) {
    return locale === 'pt-BR' ? `${minutes} min` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (locale === 'pt-BR') {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Safely parses JSON with fallback
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Calculates date range for a plan
 */
export function calculatePlanDateRange(startDate: Date, weeks: number): { start: Date; end: Date } {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + weeks * 7);

  return { start, end };
}

/**
 * Generates weekday array for a week starting from a date
 */
export function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Formats date to ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Masks email for privacy
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const maskedLocal = local.length > 3
    ? local.substring(0, 2) + '***' + local.substring(local.length - 1)
    : '***';

  return `${maskedLocal}@${domain}`;
}

/**
 * Extracts tenant slug from hostname
 */
export function extractTenantSlug(hostname: string): string | null {
  // For custom domains, this would need to be looked up in DB
  // For subdomains: tenant.planmaker.com -> tenant
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

/**
 * Generates random string for invite codes, etc
 */
export function generateRandomString(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
