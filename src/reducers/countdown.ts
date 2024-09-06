import type { Draft } from "immer";
import type { Action, State } from "../types/countdown";
import { CountdownState, ActionTypes } from "../types/countdown";

export const countdownReducer = (draft: Draft<State>, action: Action) => {
  switch (action.type) {
    case ActionTypes.START:
      draft.state = CountdownState.RUNNING;
      break;
    case ActionTypes.PAUSE:
      draft.state = CountdownState.PAUSED;
      break;
    case ActionTypes.RESET:
      draft.state = CountdownState.IDLE;
      draft.seconds = action.initialSeconds;
      break;
    case ActionTypes.TICK:
      draft.seconds -= 1;
      break;
    case ActionTypes.COMPLETE:
      draft.state = CountdownState.COMPLETED;
      draft.seconds = 0;
      break;
    case ActionTypes.RESTART:
      draft.seconds = action.initialSeconds;
      draft.state = CountdownState.RUNNING;
      break;
    default:
      break;
  }
};
