import expect from 'expect';
import { excludes } from '../../../client/reducers/excludes';
import * as constants from '../../../client/constants';

const initialState = {
  loading: false,
  error: null,
  records: {
    rules: [],
    clients: [],
    databases: [],
    connections: [],
    resourceServers: []
  },
  showNotification: false,
  notificationType: 'success'
};

describe('excludes reducer', () => {
  it('should return the initial state', () => {
    expect(
      excludes(undefined, {}).toJSON()
    ).toEqual(
      initialState
    );
  });

  it('should handle FETCH_EXCLUDES_PENDING', () => {
    expect(
      excludes(initialState, {
        type: constants.FETCH_EXCLUDES_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        records: {
          rules: [],
          clients: [],
          databases: [],
          connections: [],
          resourceServers: []
        },
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle FETCH_EXCLUDES_REJECTED', () => {
    expect(
      excludes(initialState, {
        type: constants.FETCH_EXCLUDES_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while loading the excludes: ERROR',
        records: {
          rules: [],
          clients: [],
          databases: [],
          connections: [],
          resourceServers: []
        },
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle FETCH_EXCLUDES_FULFILLED', () => {
    expect(
      excludes(initialState, {
        type: constants.FETCH_EXCLUDES_FULFILLED,
        payload: {
          data: [
            {
              rules: [ 'rule1', 'rule2' ],
              clients: [ 'client' ],
              databases: [ 'test-database' ],
              connections: [ 'facebook' ],
              resourceServers: []
            }
          ]
        }
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        records: {
          rules: [ 'rule1', 'rule2' ],
          clients: [ 'client' ],
          databases: [ 'test-database' ],
          connections: [ 'facebook' ],
          resourceServers: []
        },
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle UPDATE_EXCLUDES_REJECTED', () => {
    expect(
      excludes(initialState, {
        type: constants.UPDATE_EXCLUDES_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while updating the excludes: ERROR',
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle OPEN_RULE_NOTIFICATION', () => {
    expect(
      excludes(initialState, {
        type: constants.OPEN_EXCLUDES_NOTIFICATION
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

  it('should handle CLOSE_RULE_NOTIFICATION', () => {
    expect(
      excludes(initialState, {
        type: constants.CLOSE_EXCLUDES_NOTIFICATION
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
