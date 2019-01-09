import { fromJS } from 'immutable';
import * as constants from '../constants';
import createReducer from '../utils/createReducer';

const initialState = {
  loading: false,
  error: null,
  records: {},
  showNotification: false,
  notificationType: 'success'
};

export const resourceServers = createReducer(fromJS(initialState), { // eslint-disable-line import/prefer-default-export
  [constants.FETCH_RESOURCE_SERVERS_PENDING]: (state) =>
    state.merge({
      loading: true,
      error: null
    }),
  [constants.FETCH_RESOURCE_SERVERS_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while loading the resourceServers: ${action.errorMessage}`
    }),
  [constants.FETCH_RESOURCE_SERVERS_FULFILLED]: (state, action) =>
    state.merge({
      loading: false,
      error: null,
      records: fromJS(action.payload.data)
    }),
  [constants.UPDATE_MANUAL_RESOURCE_SERVERS_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while updating the resourceServers: ${action.errorMessage}`
    }),
  [constants.OPEN_RESOURCE_SERVER_NOTIFICATION]: (state) =>
    state.merge({
      error: false,
      showNotification: true
    }),
  [constants.CLOSE_RESOURCE_SERVER_NOTIFICATION]: (state) =>
    state.merge({
      showNotification: false
    })
});
