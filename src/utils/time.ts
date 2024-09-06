const MAX_DAYS = 99;
const MIN_SECONDS = 1;
const SECONDS_IN_A_MINUTE = 60;
const SECONDS_IN_AN_HOUR = 60 * SECONDS_IN_A_MINUTE;
const SECONDS_IN_A_DAY = 24 * SECONDS_IN_AN_HOUR;
const MAX_SECONDS = MAX_DAYS * SECONDS_IN_A_DAY;

export function getDays(totalSeconds: number) {
  return Math.floor(totalSeconds / SECONDS_IN_A_DAY);
}

export function getHours(totalSeconds: number) {
  return Math.floor((totalSeconds % SECONDS_IN_A_DAY) / SECONDS_IN_AN_HOUR);
}

export function getMinutes(totalSeconds: number) {
  return Math.floor((totalSeconds % SECONDS_IN_AN_HOUR) / SECONDS_IN_A_MINUTE);
}

export function getSeconds(totalSeconds: number) {
  return totalSeconds % SECONDS_IN_A_MINUTE;
}

export function validateInitialSeconds(seconds: number) {
  if (isNaN(seconds) || seconds < MIN_SECONDS) {
    return MIN_SECONDS;
  }

  if (seconds > MAX_SECONDS) {
    return MAX_SECONDS;
  }

  return Math.trunc(seconds);
}
