import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountdownEngine, type CountdownSnapshot } from '../api/countdown-engine';
import { TimerState } from '../state/state-machine';

describe('CountdownEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should expose initial snapshot in IDLE state', () => {
    const engine = CountdownEngine(90);
    const snapshot = engine.getSnapshot();

    expect(snapshot.initialSeconds).toBe(90);
    expect(snapshot.totalSeconds).toBe(90);
    expect(snapshot.state).toBe(TimerState.IDLE);
    expect(snapshot.isRunning).toBe(false);

    engine.destroy();
  });

  it('should emit snapshots when seconds change', () => {
    const snapshots: CountdownSnapshot[] = [];
    const engine = CountdownEngine(3, {
      onSnapshot: snapshot => snapshots.push(snapshot),
    });

    engine.start();
    expect(snapshots.at(-1)?.state).toBe(TimerState.RUNNING);

    engine.setSeconds(2);
    expect(engine.getSnapshot().totalSeconds).toBe(2);
    expect(snapshots.at(-1)?.totalSeconds).toBe(2);

    engine.setSeconds(0);
    engine.stop();

    const finalSnapshot = engine.getSnapshot();
    expect(finalSnapshot.totalSeconds).toBe(0);
    expect(finalSnapshot.state).toBe(TimerState.STOPPED);
    expect(finalSnapshot.isCompleted).toBe(true);

    engine.destroy();
  });

  it('should allow reset with a new initial value', () => {
    const engine = CountdownEngine(5);

    engine.start();
    engine.setSeconds(3);
    expect(engine.getSnapshot().totalSeconds).toBe(3);

    engine.reset(10);
    const resetSnapshot = engine.getSnapshot();
    expect(resetSnapshot.initialSeconds).toBe(10);
    expect(resetSnapshot.totalSeconds).toBe(10);
    expect(resetSnapshot.state).toBe(TimerState.IDLE);

    engine.start();
    engine.setSeconds(9);
    expect(engine.getSnapshot().totalSeconds).toBe(9);

    engine.destroy();
  });

  it('should support manual observers and unsubscribe', () => {
    const engine = CountdownEngine(2);
    const listener = vi.fn();
    const subscription = engine.subscribe(listener);

    engine.start();
    engine.setSeconds(1);

    expect(listener).toHaveBeenCalledTimes(4); // subscribe + start state + start snapshot + update

    subscription.unsubscribe();
    engine.setSeconds(0);

    expect(listener).toHaveBeenCalledTimes(4);

    engine.destroy();
  });
});
