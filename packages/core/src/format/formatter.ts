import type { CountdownSnapshot } from '../model/countdown-snapshot';
import { decompose } from '../time/decompose';
import { clampSeconds } from '../time/clamp';

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

// `value` is always a non-negative integer here — every caller passes a field from
// `decompose()`, which floors and clamps. So this is a pure padding helper; the input
// is validated once upstream (extractSeconds + clampSeconds), not re-guarded here.
function safeFormat(value: number, padLength = 2): string {
  return value.toString().padStart(padLength, '0');
}

export function Formatter() {
  // Single source of truth: every formatter derives from the canonical, lossless
  // decomposition, so formatted units are mutually consistent and reconstruct the total.
  const partsOf = (target: FormatTarget) => decompose(clampSeconds(extractSeconds(target)));

  const formatTime = (target: FormatTarget) => {
    const parts = partsOf(target);
    return {
      minutes: safeFormat(parts.totalMinutes),
      seconds: safeFormat(parts.seconds),
    };
  };

  const formatMinutes = (target: FormatTarget) => safeFormat(partsOf(target).minutes);
  const formatSeconds = (target: FormatTarget) => safeFormat(partsOf(target).seconds);
  const formatHours = (target: FormatTarget) => safeFormat(partsOf(target).hours);
  const formatDays = (target: FormatTarget) => safeFormat(partsOf(target).days);
  const formatWeeks = (target: FormatTarget) => safeFormat(partsOf(target).weeks);
  const formatYears = (target: FormatTarget) => safeFormat(partsOf(target).years);

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

export function formatTime(target: number): { minutes: string; seconds: string };
export function formatTime(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): {
  minutes: string;
  seconds: string;
};
export function formatTime(target: FormatTarget): { minutes: string; seconds: string } {
  return defaultFormatter.formatTime(target);
}

export function formatMinutes(target: number): string;
export function formatMinutes(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): string;
export function formatMinutes(target: FormatTarget): string {
  return defaultFormatter.formatMinutes(target);
}

export function formatSeconds(target: number): string;
export function formatSeconds(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): string;
export function formatSeconds(target: FormatTarget): string {
  return defaultFormatter.formatSeconds(target);
}

export function formatHours(target: number): string;
export function formatHours(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): string;
export function formatHours(target: FormatTarget): string {
  return defaultFormatter.formatHours(target);
}

export function formatDays(target: number): string;
export function formatDays(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): string;
export function formatDays(target: FormatTarget): string {
  return defaultFormatter.formatDays(target);
}

export function formatWeeks(target: number): string;
export function formatWeeks(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): string;
export function formatWeeks(target: FormatTarget): string {
  return defaultFormatter.formatWeeks(target);
}

export function formatYears(target: number): string;
export function formatYears(target: Pick<CountdownSnapshot, 'totalSeconds'> | null | undefined): string;
export function formatYears(target: FormatTarget): string {
  return defaultFormatter.formatYears(target);
}
