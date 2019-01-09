/* global window, sessionStorage */
import axios from 'axios';
import * as constants from '../constants';
import { isTokenExpired, decodeToken } from '../utils/auth';

export function logout() {
  return (dispatch) => {
    sessionStorage.removeItem(`${window.config.A0EXT_PROVIDER}-deploy:apiToken`);
    window.location.href = `${window.config.BASE_URL}/admins/logout`;

    dispatch({
      type: constants.LOGOUT_SUCCESS
    });
  };
}

export function loadCredentials() {
  return (dispatch) => {
    const apiToken = sessionStorage.getItem(`${window.config.A0EXT_PROVIDER}-deploy:apiToken`);
    if (apiToken) {
      const decodedToken = decodeToken(apiToken);
      if (isTokenExpired(decodedToken)) {
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${apiToken}`;

      sessionStorage.setItem(`${window.config.A0EXT_PROVIDER}-deploy:apiToken`, apiToken);

      dispatch({
        type: constants.RECIEVED_TOKEN,
        payload: {
          token: apiToken
        }
      });

      dispatch({
        type: constants.LOGIN_SUCCESS,
        payload: {
          token: apiToken,
          decodedToken,
          user: decodedToken
        }
      });
    }
  };
}
