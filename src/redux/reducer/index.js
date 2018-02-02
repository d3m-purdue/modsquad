import Immutable from 'immutable';

import { actionType } from '../action';

// data = actual list of dictionaries;
// name = dataset name
// mode = 'train' or 'test'
// path = 'path to datasetDoc.json'

const initial = Immutable.fromJS({
  config: null,
  data: {
    data: null,
    schema: null
  },
  problem: {
    problemId: null,
    description: null,
    tasktype: null,
    tasksubtype: null,
    metrics: null,
    targets: []
  },
  vars: [],
  logVars: [],
  exploratoryVis: {
    xVar: null,
    yVar: null
  },
  exploratoryVisMatrix: {
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
    case actionType.setConfig:
      newState = state.set('config', Immutable.fromJS(action.config));
      break;

  case actionType.setProblemId:
      newState = state.setIn(['problem','problemId'], Immutable.fromJS(action.problemId));
      break;

    case actionType.setProblemDescription:
      newState = state.setIn(['problem', 'description'], Immutable.fromJS(action.problemDescription));
      break;

    case actionType.setProblemTaskType:
      newState = state.setIn(['problem','tasktype'], Immutable.fromJS(action.taskType));
      break;

    case actionType.setProblemTaskSubType:
      newState = state.setIn(['problem','tasksubtype'], Immutable.fromJS(action.taskSubType));
      break;

    case actionType.setProblemMetrics:
      newState = state.setIn(['problem','metrics'], Immutable.fromJS(action.metrics));
      break;

    case actionType.setProblemTargetFeatures:
      newState = state.setIn(['problem','targets'], Immutable.fromJS(action.targets));
      break;

    case actionType.setDataSchema:
      newState = state.withMutations(s => {
        s.setIn(['data', 'schema'], Immutable.fromJS(action.schema));

      });
      break;

    // modified for Jan18
    case actionType.setActiveData:
      newState = state.setIn(['data','data'], Immutable.fromJS(action.data));
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
        newState = state.setIn(['exploratoryVisMatrix', 'yVar'], Immutable.fromJS(action.var));
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

    // it looks like the ta2ta3 api is changing here, so it might be used inconsistently, try
    // to catch both possibilities  (sessionId and session_id )
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
