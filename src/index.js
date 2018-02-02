import 'bootstrap/dist/js/bootstrap';
import ScatterPlot from 'candela/plugins/vega/ScatterPlot';
import BoxPlot from 'candela/plugins/vega/BoxPlot';
import { select,
         selectAll } from 'd3-selection';
import { json } from 'd3-request';
import dl from 'datalib';
import Remarkable from 'remarkable';

import { action,
         store,
         observeStore } from './redux';
import Dropdown from './util/Dropdown';
import stringToElement from './util/stringToElement';
import { NormalPlot } from './util/stats';
import { HistogramPlot } from './util/stats';
import { allVars } from './util';
import varTemplate from './template/var.jade';
import pipelineTemplate from './template/pipeline.jade';
import metadataTemplate from './template/metadata.jade';

import body from './index.jade';
import './index.less';
import models from './tangelo/models.yml';

import stoppingTemplate from './template/stopping.jade';
import stopProcess from './util/stopProcess';

// KLUDGE - evil mount of a function, so it is visible from a call
// in the Pug template (a quit button on the GUI)
window.stopProcess = stopProcess;

// kludge of store because Redux wasn't cooperating
var storage = {}
storage.dataset = []
storage.schema = null

// easy way to rescale the embedded plot dimensions, while preserving aspect ratio
const plotSizeScale = 2.5

// Construct a markdown renderer.
const md = new Remarkable();

// Read in the NIST config file.
json('/config', cfg => {
  store.dispatch(action.setConfig(cfg));

  // now that we have the config information, look up the datasets
  json('/dataset/data', (error,data_contents) => {
    //console.log('ajax return:',data_contents)
    store.dispatch(action.setActiveData(data_contents));
    store.dispatch(action.setDataSchema(cfg['dataset_schema']));
  });

  // now that we have the config information, store the problems to be solved
  json('/dataset/problems', (error,problem_contents) => {
    console.log('ajax return:',problem_contents)
    //store.dispatch(action.setProblemDescription(problem_contents['description']));
    store.dispatch(action.setProblemId(problem_contents[0]['problemId']));
    store.dispatch(action.setProblemTaskType(problem_contents[0]['taskType'])); 
    store.dispatch(action.setProblemTaskSubType(problem_contents[0]['taskSubType']));
    store.dispatch(action.setProblemMetrics(problem_contents[0]['metrics']));
    store.dispatch(action.setProblemTargetFeatures(problem_contents[0]['targets']));
  });

});




// Install the content template.
select(document.body).html(body());


// repond to changes in the config and update the dataset schema and the data itself.  This is accomplished by
// observing for changes in the config component of the Redux store and calling a tangelo service to
// read the data

observeStore(next => {
  const immConfig = next.getIn(['config']);
  console.log('observe store - config changed')
  // load the data
  //json('/database/data', data_contents => {
  //    store.dispatch(action.setActiveData(data_contents));
  //    store.dispatch(action.setDataSchema(immConfig['dataset_schema']));
  //    console.log('data returned from service:',store.getState().getIn(['data','data']))
  //});
}, s => s.getIn(['config']));


// build a list of variables from the data, once it is set
observeStore(next => {
  console.log('observe store - data,data changed');
  // load the data
  //json('/database/listfeatures', features => {
  //    store.dispatch(action.setVariables(features));
  //    console.log('data returned from service:',store.getState().getIn(['vars']))
  //});
}, s => s.getIn(['data','data']));



// Install the model choices.
// let modelDropdown = new Dropdown(select('#modeldropdown').node(), {
  // buttonText: 'Model',
  // onSelect: item => {
    // store.dispatch(action.setModelType(item));
  // }
// });
// modelDropdown.setItems([
  // 'linear',
  // 'quadratic',
  // 'loess'
// ]);









// Install the TA2 options.
let ta2Dropdown = new Dropdown(select('.ta2-models').node(), {
  buttonText: 'TA2',
  onSelect: item => {
    selectAll('.ta2-params,.train')
      .classed('hidden', false);

    json(`/session?port=${item.port}`)
      .post({}, session => {
        //console.log('session returned was:',session)
        store.dispatch(action.setTA2Session(session));
      });

    store.dispatch(action.setTA2Model(item));
  }
});
ta2Dropdown.setItems(models, d => d.display);

