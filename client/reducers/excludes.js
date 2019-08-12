import { fromJS } from 'immutable';

import * as constants from '../constants';
import createReducer from '../utils/createReducer';

const initialState = {
  loading: false,
  error: null,
  records: {
    rules: [],
    clients: [],
    databases: [],
    connections: [],
    resourceServers: []
  },
  showNotification: false,
  notificationType: 'success'
};

export const excludes = createReducer(fromJS(initialState), { // eslint-disable-line import/prefer-default-export
  [constants.FETCH_EXCLUDES_PENDING]: (state) =>
    state.merge({
      loading: true,
      error: null
    }),
  [constants.FETCH_EXCLUDES_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while loading the excludes: ${action.errorMessage}`
    }),
  [constants.FETCH_EXCLUDES_FULFILLED]: (state, action) =>
    state.merge({
      loading: false,
      error: null,
      records: fromJS(action.payload.data)
    }),
  [constants.UPDATE_EXCLUDES_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while updating the excludes: ${action.errorMessage}`
    }),
  [constants.OPEN_EXCLUDES_NOTIFICATION]: (state) =>
    state.merge({
      error: false,
      showNotification: true
    }),
  [constants.CLOSE_EXCLUDES_NOTIFICATION]: (state) =>
    state.merge({
      showNotification: false
    })
});
