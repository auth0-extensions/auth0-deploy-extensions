import axios from 'axios';
import * as constants from '../constants';

/*
 * encrypts secret
 */
export function encryptText(text) { // eslint-disable-line import/prefer-default-export
  return {
    type: constants.ENCRYPT_TEXT,
    payload: {
      promise: axios({
        method: 'post',
        url: '/api/cipher',
        data: { text },
        responseType: 'json'
      })
    }
  };
}