// Install action for train button.
select('button.train').on('click', () => {
  const ta2 = store.getState().get('ta2');
  const context = JSON.stringify(ta2.get('session').toJS().context);
  // disabling dynamic discovery for now because it is being set during evaluitions
  //const model = ta2.get('model');
  //const port = model.get('port');
 
  const data_uri = store.getState().getIn(['data', 'data']);
  const task_type = store.getState().getIn(['problems', 'tasktype']);
  const task_subtype = store.getState().getIn(['problems', 'tasksubtype']);
  const target_features = store.getState().getIn(['problems', 'targets']);
  // predict_features is currently ignored.  Later user will be able to select features to use
  // during prediction
  const predict_features = [];
  const metrics = store.getState().getIn(['problems', 'metrics']);
  const max_pipelines = 10;

  // Gather the parameters needed for a CreatePipelines call.
  const params = {
    context,
    data_uri,
    task_type,
    task_subtype,
    metrics,
    target_features,
    predict_features,
    max_pipelines
  };
  console.log('pipeline params:',params)
  
  let query = [];
  for (let x in params) {
    if (params.hasOwnProperty(x)) {
      query.push(`${x}=${params[x]}`);
    }
  }

  // perform pipeline call to TA2
  const url = `/pipeline?${query.join('&')}`;
  json(url).post({}, resp => {
    resp = resp.filter(x => x.progressInfo === 'COMPLETED');

    resp.forEach(pipeline => {
      store.dispatch(action.addPipeline(pipeline.pipelineId, pipeline.pipelineInfo.predictResultUris[0], pipeline.pipelineInfo.scores[0], response));
    });
  });
});



// When the active data changes, populate the variables panel. Observe changes to the data
// component of the store.


observeStore(next => {
  const immData = next.getIn(['data', 'data']);

  // Clear the variables panel.
  const panel = select('#vars .panel');
  panel.selectAll('*').remove();

  // Bail if there's no data.
  if (immData === null) {
    return;
  }

  // Extract the list of variable names.
  const data = immData.toJS();
  const names = Object.keys(data[0]);

  // Gather up a list of new variables to create.
  const vars = names.map(name => ({
    name,
    data: data.map(datum => datum[name])
  }));

  // Set these variables as the application's "original variables".
  //
  // NOTE: if this is not done in a timeout callback, it results in a weird
  // infinite loop for some reason.
  window.setTimeout(() => store.dispatch(action.setVariables(vars)), 0);
}, s => s.getIn(['data', 'data']));



let yVarDropdown = new Dropdown(select('#x-dropdown').node(), {
  buttonText: 'Target Variable',
  onSelect: item => {
    store.dispatch(action.setExploratoryVar(0, item));
    store.dispatch(action.setExploratoryVarMatrix(0, item));
  }
});

//let yVarDropdown = new Dropdown(select('#y-dropdown').node(), {
//  buttonText: 'y',
//  onSelect: item => {
//    store.dispatch(action.setExploratoryVar(1, item));
//  }
//});

const varsChanged = (origVars, logVars) => {
  const vars = [].concat(origVars, logVars);

  // Fill the variable menus in the exploratory vis section.
  yVarDropdown.setItems(vars, d => d.name);
  //yVarDropdown.setItems(vars, d => d.name);
};


// check if a variable is discrete or continuous by observing up to first 25 elements
// This routine is a heuristic to determine if a feature is numeric or string and continuous
// or discrete.  The type of the variable is examined first, but numbers might be represented
// as strings, like '345', so an attempt is made to convert to numbers.  If the number of different
// values is < 70% of the length of the examined array, the feature is assumed to be discrete.

function determineVariableType(variable) {
  let uniqueValues = 0
  let numberCount = 0
  let stringCount = 0
  let values = []
  let lengthToTest = Math.min(25,variable.length)
  for (var i=0;i<lengthToTest;i++) {
    //console.log(variable[i])
    if (typeof(variable[i]) == "number") {
      numberCount += 1
    } else if (! isNaN(Number(variable[i])) ) {
      numberCount += 1
    } else if (typeof(variable[i]) == "string") {
      stringCount += 1
    }
    if (values.includes(variable[i])== false) {
      values.push(variable[i])
    }
  }
  //console.log('stringcount',stringCount, 'numberCount',numberCount,'values',values)
  let outRec = {}
  outRec.discrete = (values.length < lengthToTest / 1.5  ? true : false)
  outRec.type = ((stringCount > 0) ? 'string' : 'number')
  return outRec
}


