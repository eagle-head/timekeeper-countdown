import type { TimeProvider } from '../src/runtime/time-providers';

export interface FakeTimeProvider extends TimeProvider {
  advance: (ms?: number) => number;
  set: (ms: number) => number;
  reset: () => number;
  getTime: () => number;
}

export interface FakeTimeOptions {
  startMs?: number;
  tickMs?: number;
  highResolution?: boolean;
}

const clamp = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  if (value > Number.MAX_SAFE_INTEGER) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.floor(value);
};

export function createFakeTimeProvider(options: FakeTimeOptions = {}): FakeTimeProvider {
  const { startMs = 0, tickMs = 1000, highResolution = true } = options;
  let current = clamp(startMs);
  const defaultStep = clamp(tickMs);

  const advance = (ms = defaultStep) => {
    current = clamp(current + clamp(ms));
    return current;
  };

  const set = (ms: number) => {
    current = clamp(ms);
    return current;
  };

  const reset = () => {
    current = clamp(startMs);
    return current;
  };

  const getTime = () => current;

  return {
    now: () => current,
    advance,
    set,
    reset,
    getTime,
    isHighResolution: highResolution,
    type: 'fake',
  };
}

export function toTimeProvider(fake: FakeTimeProvider): TimeProvider {
  return {
    now: () => fake.now(),
    isHighResolution: fake.isHighResolution,
    type: fake.type,
  };
}
