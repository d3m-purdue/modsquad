import Immutable from 'immutable';

import { actionType } from '../action';


const initial = Immutable.fromJS({

  // the config JSON object, as received from the d3m execution system
  config: null,

  // data = actual data elements as list of dictionaries
  // schema = full pathto datasetDoc.json, e.g. '/datasets/problem2/data/datasetDoc.json'
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
  metadata: [],
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
    pipelines: [],
    executedPipelines: [],
    executedData: []
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
      newState = state.setIn(['problem','tasktype'], Immutable.fromJS(action.tasktype));
      break;

    case actionType.setProblemTaskSubType:
      newState = state.setIn(['problem','tasksubtype'], Immutable.fromJS(action.tasksubtype));
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

    case actionType.setVariableMetadata:
      newState = state.set('metadata', Immutable.fromJS(action.metadata));
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

    // this is called for each pipeline we receive back from the TA2 instance.  These are pipeines
    // that have been trained on training data and are ready for testing/execution with new data 
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

    // this is called each time a trained pipeline is executed with new data.  The resulting URI
    // indicates where to access the output data (the predicted values)
    case actionType.addExecutedPipeline:
      // Only add the new pipeline if it's not already in the pipelines list.
      const execfound = state.getIn(['ta2', 'executedPipelines']).findIndex(p => p.get('id') === action.id);
      if (execfound === -1) {
        newState = state.updateIn(['ta2', 'executedPipelines'], executedPipelines => executedPipelines.push(Immutable.fromJS({
          id: action.id,
          response: action.response,
          resultURI: action.resultURI,
          data: action.data
        })));
      }
      break;

    // this is called each time a trained pipeline is executed with new data.  The resulting URI
    // indicates where to access the output data (the predicted values)
    case actionType.addExecutedPipelineData:
      // Only add the new pipeline if it's not already in the pipelines list.
      const datafound = state.getIn(['ta2', 'executedData']).findIndex(p => p.get('id') === action.id);
      if (datafound === -1) {
        newState = state.updateIn(['ta2', 'executedData'], executedData => executedData.push(Immutable.fromJS({
          id: action.id,
          data: action.data
        })));
      }
      break;


  }

  return newState;
};

export {
  reducer
};
