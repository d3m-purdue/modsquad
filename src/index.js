import 'bootstrap/dist/js/bootstrap';
import { select } from 'd3-selection';

import { action,
         store,
         observeStore } from './redux';
import body from './index.jade';
import './index.less';

select(document.body).html(body());

observeStore(next => {
  const index = next.getIn(['data', 'which']);
  const sel = select('#navbar a.dropdown-toggle');
  if (index === -1) {
    sel.html('Select dataset <span class="caret"></span>');
  } else {
    const dataset = s.getIn(['data', 'datasets']).get(index);
    sel.html(dataset.get('name'));
  }
}, s => s.getIn(['dataset', 'which']));

observeStore(next => {
  const mode = next.get('mode');
  console.log(`mode changed to ${mode}`);
}, s => s.get('mode'));

store.dispatch(action.initial('reduxstrap'));

window.setTimeout(() => {
  store.dispatch(action.secondary());
}, 2000);
