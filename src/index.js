import 'bootstrap/dist/js/bootstrap';
import ScatterPlot from 'candela/plugins/vega/ScatterPlot';
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
import { allVars } from './util';
import varTemplate from './template/var.jade';
import body from './index.jade';
import './index.less';
import models from './tangelo/models.yml';

// Construct a markdown renderer.
const md = new Remarkable();

// Install the content template.
select(document.body).html(body());

// Install the list of problems.
json('/dataset/list', problems => {
  store.dispatch(action.setProblemList(problems));
});

// Install the model choices.
let modelDropdown = new Dropdown(select('#modeldropdown').node(), {
  buttonText: 'Model',
  onSelect: item => {
    store.dispatch(action.setModelType(item));
  }
});
modelDropdown.setItems([
  'linear',
  'quadratic',
  'loess'
]);

// Install the TA2 options.
let ta2Dropdown = new Dropdown(select('.ta2-models').node(), {
  buttonText: 'TA2',
  onSelect: item => {
    selectAll('.ta2-params,.train')
      .classed('hidden', false);

    json(`/session?port=${item.port}`)
      .post({}, session => {
        store.dispatch(action.setTA2Session(session));
      });

    store.dispatch(action.setTA2Model(item));
  }
});
ta2Dropdown.setItems(models, d => d.display);

// Install menus for the TA2 model parameters.
let ta2Predictor = new Dropdown(select('.ta2-predictor').node(), {
  buttonText: 'Predictor',
  onSelect: item => {
    store.dispatch(action.setTA2Predictor(item));
  }
});
let ta2Response = new Dropdown(select('.ta2-response').node(), {
  buttonText: 'Response',
  onSelect: item => {
    store.dispatch(action.setTA2Response(item));
  }
});

// Install action for train button.
select('button.train').on('click', () => {
  const ta2 = store.getState().get('ta2');
  const session = JSON.stringify(ta2.get('session').toJS().context);
  const model = ta2.get('model');
  const port = model.get('port');
  const predictor = ta2.getIn(['inputs', 'predictor', 'name']);
  const response = ta2.getIn(['inputs', 'response', 'name']);
  const data = store.getState().getIn(['data', 'file']);

  // TODO - gather up the variables, make a call to the appropriate endpoint.
  const params = {
    port,
    session,
    data,
    predictor,
    response
  };
  let query = [];
  for (let x in params) {
    if (params.hasOwnProperty(x)) {
      query.push(`${x}=${params[x]}`);
    }
  }
  const url = `/pipeline?${query.join('&')}`;
  json(url).post({}, resp => {
    console.log(resp);
  });
});

// When the active data changes, populate the variables panel.
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

let xVarDropdown = new Dropdown(select('#x-dropdown').node(), {
  buttonText: 'x',
  onSelect: item => {
    store.dispatch(action.setExploratoryVar(0, item));
  }
});
let yVarDropdown = new Dropdown(select('#y-dropdown').node(), {
  buttonText: 'y',
  onSelect: item => {
    store.dispatch(action.setExploratoryVar(1, item));
  }
});
const varsChanged = (origVars, logVars) => {
  const vars = [].concat(origVars, logVars);

  // Fill the variable menus in the exploratory vis section.
  xVarDropdown.setItems(vars, d => d.name);
  yVarDropdown.setItems(vars, d => d.name);

  // Fill the variable menus in the TA2 section.
  ta2Predictor.setItems(origVars, d => d.name);
  ta2Response.setItems(origVars, d => d.name);
};

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
      button: true
    })));

  panels.select('.panel-body')
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

    json(`/dataset/data/${prob.dataFile}`, data => {
      store.dispatch(action.setActiveData(data.data, data.file));
    });
  }
});
observeStore(next => {
  const problems = next.get('problems').toJS();
  problemDropdown.setItems(problems, d => d.problemId);
}, s => s.get('problems'));

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

// When the exploratory vis variables change, update the menus.
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
      width: 600,
      height: 600
    });
    vis.render();
  }
}, s => s.get('exploratoryVis'));

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

observeStore(next => {
  const predictor = next.getIn(['ta2', 'inputs', 'predictor']);
  const response = next.getIn(['ta2', 'inputs', 'response']);

  if (predictor === null || response === null) {
    return;
  }

  select('button.train')
    .attr('disabled', null)
    .classed('disabled', false);
}, s => s.getIn(['ta2', 'inputs']));
