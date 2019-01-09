import expect from 'expect';
import { rules } from '../../../client/reducers/rules';
import * as constants from '../../../client/constants';

const initialState = {
  loading: false,
  error: null,
  records: {},
  showNotification: false,
  notificationType: 'success'
};

describe('rules reducer', () => {
  it('should return the initial state', () => {
    expect(
      rules(undefined, {}).toJSON()
    ).toEqual(
      initialState
    );
  });

  it('should handle FETCH_RULES_PENDING', () => {
    expect(
      rules(initialState, {
        type: constants.FETCH_RULES_PENDING
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

  it('should handle FETCH_RULES_REJECTED', () => {
    expect(
      rules(initialState, {
        type: constants.FETCH_RULES_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while loading the rules: ERROR',
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle FETCH_RULES_FULFILLED', () => {
    expect(
      rules(initialState, {
        type: constants.FETCH_RULES_FULFILLED,
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

  it('should handle UPDATE_MANUAL_RULES_REJECTED', () => {
    expect(
      rules(initialState, {
        type: constants.UPDATE_MANUAL_RULES_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while updating the rules: ERROR',
        records: {},
        showNotification: false,
        notificationType: 'success'
      }
    );
  });

  it('should handle OPEN_RULE_NOTIFICATION', () => {
    expect(
      rules(initialState, {
        type: constants.OPEN_RULE_NOTIFICATION
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
      rules(initialState, {
        type: constants.CLOSE_RULE_NOTIFICATION
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
