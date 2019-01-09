import axios from 'axios';
import * as constants from '../constants';

/*
 * Load the deployment history.
 */
export function fetchDeployments() {
  return {
    type: constants.FETCH_DEPLOYMENTS,
    payload: {
      promise: axios.get('/api/deployments', {
        timeout: 5000,
        responseType: 'json'
      })
    }
  };
}

/*
 * Open a deployment.
 */
export function openDeployment(deployment) {
  return {
    type: constants.OPEN_DEPLOYMENT,
    payload: {
      deployment
    }
  };
}

/*
 * Clear the current deployment.
 */
export function clearDeployment() {
  return {
    type: constants.CLEAR_DEPLOYMENT
  };
}

/*
 * Run a deployment
 */
export function runDeployment(sha) {
  return {
    type: constants.RUN_DEPLOYMENT,
    payload: {
      promise: axios({
        method: 'post',
        url: '/api/deployments',
        data: { sha },
        responseType: 'json'
      })
    }
  };
}
