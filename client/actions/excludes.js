import axios from 'axios';
import * as constants from '../constants';

/*
 * Load the rules.
 */
export function fetchExcludes() {
  return {
    type: constants.FETCH_EXCLUDES,
    payload: {
      promise: axios.get('/api/excludes', {
        responseType: 'json'
      })
    }
  };
}

export function updateExcludes(data) {
  return {
    type: constants.UPDATE_EXCLUDES,
    payload: {
      promise: axios({
        method: 'post',
        url: '/api/excludes',
        data,
        responseType: 'json'
      })
    }
  };
}

export function openNotification() {
  return {
    type: constants.OPEN_EXCLUDES_NOTIFICATION
  };
}

export function closeNotification() {
  return {
    type: constants.CLOSE_EXCLUDES_NOTIFICATION
  };
}