// Draw the plots of each variable inside their collapsible buttons
// Candela plots are added for each variable.

observeStore(next => {
  const vars = next.get('vars').toJS();

  selectAll('.original-variables')
    .classed('hidden', vars.length === 0);

  const logVars = next.get('logVars').toJS();
  selectAll('.exploratory-vis,.modeling')
    .classed('hidden', vars.length + logVars.length === 0);

  varsChanged(vars, logVars);

  const panels = select('#vars .panel')
    .selectAll('.panel-heading')
    .data(vars)
    .enter()
    .append(d => stringToElement(varTemplate({
      name: d.name,
      button: false
    })));

  panels.select('.panel-body')
    .select('.vis')
    .each(function (d) {
     const vis = new HistogramPlot(this, { // eslint-disable-line no-unused-vars
        data: d.data,
        opacity: 0.9,
        width: 300*plotSizeScale,
        height: 200*plotSizeScale
      });
      vis.render();

      // add second plot
      const vis2= new NormalPlot(this, { // eslint-disable-line no-unused-vars
        data: d.data,
        opacity: 0.9,
        width: 300*plotSizeScale,
        height: 200*plotSizeScale
      });
      vis2.render();
    });

  panels.select('.log')
    .on('click', d => {
      const data = d.data.map(x => Math.log(x))
        .filter(x => isFinite(x));

      store.dispatch(action.createLogVariable(d.name, data));
    });
}, s => s.get('vars'));

// When the list of problems changes, populate the problems tab menu.
let problemDropdown = new Dropdown(select('#problemdropdown').node(), {
  buttonText: 'Problem',
  onSelect: prob => {
    select('.description')
      .html(md.render(prob.description));

    select('.metadata')
      .append(d => stringToElement(metadataTemplate({
        metadata: prob.metadata
      })));

    //json(`/dataset/data/${prob.dataFile}`, data => {
    json('/dataset/datatesting', data => {
      store.dispatch(action.setActiveData(data.data, data.name, data.path, data.meta));
    });
  }
});

/*
observeStore(next => {
  const problems = next.get('problems').toJS();
  problemDropdown.setItems(problems, d => d.problemId);
}, s => s.get('problems'));
*/


// When the list of derived log transform variables changes, update the
// clickable state of the log transform buttons, and the list of log-variable
// panels.
observeStore(next => {
  const logVars = next.get('logVars').toJS();

  selectAll('.derived-variables')
    .classed('hidden', logVars.length === 0);

  const vars = next.get('vars').toJS();
  selectAll('.exploratory-vis,.modeling')
    .classed('hidden', vars.length + logVars.length === 0);

  varsChanged(vars, logVars);

  // Disable "compute log transform" buttons for variables that have already
  // been log-transformed.
  select('#vars .panel')
    .selectAll('.log')
    .each(function (d) {
      const logName = `log_${d.name}`;
      let disabled = false;
      logVars.forEach(logvar => {
        if (logvar.name === logName) {
          disabled = true;
        }
      });

      select(this).attr('disabled', disabled ? true : null);
    });

  select('#logvars .panel')
    .selectAll('.panel-heading')
    .data(logVars)
    .enter()
    .append(d => stringToElement(varTemplate({
      name: d.name,
      button: false
    })))
    .select('.panel-body')
    .select('.vis')
    .each(function (d) {
      const vis = new NormalPlot(this, { // eslint-disable-line no-unused-vars
        data: d.data,
        opacity: 0.9,
        width: 300,
        height: 200
      });
      vis.render();
    });
}, s => s.get('logVars'));


// When the exploratory vis variables change, update the menus and draw a plot
observeStore(next => {
  const exploratoryVis = next.get('exploratoryVis');

  // Collect the variable data.
  const get = key => {
    let x = exploratoryVis.get(key);
    if (x !== null) {
      x = x.toJS();
    }
    return x;
  };
  const xVar = get('xVar');
  const yVar = get('yVar');

  // Set the text on the dropdown menus.
  const setName = (which, label, v) => {
    select(which)
      .text(v ? `${label}: ${v.name}` : label);
  };
  setName('button.var1', 'X', xVar);
  setName('button.var2', 'Y', yVar);

  // If both variables are selected, display a scatterplot of them.
  if (xVar && yVar) {
    const data = xVar.data.map((d, i) => ({
      x: d,
      y: yVar.data[i]
    }));

    const el = select('#scatterplot');
    console.log(el);
    el.selectAll('*')
      .remove();

    const vis = new ScatterPlot(el.node(), { // eslint-disable-line no-unused-vars
      data,
      x: 'x',
      y: 'y',
      opacity: 0.9,
      width: 300*plotSizeScale,
      height: 400*plotSizeScale
    });
    vis.render();
  }
}, s => s.get('exploratoryVis'));



