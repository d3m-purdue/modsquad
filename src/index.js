import 'bootstrap/dist/js/bootstrap';
import { select,
         selectAll } from 'd3-selection';
import dl from 'datalib';

import { action,
         store,
         observeStore } from './redux';
import stringToElement from './util/stringToElement';
import { NormalPlot } from './util/stats';
import data from '../data/index.yml';
import varTemplate from './template/var.jade';
import body from './index.jade';
import './index.less';

// Construct a require context for the available data files.
const dataReq = require.context('../data/csv', false, /\.csv$/);

// Install the content template.
select(document.body).html(body());

// Install the dataset list.
store.dispatch(action.setDatasetList(data));

// When the active dataset changes, set the dropdown menu's text to the name of
// the dataset.
observeStore(next => {
  const index = next.getIn(['data', 'which']);
  const sel = select('#navbar a.dropdown-toggle');
  if (index === -1) {
    sel.html('Select dataset <span class="caret"></span>');
  } else {
    const dataset = next.getIn(['data', 'datasets', index]);
    sel.html(`${dataset.get('name')} <span class="caret"></span>`);
  }
}, s => s.getIn(['data', 'which']));

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

const varsChanged = (vars, logVars) => {
  const allVars = [].concat(vars, logVars);

  const fillMenu = (sel, which) => {
    const menu = sel.selectAll('li')
      .data(allVars);

    menu.enter()
      .append('li')
      .append('a')
      .attr('href', '#')
      .text(d => d.name)
      .on('click', d => {
        store.dispatch(action.setLinearModelVar(which, d));
      });

    menu.exit()
      .remove();
  };

  fillMenu(select('.variable1'), 0);
  fillMenu(select('.variable2'), 1);
};

observeStore(next => {
  const vars = next.get('vars').toJS();

  selectAll('.original-variables')
    .classed('hidden', vars.length === 0);

  const logVars = next.get('logVars').toJS();
  selectAll('.linear-modeling')
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
        size: 'size',
        width: 300,
        height: 200
      });
    });

  panels.select('.log')
    .on('click', d => {
      const data = d.data.map(x => Math.log(x))
        .filter(x => isFinite(x));

      store.dispatch(action.createLogVariable(d.name, data));
    });
}, s => s.get('vars'));

// When the list of datasets changes, populate the dropdown menu.
observeStore(next => {
  const datasets = next.getIn(['data', 'datasets']).toJS();
  const sel = select('#navbar ul.dropdown-menu')
    .selectAll('li')
    .data(datasets, d => d.key || d.name);

  sel.exit()
    .remove();

  sel.enter()
    .append('li')
    .append('a')
    .attr('href', '#')
    .html(d => d.name)
    .on('click', (d, i) => {
      store.dispatch(action.setActiveDataset(i));

      const dataRaw = dataReq(`./${d.key || d.name}.csv`);
      const data = dl.read(dataRaw, {
        type: 'csv',
        parse: 'auto'
      });
      store.dispatch(action.setActiveData(data));
    });
}, s => s.getIn(['data', 'datasets']));

// When the list of derived log transform variables changes, update the
// clickable state of the log transform buttons, and the list of log-variable
// panels.
observeStore(next => {
  const logVars = next.get('logVars').toJS();

  selectAll('.derived-variables')
    .classed('hidden', logVars.length === 0);

  const vars = next.get('vars').toJS();
  selectAll('.linear-modeling')
    .classed('hidden', vars.length + logVars.length === 0);

  varsChanged(vars, logVars);

  // Disable "compute log transform" buttons for variables that have already
  // been log-transformed.
  select('#vars .panel')
    .selectAll('.log')
    .each(function (d) {
      const logName = `log-${d.name}`;
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
        size: 'size',
        width: 300,
        height: 200
      });
    });
}, s => s.get('logVars'));

// When the linear modeling variables change, update the menus.
observeStore(next => {
  const get = key => {
    let x = linearModel.get(key);
    if (x !== null) {
      x = x.toJS();
    }
    return x;
  };

  const setName = (which, label, v) => {
    select(which)
      .text(v ? `${label}: ${v.name}` : label);
  };

  const linearModel = next.get('linearModel');
  const depVar = get('depVar');
  const respVar = get('respVar');

  setName('button.var1', 'Dependent Variable', depVar);
  setName('button.var2', 'Response Variable', respVar);
}, s => s.get('linearModel'));
