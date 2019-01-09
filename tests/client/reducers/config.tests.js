import expect from 'expect';
import { config } from '../../../client/reducers/config';
import * as constants from '../../../client/constants';

const initialState = {
  loading: false,
  error: null,
  record: {},
  activeTab: 'config',
  showNotification: false
};

describe('config reducer', () => {
  it('should return the initial state', () => {
    expect(
      config(undefined, {}).toJSON()
    ).toEqual(
      initialState
    );
  });

  it('should handle FETCH_CONFIGURATION_PENDING', () => {
    expect(
      config(initialState, {
        type: constants.FETCH_CONFIGURATION_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });

  it('should handle FETCH_CONFIGURATION_REJECTED', () => {
    expect(
      config(initialState, {
        type: constants.FETCH_CONFIGURATION_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while loading the configuration: ERROR',
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });

  it('should handle FETCH_CONFIGURATION_FULFILLED', () => {
    expect(
      config(initialState, {
        type: constants.FETCH_CONFIGURATION_FULFILLED,
        payload: {
          data: {
            attribute: 'test',
            showNotification: true
          }
        }
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        record: {
          attribute: 'test',
          showNotification: true
        },
        activeTab: 'config',
        showNotification: true
      }
    );
  });

  it('should handle CLOSE_NOTIFICATION_PENDING', () => {
    expect(
      config(initialState, {
        type: constants.CLOSE_NOTIFICATION_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });
  it('should handle CLOSE_NOTIFICATION_REJECTED', () => {
    expect(
      config(initialState, {
        type: constants.CLOSE_NOTIFICATION_REJECTED
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });
  it('should handle CLOSE_NOTIFICATION_FULFILLED', () => {
    expect(
      config(initialState, {
        type: constants.CLOSE_NOTIFICATION_FULFILLED
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });
  it('should handle CONFIRM_NOTIFICATION_PENDING', () => {
    expect(
      config(initialState, {
        type: constants.CONFIRM_NOTIFICATION_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });
  it('should handle CONFIRM_NOTIFICATION_REJECTED', () => {
    expect(
      config(initialState, {
        type: constants.CONFIRM_NOTIFICATION_REJECTED
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        record: {},
        activeTab: 'config',
        showNotification: false
      }
    );
  });

  it('should handle CONFIRM_NOTIFICATION_FULFILLED', () => {
    expect(
      config(initialState, {
        type: constants.CONFIRM_NOTIFICATION_FULFILLED
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        record: {},
        activeTab: 'rules',
        showNotification: false
      }
    );
  });
});
