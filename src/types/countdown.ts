export const CountdownState = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
} as const;

export type CountdownStateType = (typeof CountdownState)[keyof typeof CountdownState];

export const ActionTypes = {
  START: "START",
  PAUSE: "PAUSE",
  RESET: "RESET",
  TICK: "TICK",
  COMPLETE: "COMPLETE",
  RESTART: "RESTART",
} as const;

export type Action =
  | { type: typeof ActionTypes.START }
  | { type: typeof ActionTypes.PAUSE }
  | { type: typeof ActionTypes.RESET; initialSeconds: number }
  | { type: typeof ActionTypes.TICK }
  | { type: typeof ActionTypes.COMPLETE }
  | { type: typeof ActionTypes.RESTART; initialSeconds: number };

export interface State {
  seconds: number;
  state: CountdownStateType;
}
