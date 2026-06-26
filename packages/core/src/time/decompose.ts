import {
  SECONDS_PER_MINUTE,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  SECONDS_PER_WEEK,
  SECONDS_PER_YEAR,
} from './constants';

/**
 * A countdown duration broken down into calendar-style units.
 *
 * The unit ladder is fixed-length and internally consistent — a year is
 * {@link SECONDS_PER_YEAR} (365 days), a week is {@link SECONDS_PER_WEEK}
 * (7 days), and so on. Because the breakdown is computed by successive
 * subtraction over that single ladder (not independent modular arithmetic),
 * the parts always reconstruct the total exactly:
 *
 * ```
 * years*SECONDS_PER_YEAR + weeks*SECONDS_PER_WEEK + days*SECONDS_PER_DAY +
 *   hours*SECONDS_PER_HOUR + minutes*SECONDS_PER_MINUTE + seconds === totalSeconds
 * ```
 *
 * Field ranges: `weeks` 0–52, `days` 0–6, `hours` 0–23, `minutes`/`seconds` 0–59.
 */
export interface CountdownParts {
  years: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
}

/**
 * Breaks `totalSeconds` into {@link CountdownParts} by successive subtraction so
 * the result is lossless and reconstructable. Non-finite or negative input is
 * treated as 0 (the formatters and engine never surface a partial breakdown of
 * an invalid value).
 */
export function decompose(totalSeconds: number): CountdownParts {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;

  let remaining = safe;

  const years = Math.floor(remaining / SECONDS_PER_YEAR);
  remaining -= years * SECONDS_PER_YEAR;

  const weeks = Math.floor(remaining / SECONDS_PER_WEEK);
  remaining -= weeks * SECONDS_PER_WEEK;

  const days = Math.floor(remaining / SECONDS_PER_DAY);
  remaining -= days * SECONDS_PER_DAY;

  const hours = Math.floor(remaining / SECONDS_PER_HOUR);
  remaining -= hours * SECONDS_PER_HOUR;

  const minutes = Math.floor(remaining / SECONDS_PER_MINUTE);
  remaining -= minutes * SECONDS_PER_MINUTE;

  const seconds = remaining;

  return {
    years,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    totalDays: Math.floor(safe / SECONDS_PER_DAY),
    totalHours: Math.floor(safe / SECONDS_PER_HOUR),
    totalMinutes: Math.floor(safe / SECONDS_PER_MINUTE),
  };
}