// add a row of scatterplots ; show plots for all variables against the trainingVariable
// When the exploratory vis matrix variables change, update the row of plots.  This ignores
// any discrete plots, because it doesn't have logic to handle one or both variables being discrete

observeStore(next => {
  const exploratoryVisMatrix = next.get('exploratoryVisMatrix');

  // Collect the variable data.
  const get = key => {
    let x = exploratoryVisMatrix.get(key);
    if (x !== null) {
      x = x.toJS();
    }
    return x;
  };

  // Get the selected yVar as the modeling variable.  Then build up the 'vars' variable
  // that contains all the feature data columns.  We will need this to generate a plot for
  // each feature

  // TODO: It would have been better to pass in the inputVars, but I wasn't sure how to get
  // them automatically updated, so just pull them from the store below.

  const yVar = get('yVar');
  const immData = next.getIn(['data', 'data']);

  if (!immData) {
    return;
  }

  const data = immData.toJS();
  const names = Object.keys(data[0]);

  // Gather up the features as separate entries in a vars list
  const vars = names.map(name => ({
    name,
    data: data.map(datum => datum[name])
  }));

  // If the modeling variable is filled display a row of scatterplots
  if (yVar) {

    // clear out the previous display
    const elmatrix = select('#scatterplotmatrix');
    elmatrix.selectAll('*')
      .remove();

    // loop through the features and draw a plot for each feature compared to the modeling feature
    for (var featureIndex=0; featureIndex<vars.length; featureIndex++) {

      // ignore the case where the modeling feature is plotted against itself
      // also ignore cases where the Y feature is non-numeric by testing using a heuristic
      // and where the feature is an internal d3mIndex added to all datasets, this would confuse
      // a problem-oriented user

      if ((vars[featureIndex].name != yVar.name) &&
          (vars[featureIndex].name != 'd3mIndex') &&
	  (determineVariableType(vars[featureIndex].data).type=='number')) {

        // fill the yVar object
        const data = yVar.data.map((d, i) => ({
          [yVar.name]: yVar.data[i],
          [vars[featureIndex].name]: vars[featureIndex].data[i],
          name: d
        }));

        // add a new Div inside the #scatterplotmatrix element
        jQuery('<h5/>', {
          text: vars[featureIndex].name,
          }).appendTo('#scatterplotmatrix');
        jQuery('<div/>', {
          id: vars[featureIndex].name,
          }).appendTo('#scatterplotmatrix');

        // create a new plot for this variable combination
        var plotElement = document.getElementById(vars[featureIndex].name)
        const vismatrix = new ScatterPlot(plotElement, { // eslint-disable-line no-unused-vars
          data,
          x: vars[featureIndex].name,
          y: yVar.name,
          width: 400*plotSizeScale,
          height: 400*plotSizeScale
        });
        vismatrix.render();
      }
    }
  }

}, s => s.get('exploratoryVisMatrix'));



// When the model changes, update the input variables.
observeStore(next => {
  const model = next.getIn(['modeling', 'model']);
  let buttons = [];

  switch (model) {
  case 'linear':
  case 'loess':
    buttons.push({
      variableName: 'predictor_variables',
      displayName: 'predictor'
    });
    buttons.push({
      variableName: 'response',
      displayName: 'response'
    });
    break;

  case 'quadratic':
    buttons.push({
      variableName: 'predictor_variables',
      displayName: 'predictor'
    });
    buttons.push({
      variableName: 'response',
      displayName: 'response'
    });
    buttons.push({
      variableName: 'quadratic_variables',
      displayName: 'quadratic'
    });
    break;

  case null:
    break;

  default:
    throw new Error(`illegal model type: ${model}`);
  }

  const sel = select('.model-vars');
  sel.selectAll('*')
    .remove();

  sel.selectAll('div')
    .data(buttons)
    .enter()
    .append('div')
    .each(function (d) {
      const vars = allVars();

      let dropdown = new Dropdown(this, {
        buttonText: d.displayName[0].toUpperCase() + d.displayName.slice(1),
        onSelect: item => {
          store.dispatch(action.setModelingVar(item.variableName, item));
        }
      });

      dropdown.setItems(vars.map(v => Object.assign({}, v, {
        variableName: d.variableName,
        displayName: d.displayName
      })), d => d.name);
    });

  window.setTimeout(() => store.dispatch(action.setModelInputVars(null)), 0);
  window.setTimeout(() => store.dispatch(action.setModelInputVars(buttons.map(x => x.variableName))), 0);
}, s => s.getIn(['modeling', 'model']));


