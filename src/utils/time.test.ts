import { describe, test, expect } from "vitest";
import { getDays, getHours, getMinutes, getSeconds, validateInitialSeconds } from "./time";

describe("Time Utilities", () => {
  test("getDays should return correct days from total seconds", () => {
    expect(getDays(86400)).toBe(1); // 1 day
    expect(getDays(172800)).toBe(2); // 2 days
    expect(getDays(3600)).toBe(0); // less than a day
    expect(getDays(90000)).toBe(1); // 1 day and 1 hour
  });

  test("getHours should return correct hours from total seconds", () => {
    expect(getHours(3600)).toBe(1); // 1 hour
    expect(getHours(7200)).toBe(2); // 2 hours
    expect(getHours(86400)).toBe(0); // exactly 1 day
    expect(getHours(90000)).toBe(1); // 1 day and 1 hour
  });

  test("getMinutes should return correct minutes from total seconds", () => {
    expect(getMinutes(60)).toBe(1); // 1 minute
    expect(getMinutes(3599)).toBe(59); // 59 minutes
    expect(getMinutes(3600)).toBe(0); // exactly 1 hour
    expect(getMinutes(3660)).toBe(1); // 1 hour and 1 minute
  });

  test("getSeconds should return correct remaining seconds from total seconds", () => {
    expect(getSeconds(60)).toBe(0); // exactly 1 minute
    expect(getSeconds(61)).toBe(1); // 1 minute and 1 second
    expect(getSeconds(3599)).toBe(59); // 59 minutes and 59 seconds
    expect(getSeconds(3600)).toBe(0); // exactly 1 hour
    expect(getSeconds(3661)).toBe(1); // 1 hour, 1 minute and 1 second
  });

  test("validateInitialSeconds should return valid seconds within the limits", () => {
    const MIN_SECONDS = 1;
    const MAX_SECONDS = 99 * 3600 * 24; // 99 days

    expect(validateInitialSeconds(0)).toBe(MIN_SECONDS);
    expect(validateInitialSeconds(8640000)).toBe(MAX_SECONDS);
    expect(validateInitialSeconds(NaN)).toBe(MIN_SECONDS);
    expect(validateInitialSeconds(30)).toBe(30);
    expect(validateInitialSeconds(150)).toBe(150);
  });

  test("validateInitialSeconds should handle edge cases correctly", () => {
    const MIN_SECONDS = 1;
    const MAX_SECONDS = 99 * 3600 * 24; // 99 days

    // Below minimum
    expect(validateInitialSeconds(-10)).toBe(MIN_SECONDS);

    // Above maximum
    expect(validateInitialSeconds(MAX_SECONDS + 1)).toBe(MAX_SECONDS);

    // Exact minimum
    expect(validateInitialSeconds(MIN_SECONDS)).toBe(MIN_SECONDS);

    // Exact maximum
    expect(validateInitialSeconds(MAX_SECONDS)).toBe(MAX_SECONDS);
  });
});
