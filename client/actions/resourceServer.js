import axios from 'axios';
import * as constants from '../constants';

/*
* Load the resourceServers.
*/
export function fetchAllResourceServers() {
  return {
    type: constants.FETCH_RESOURCE_SERVERS,
    payload: {
      promise: axios.get('/api/resourceServers', {
        responseType: 'json'
      })
    }
  };
}

export function updateResourceServers(data) {
  return {
    type: constants.UPDATE_MANUAL_RESOURCE_SERVERS,
    payload: {
      promise: axios({
        method: 'post',
        url: '/api/resourceServers',
        data,
        responseType: 'json'
      })
    }
  };
}

export function openNotification() {
  return {
    type: constants.OPEN_RESOURCE_SERVER_NOTIFICATION
  };
}

export function closeNotification() {
  return {
    type: constants.CLOSE_RESOURCE_SERVER_NOTIFICATION
  };
}
