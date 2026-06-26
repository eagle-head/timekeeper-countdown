import type { CountdownSnapshot } from '../src/api/countdown-engine';
import { decompose } from '../src/time/decompose';
import { clampSeconds } from '../src/time/clamp';
import { TimerState } from '../src/state/state-machine';

export interface SnapshotOptions {
  initialSeconds?: number;
  totalSeconds?: number;
  state?: TimerState;
}

export function buildSnapshot(options: SnapshotOptions = {}): CountdownSnapshot {
  const initialSeconds = clampSeconds(options.initialSeconds ?? options.totalSeconds ?? 0);
  const totalSeconds = clampSeconds(options.totalSeconds ?? options.initialSeconds ?? 0);
  const state = options.state ?? (totalSeconds > 0 ? TimerState.IDLE : TimerState.STOPPED);
  // Canonical, lossless breakdown — same source of truth as the engine and formatters.
  const parts = decompose(totalSeconds);
  return {
    initialSeconds,
    totalSeconds,
    parts,
    state,
    isRunning: state === TimerState.RUNNING,
    isCompleted: totalSeconds === 0 && state === TimerState.STOPPED,
  };
}

export interface SequenceOptions extends SnapshotOptions {
  step?: number;
  count?: number;
}

export function buildSnapshotSequence(options: SequenceOptions = {}): CountdownSnapshot[] {
  const { totalSeconds = 0, step = 1, count = 1, initialSeconds } = options;
  const safeTotal = clampSeconds(totalSeconds);
  const safeStep = clampSeconds(step);
  const safeCount = clampSeconds(count) || 1;
  const snapshots: CountdownSnapshot[] = [];

  for (let index = 0; index < safeCount; index += 1) {
    const remaining = Math.max(safeTotal - safeStep * index, 0);
    snapshots.push(
      buildSnapshot({
        initialSeconds: initialSeconds ?? safeTotal,
        totalSeconds: remaining,
        state: remaining === 0 ? TimerState.STOPPED : TimerState.RUNNING,
      })
    );
  }

  return snapshots;
}

export { TimerState };
