import Immutable from 'immutable';

import { actionType } from '../action';

const initial = Immutable.fromJS({
  data: {
    data: null
  },
  problems: [],
  vars: [],
  logVars: [],
  exploratoryVis: {
    xVar: null,
    yVar: null
  },
  exploratoryVisMatrix: {
    f1Var: null,
    f2Var: null,
    f3Var: null
  },
  modeling: {
    model: null,
    inputVars: null
  }
});

const reducer = (state = initial, action = {}) => {
  let newState = state;

  if (action.type === undefined) {
    throw new Error('fatal: undefined action type');
  }

  switch (action.type) {
    case actionType.setProblemList:
      newState = state.set('problems', Immutable.fromJS(action.problems));
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

    case actionType.setExploratoryVarMatrix:
      if (action.which === 0) {
        newState = state.setIn(['exploratoryVisMatrix', 'f1Var'], Immutable.fromJS(action.var));
      } else if (action.which === 1) {
        newState = state.setIn(['exploratoryVisMatrix', 'f2Var'], Immutable.fromJS(action.var));
      } else if (action.which === 2) {
        newState = state.setIn(['exploratoryVisMatrix', 'f3Var'], Immutable.fromJS(action.var));
      } else {
        throw new Error(`illegal action.which: ${action.which}`);
      }
      break;

    case actionType.setModelType:
      if (['linear', 'quadratic', 'loess'].indexOf(action.model) < 0) {
        throw new Error(`illegal value for model type: ${action.model}`);
      }

      newState = state.setIn(['modeling', 'model'], action.model);
      break;

    case actionType.setModelInputVars:
      let vars = {};
      if (action.vars === null) {
        vars = null;
      } else {
        action.vars.forEach(v => {
          vars[v] = null;
        });
      }

      const value = vars === null ? null : Immutable.fromJS(vars);
      newState = state.setIn(['modeling', 'inputVars'], value);
      break;

    case actionType.setModelingVar:
      newState = state.setIn(['modeling', 'inputVars', action.which], Immutable.fromJS(action.var));
      break;
  }

  return newState;
};

export {
  reducer
};
