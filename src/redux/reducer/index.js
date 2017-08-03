import Immutable from 'immutable';

import { actionType } from '../action';

const initial = Immutable.fromJS({
  data: {
    which: -1,
    datasets: [],
    data: null
  },
  vars: [],
  logVars: []
});

const reducer = (state = initial, action = {}) => {
  let newState = state;

  if (action.type === undefined) {
    throw new Error('fatal: undefined action type');
  }

  switch (action.type) {
    case actionType.setDatasetList:
      newState = state.setIn(['data', 'datasets'], Immutable.fromJS(action.datasets));
      break;

    case actionType.setActiveDataset:
      newState = state.setIn(['data', 'which'], action.index);
      break;

    case actionType.setActiveData:
      newState = state.setIn(['data', 'data'], Immutable.fromJS(action.data));
      break;

    case actionType.setVariables:
      newState = state.set('vars', Immutable.fromJS(action.variables));
      break;

    case actionType.createLogVariable:
      newState = state.update('logVars', vars => vars.push(Immutable.fromJS({
        name: `log-${action.name}`,
        data: action.data
      })));
      break;
  }

  return newState;
};

export {
  reducer
};
