/**
 * Single source of truth for clamping an arbitrary `totalSeconds`-like input into
 * a safe, non-negative integer second count. Shared by the formatters, the
 * published testing-utils snapshot builders, and the engine's `buildSnapshot()`
 * so every entry point sanitizes seconds identically (no duplicated expression):
 *
 * - non-finite (NaN/Infinity) or non-number  -> 0
 * - <= 0                                      -> 0
 * - >= Number.MAX_SAFE_INTEGER               -> Number.MAX_SAFE_INTEGER
 * - otherwise                                 -> Math.floor(value)
 *
 * Internal only — not exposed on any public barrel.
 */
export function clampSeconds(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  if (value >= Number.MAX_SAFE_INTEGER) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.floor(value);
}
