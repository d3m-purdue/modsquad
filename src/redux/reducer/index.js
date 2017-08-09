import Immutable from 'immutable';

import { actionType } from '../action';

const initial = Immutable.fromJS({
  data: {
    which: -1,
    datasets: [],
    data: null
  },
  vars: [],
  logVars: [],
  exploratoryVis: {
    xVar: null,
    yVar: null
  },
  modeling: {
    predVar: null,
    respVar: null
  }
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
        name: `log_${action.name}`,
        data: action.data
      })));
      break;

    case actionType.setExploratoryVar:
      if (action.which === 0) {
        newState = state.setIn(['exploratoryVis', 'xVar'], Immutable.fromJS(action.var));
      } else if (action.which === 1) {
        newState = state.setIn(['exploratoryVis', 'yVar'], Immutable.fromJS(action.var));
      } else {
        throw new Error(`illegal action.which: ${action.which}`);
      }
      break;

    case actionType.setModelingVar:
      if (action.which === 0) {
        newState = state.setIn(['modeling', 'predVar'], Immutable.fromJS(action.var));
      } else if (action.which === 1) {
        newState = state.setIn(['modeling', 'respVar'], Immutable.fromJS(action.var));
      } else {
        throw new Error(`illegal action.which: ${action.which}`);
      }
      break;
  }

  return newState;
};

export {
  reducer
};