// When the modeling vis variables change, update the menus.
observeStore((next, last) => {
  if (last && last.getIn(['modeling', 'inputVars']) === null) {
    return;
  }

  const modeling = next.getIn(['modeling', 'inputVars']);

  if (modeling === null) {
    return;
  }

  // Collect the variable data.
  const get = key => {
    let x = modeling.get(key);
    if (x !== null) {
      x = x.toJS();
    }
    return x;
  };


  const inputVars = modeling.toJS();
  const vars = Object.keys(inputVars).map(get);

  // Set the text on the dropdown menus.
  const setName = (which, label, v) => {
    select(which)
      .text(v ? `${label}: ${v.name}` : label);
  };
  Object.keys(inputVars).forEach(k => {
    const v = inputVars[k];
    if (v !== null) {
      setName(`button.${v.variableName}`, v.displayName, v);
    }
  });

  // If all variables are selected, run a model and display the results.
  if (vars.indexOf(null) < 0) {
    // Construct a data table.
    let data = {};
    vars.forEach(v => {
      data[v.name] = v.data;
    });

    // Construct a Tangelo service URL.
    let url = `d3mLm/${next.getIn(['modeling', 'model'])}?data=${JSON.stringify(data)}`;
    vars.forEach(v => {
      url += `&${v.variableName}="${v.name}"`;
    });

    // Execute the service and display the result.
    json(url, resp => {
      select('pre.info')
        .classed('hidden', false)
        .text(JSON.stringify(resp, null, 2));
    });
  }
}, s => s.getIn(['modeling', 'inputVars']));



// when the user selects the TA2s to connect to for computation, then create a session and initiate

observeStore(next => {
  const pipelines = next.getIn(['ta2', 'pipelines']).toJS();

  let panels = select('#pipelines .panel')
    .selectAll('.panel')
    .data(pipelines)
    .enter()
    .append(d => stringToElement(pipelineTemplate({
      name: d.id
    })));

  // when the predict button is selected, then connect to the TA2 by calling a tangelo service
  // to make the GRPC API handshake.   The parameters needed to create an analysis pipeline are 
  // gathered here,  packed into a query object, and sent to the service. 

  const predict = panels.select('.predict')
    .on('click', d => {
      const ta2 = store.getState().get('ta2');
      const session = JSON.stringify(ta2.get('session').toJS().context);
      const model = ta2.get('model');
      const port = model.get('port');
      const predictor = store.getState().getIn(['data', 'meta', 'trainData', 'trainData'])
        .toJS()
        .filter(f => f.varRole === 'attribute')
        .filter(f => f.varType === 'integer' || f.varType === 'float')
        .map(f => f.varName);
      const data_uri = store.getState().getIn(['config'])['dataset_schema']

      const params = {
        port,
        session,
        pipeline: d.id,
        data_uri,
        predictor: JSON.stringify(predictor)
      };

      let query = [];
      for (let x in params) {
        if (params.hasOwnProperty(x)) {
          query.push(`${x}=${params[x]}`);
        }
      }
      const url = `/pipeline/execute?${query.join('&')}`;
      json(url).post({}, resp => {
        console.log(resp);
      });
    });

  panels.select('.export')
    .on('click', d => {
      const ta2 = store.getState().get('ta2');
      const session = JSON.stringify(ta2.get('session').toJS().context);
      const model = ta2.get('model');
      const port = model.get('port');


      const params = {
        port,
        session,
        pipeline: d.id,
      };

      let query = [];
      for (let x in params) {
        if (params.hasOwnProperty(x)) {
          query.push(`${x}=${params[x]}`);
        }
      }
      const url = `/pipeline/export?${query.join('&')}`;
      json(url).post({}, resp => {
        console.log(resp);
      });
    });

  panels.select('.score-type')
    .html(d => d.score.metric);

  panels.select('.score')
    .html(d => d.score.value);
}, s => s.getIn(['ta2', 'pipelines']));


