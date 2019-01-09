import expect from 'expect';

import { resourceServers } from '../../../client/reducers/resourceServers';
import * as constants from '../../../client/constants';

const initialState = {
  loading: false,
  error: null,
  records: {},
  showNotification: false,
  notificationType: 'success'
};

describe('resourceServers reducer', () => {
  it('should return the initial state', () => {
    expect(
      resourceServers(undefined, {}).toJSON()
    ).toEqual(
      initialState
    );
  });

  it('should handle FETCH_RESOURCE_SERVERS_PENDING', () => {
    expect(
      resourceServers(initialState, {
        type: constants.FETCH_RESOURCE_SERVERS_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle FETCH_RESOURCE_SERVERS_REJECTED', () => {
    expect(
      resourceServers(initialState, {
        type: constants.FETCH_RESOURCE_SERVERS_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while loading the resourceServers: ERROR',
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle FETCH_RESOURCE_SERVERS_FULFILLED', () => {
    expect(
      resourceServers(initialState, {
        type: constants.FETCH_RESOURCE_SERVERS_FULFILLED,
        payload: {
          data: [
            {
              name: 'auth0-github-deploy',
              global: false,
              client_id: 'z4JBexbssw4o6mCRPRQWaxzqampwXULL'
            }
          ]
        }
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        records: [
          {
            name: 'auth0-github-deploy',
            global: false,
            client_id: 'z4JBexbssw4o6mCRPRQWaxzqampwXULL'
          }
        ],
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle UPDATE_MANUAL_RESOURCE_SERVERS_REJECTED', () => {
    expect(
      resourceServers(initialState, {
        type: constants.UPDATE_MANUAL_RESOURCE_SERVERS_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while updating the resourceServers: ERROR',
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle OPEN_RESOURCE_SERVER_NOTIFICATION', () => {
    expect(
      resourceServers(initialState, {
        type: constants.OPEN_RESOURCE_SERVER_NOTIFICATION
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: false,
        records: {},
        showNotification: true,
        notificationType: 'success'
      }
    );
  });

  it('should handle CLOSE_RESOURCE_SERVER_NOTIFICATION', () => {
    expect(
      resourceServers(initialState, {
        type: constants.CLOSE_RESOURCE_SERVER_NOTIFICATION
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });
});
