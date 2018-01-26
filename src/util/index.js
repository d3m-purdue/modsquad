import { store } from '../redux';

const allVars = () => {
  const state = store.getState();
  const vars = state.get('vars').toJS();
  const logVars = state.get('logVars').toJS();

  return [].concat(vars, logVars);
};

export { allVars };



