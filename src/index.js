import 'bootstrap/dist/js/bootstrap';
import { select } from 'd3-selection';
import dl from 'datalib';

import { action,
         store,
         observeStore } from './redux';
import data from '../data/index.yml';
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
