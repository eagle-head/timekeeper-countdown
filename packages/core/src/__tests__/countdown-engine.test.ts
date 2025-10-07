import { describe, it, expect, vi, afterEach } from 'vitest';
import { CountdownEngine } from '../api/countdown-engine';
import { TimerState } from '../state/state-machine';

describe('CountdownEngine', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('uses a function timeProvider without wrapping it', () => {
    vi.useFakeTimers();

    let now = 0;
    const customProvider = vi.fn(() => {
      now += 5;
      return now;
    });

    const engine = CountdownEngine(10, {
      timeProvider: customProvider,
      tickIntervalMs: 20,
    });

    const started = engine.start();

    expect(started).toBe(true);
    expect(customProvider).toHaveBeenCalled();

    engine.destroy();
  });

  it('wraps provider objects that expose a now method', () => {
    vi.useFakeTimers();

    let now = 0;
    const provider = {
      now: vi.fn(() => {
        now += 7;
        return now;
      }),
      isHighResolution: true,
      type: 'custom',
    };

    const engine = CountdownEngine(5, {
      timeProvider: provider,
      tickIntervalMs: 15,
    });

    const started = engine.start();

    expect(started).toBe(true);
    expect(provider.now).toHaveBeenCalled();

    engine.destroy();
  });

  it('throws when provider lacks a now method', () => {
    expect(() =>
      CountdownEngine(5, {
        // @ts-expect-error intentionally passing an invalid provider
        timeProvider: {} as Record<string, never>,
      })
    ).toThrow('timeProvider must implement a now(): number method');
  });

  it('swallows observer errors and keeps notifying listeners', () => {
    vi.useFakeTimers();

    const provider = vi
      .fn<[], number>()
      .mockReturnValueOnce(0)
      .mockImplementation(() => {
        throw new Error('tick failure');
      });

    const onSnapshot = vi.fn(() => {
      throw new Error('snapshot failure');
    });
    const onStateChange = vi.fn(() => {
      throw new Error('state failure');
    });
    const onError = vi.fn(() => {
      throw new Error('error failure');
    });

    const engine = CountdownEngine(5, {
      timeProvider: provider,
      tickIntervalMs: 10,
      onSnapshot,
      onStateChange,
      onError,
    });

    const throwingListener = vi.fn(() => {
      throw new Error('listener failure');
    });
    const safeListener = vi.fn<[ReturnType<typeof engine.getSnapshot>]>();

    expect(() => engine.subscribe(throwingListener)).not.toThrow();
    engine.subscribe(snapshot => safeListener(snapshot));

    expect(engine.start()).toBe(true);

    expect(onSnapshot).toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith(
      TimerState.RUNNING,
      expect.objectContaining({ state: TimerState.RUNNING })
    );

    expect(() => vi.advanceTimersByTime(20)).not.toThrow();

    expect(onError).toHaveBeenCalled();

    const receivedStates = safeListener.mock.calls.map(([snapshot]) => snapshot.state);
    expect(receivedStates).toContain(TimerState.RUNNING);
    expect(receivedStates).toContain(TimerState.STOPPED);

    expect(engine.start()).toBe(false);

    engine.destroy();
  });

  it('guards transitions and updates snapshots when setting values', () => {
    vi.useFakeTimers();

    const provider = vi.fn(() => 0);
    const engine = CountdownEngine(10, {
      timeProvider: provider,
      tickIntervalMs: 50,
    });

    expect(engine.pause()).toBe(false);
    expect(engine.resume()).toBe(false);

    engine.setSeconds(8);
    expect(engine.getSnapshot().totalSeconds).toBe(8);

    expect(engine.reset(15)).toBe(true);
    expect(engine.getSnapshot()).toMatchObject({
      initialSeconds: 15,
      totalSeconds: 15,
    });

    expect(engine.start()).toBe(true);
    expect(engine.start()).toBe(false);

    engine.destroy();
  });
});
