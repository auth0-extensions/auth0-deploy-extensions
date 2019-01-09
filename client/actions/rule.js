import axios from 'axios';
import * as constants from '../constants';

/*
 * Load the rules.
 */
export function fetchAllRules() {
  return {
    type: constants.FETCH_RULES,
    payload: {
      promise: axios.get('/api/rules', {
        responseType: 'json'
      })
    }
  };
}

export function updateRules(data) {
  return {
    type: constants.UPDATE_MANUAL_RULES,
    payload: {
      promise: axios({
        method: 'post',
        url: '/api/rules',
        data,
        responseType: 'json'
      })
    }
  };
}

export function openNotification() {
  return {
    type: constants.OPEN_RULE_NOTIFICATION
  };
}
export function closeNotification() {
  return {
    type: constants.CLOSE_RULE_NOTIFICATION
  };
}
