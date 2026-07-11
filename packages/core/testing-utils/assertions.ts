import type { CountdownSnapshot } from '../src/model/countdown-snapshot';
import { TimerState } from '../src/state/state-machine';

const formatErrorMessage = (message: string, details?: string) => {
  if (!details) {
    return message;
  }
  return `${message}: ${details}`;
};

export function assertSnapshotState(snapshot: CountdownSnapshot, expected: TimerState, message?: string): void {
  if (snapshot.state !== expected) {
    throw new Error(
      formatErrorMessage(message ?? 'Unexpected countdown state', `expected ${expected} but received ${snapshot.state}`)
    );
  }
}

export function assertSnapshotCompleted(snapshot: CountdownSnapshot, message?: string): void {
  if (!snapshot.isCompleted || snapshot.totalSeconds !== 0) {
    throw new Error(formatErrorMessage(message ?? 'Countdown should be completed'));
  }
}

export function assertRemainingSeconds(
  snapshot: CountdownSnapshot,
  expected: number,
  tolerance = 0,
  message?: string
): void {
  if (typeof expected !== 'number' || !Number.isFinite(expected)) {
    throw new Error('Expected remaining seconds must be a finite number');
  }
  const delta = Math.abs(snapshot.totalSeconds - Math.floor(expected));
  if (delta > tolerance) {
    throw new Error(
      formatErrorMessage(
        message ?? 'Unexpected remaining seconds',
        `expected ${expected}±${tolerance} but received ${snapshot.totalSeconds}`
      )
    );
  }
}

export { TimerState };
