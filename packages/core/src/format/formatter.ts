import type { CountdownSnapshot } from '../api/countdown-engine';

export type FormatTarget = number | Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined;

function extractSeconds(target: FormatTarget): number {
  if (typeof target === 'number') {
    return target;
  }
  if (target && typeof target.totalSeconds === 'number') {
    return target.totalSeconds;
  }
  return 0;
}

function sanitizeSeconds(totalSeconds: number): number {
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds)) {
    return 0;
  }
  if (totalSeconds <= 0) {
    return 0;
  }
  if (totalSeconds >= Number.MAX_SAFE_INTEGER) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.floor(totalSeconds);
}

function safeFormat(value: number, padLength = 2): string {
  try {
    if (!Number.isFinite(value) || value < 0) {
      return '0'.repeat(padLength);
    }
    return Math.floor(value).toString().padStart(padLength, '0');
  } catch {
    return '0'.repeat(padLength);
  }
}

function computeMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

function computeHours(seconds: number) {
  return Math.floor(seconds / 3600) % 24;
}

function computeDays(seconds: number) {
  return Math.floor(seconds / 86400) % 7;
}

function computeWeeks(seconds: number) {
  return Math.floor(seconds / 604800) % 52;
}

function computeYears(seconds: number) {
  return Math.floor(seconds / 31536000);
}

export function Formatter() {
  const getSafeSeconds = (target: FormatTarget) => sanitizeSeconds(extractSeconds(target));

  const formatTime = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return {
      minutes: safeFormat(computeMinutes(safeSeconds)),
      seconds: safeFormat(safeSeconds % 60),
    };
  };

  const formatMinutes = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return safeFormat(computeMinutes(safeSeconds));
  };

  const formatSeconds = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return safeFormat(safeSeconds % 60);
  };

  const formatHours = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return safeFormat(computeHours(safeSeconds));
  };

  const formatDays = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return safeFormat(computeDays(safeSeconds));
  };

  const formatWeeks = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return safeFormat(computeWeeks(safeSeconds));
  };

  const formatYears = (target: FormatTarget) => {
    const safeSeconds = getSafeSeconds(target);
    return safeFormat(computeYears(safeSeconds));
  };

  return {
    formatTime,
    formatMinutes,
    formatSeconds,
    formatHours,
    formatDays,
    formatWeeks,
    formatYears,
  };
}

export const defaultFormatter = Formatter();

export const formatTime = (target: FormatTarget) => defaultFormatter.formatTime(target);
export const formatMinutes = (target: FormatTarget) => defaultFormatter.formatMinutes(target);
export const formatSeconds = (target: FormatTarget) => defaultFormatter.formatSeconds(target);
export const formatHours = (target: FormatTarget) => defaultFormatter.formatHours(target);
export const formatDays = (target: FormatTarget) => defaultFormatter.formatDays(target);
export const formatWeeks = (target: FormatTarget) => defaultFormatter.formatWeeks(target);
export const formatYears = (target: FormatTarget) => defaultFormatter.formatYears(target);
