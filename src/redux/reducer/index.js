import Immutable from 'immutable';

import { actionType } from '../action';

const initial = Immutable.fromJS({
  data: {
    data: null,
    file: null
  },
  problems: [],
  vars: [],
  logVars: [],
  exploratoryVis: {
    xVar: null,
    yVar: null
  },
  modeling: {
    model: null,
    inputVars: null
  },
  ta2: {
    model: null,
    inputs: {
      predictor: null,
      response: null
    },
    session: null,
    pipelines: []
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
      newState = state.withMutations(s => {
        s.setIn(['data', 'data'], Immutable.fromJS(action.data));
        s.setIn(['data', 'file'], action.file);
      });
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

    case actionType.setTA2Model:
      newState = state.setIn(['ta2', 'model'], Immutable.fromJS(action.model));
      break;

    case actionType.setTA2Predictor:
      newState = state.setIn(['ta2', 'inputs', 'predictor'], Immutable.fromJS(action.var));
      break;

    case actionType.setTA2Response:
      newState = state.setIn(['ta2', 'inputs', 'response'], Immutable.fromJS(action.var));
      break;

    case actionType.setTA2Session:
      newState = state.setIn(['ta2', 'session'], Immutable.fromJS(action.sessionId));
      break;

    case actionType.addPipeline:
      // Only add the new pipeline if it's not already in the pipelines list.
      const found = state.getIn(['ta2', 'pipelines']).findIndex(p => p.get('id') === action.id);
      if (found === -1) {
        newState = state.updateIn(['ta2', 'pipelines'], pipelines => pipelines.push(Immutable.fromJS({
          id: action.id,
          response: action.response,
          resultURI: action.resultURI,
          score: action.score
        })));
      }
      break;
  }

  return newState;
};

export {
  reducer
};
