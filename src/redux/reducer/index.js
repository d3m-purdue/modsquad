import Immutable from 'immutable';

import { actionType } from '../action';

const initial = Immutable.fromJS({
  mode: 0
});

const reducer = (state = initial, action = {}) => {
  let newState = state;

  if (action.type === undefined) {
    throw new Error('fatal: undefined action type');
  }

  switch (action.type) {
    case actionType.initial:
      newState = state.set('mode', 1);
      break;

    case actionType.secondary:
      newState = state.set('mode', 2);
      break;
  }

  return newState;
};

export {
  reducer
};
