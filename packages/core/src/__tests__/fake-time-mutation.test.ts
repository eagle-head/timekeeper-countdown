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

/**
 * EQUIVALENT MUTANTS in testing-utils/fake-time.ts `clamp()` — left as honest, explained
 * survivors because no public-API input can observe a difference (see Stryker report):
 *
 *  - L17:34 EqualityOperator `value < 0` -> `value <= 0` (Survived).
 *    Differs only at `value === 0`. Real path: `0 < 0` is false, so it falls through to the
 *    else-branch `Math.floor(0)` === 0; the mutant returns the literal 0 directly. Both yield 0,
 *    so `now()`/`set()`/`reset()` produce the same value for every finite input. (The only
 *    numeric distinguisher is -0 vs +0 via Object.is — not a meaningful millisecond distinction,
 *    both are zero ms.)
 *
 *  - L20:7 EqualityOperator `value > Number.MAX_SAFE_INTEGER` -> `value >= Number.MAX_SAFE_INTEGER`
 *    (Survived). Differs only at `value === Number.MAX_SAFE_INTEGER`, which is an integer. Real
 *    path: `MAX > MAX` is false, so it falls through to `Math.floor(MAX)` === MAX; the mutant
 *    returns the literal MAX. Both yield exactly MAX, so no input distinguishes them.
 */
