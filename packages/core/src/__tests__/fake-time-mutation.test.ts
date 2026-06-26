import { describe, it, expect } from 'vitest';
import { createFakeTimeProvider } from '../../testing-utils';

/**
 * Mutation-focused tests for testing-utils/fake-time.ts.
 *
 * Surviving mutant targeted:
 *  - id 664 (line 27): default value of `highResolution` destructuring
 *    (`highResolution = true` -> `highResolution = false`).
 *
 * The existing suite only constructs a fake provider with
 * `highResolution: false` explicitly, so the DEFAULT (`true`) branch is never
 * observed. These tests pin the default to `true` through the public
 * `isHighResolution` property.
 */
describe('createFakeTimeProvider — highResolution default (mutant 664)', () => {
  it('defaults isHighResolution to true when no option is supplied', () => {
    const fake = createFakeTimeProvider();

    expect(fake.isHighResolution).toBe(true);
  });

  it('keeps isHighResolution true when other options are given but highResolution is omitted', () => {
    const fake = createFakeTimeProvider({ startMs: 100, tickMs: 250 });

    expect(fake.isHighResolution).toBe(true);
  });

  it('still honors an explicit highResolution: false override', () => {
    const fake = createFakeTimeProvider({ highResolution: false });

    expect(fake.isHighResolution).toBe(false);
  });
});
