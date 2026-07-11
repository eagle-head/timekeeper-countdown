import type { TimerState } from '../state/state-machine';
import type { CountdownParts } from '../time/decompose';

export interface CountdownSnapshot {
  initialSeconds: number;
  totalSeconds: number;
  parts: CountdownParts;
  state: TimerState;
  isRunning: boolean;
  isCompleted: boolean;
}
