import axios from 'axios';
import * as constants from '../constants';

export function fetchMappings() { // eslint-disable-line import/prefer-default-export
  return {
    type: constants.FETCH_MAPPINGS,
    payload: {
      promise: axios.get('/api/mappings', {
        responseType: 'json'
      })
    }
  };
}

export function saveMappings(mappings) { // eslint-disable-line import/prefer-default-export
  return {
    type: constants.SAVE_MAPPINGS,
    meta: {
      mappings
    },
    payload: {
      promise: axios({
        method: 'post',
        url: '/api/mappings',
        data: { mappings },
        responseType: 'json'
      })
    }
  };
}
