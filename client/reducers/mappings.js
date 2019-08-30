import { fromJS } from 'immutable';

import * as constants from '../constants';
import createReducer from '../utils/createReducer';

const initialState = {
  loading: false,
  error: null,
  record: { }
};

export const mappings = createReducer(fromJS(initialState), { // eslint-disable-line import/prefer-default-export
  [constants.FETCH_MAPPINGS_PENDING]: (state) =>
    state.merge({
      loading: true,
      error: null,
      record: { }
    }),
  [constants.FETCH_MAPPINGS_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while loading the mappings: ${action.errorMessage}`
    }),
  [constants.FETCH_MAPPINGS_FULFILLED]: (state, action) =>
    state.merge({
      loading: false,
      error: null,
      record: JSON.stringify(action.payload.data, null, '  ')
    }),
  [constants.SAVE_MAPPINGS_PENDING]: (state) =>
    state.merge({
      loading: true,
      error: null
    }),
  [constants.SAVE_MAPPINGS_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while saving the mappings: ${action.errorMessage}`,
      record: action.meta.mappings
    }),
  [constants.SAVE_MAPPINGS_FULFILLED]: (state, action) =>
    state.merge({
      loading: false,
      error: null,
      record: JSON.stringify(action.payload.data, null, '  ')
    })
});
