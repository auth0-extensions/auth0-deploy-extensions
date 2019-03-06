import { fromJS } from 'immutable';

import * as constants from '../constants';
import createReducer from '../utils/createReducer';

const initialState = {
  loading: false,
  error: null,
  record: { }
};

export const cipher = createReducer(fromJS(initialState), { // eslint-disable-line import/prefer-default-export
  [constants.ENCRYPT_TEXT_PENDING]: (state) =>
    state.merge({
      loading: true,
      record: { }
    }),
  [constants.ENCRYPT_TEXT_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: `An error occurred while encrypting the secret: ${action.errorMessage}`
    }),
  [constants.ENCRYPT_TEXT_FULFILLED]: (state, action) => {
    const { data } = action.payload;
    return state.merge({
      loading: false,
      record: fromJS(data)
    });
  }
});
