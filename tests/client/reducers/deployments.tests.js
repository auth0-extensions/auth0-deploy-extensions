import expect from 'expect';
import moment from 'moment';

import { deployments } from '../../../client/reducers/deployments';
import * as constants from '../../../client/constants';

const initialState = {
  loading: false,
  error: null,
  records: [],
  activeRecord: null
};

describe('deployments reducer', () => {
  it('should return the initial state', () => {
    expect(
      deployments(undefined, {}).toJSON()
    ).toEqual(
      initialState
    );
  });

  it('should handle OPEN_DEPLOYMENT', () => {
    expect(
      deployments(initialState, {
        type: constants.OPEN_DEPLOYMENT,
        payload: {
          deployment: {
            id: 1, name: 'test'
          }
        }
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: null,
        records: [],
        activeRecord: {
          id: 1, name: 'test'
        }
      }
    );
  });

  it('should handle CLEAR_DEPLOYMENT', () => {
    expect(
      deployments(initialState, {
        type: constants.CLEAR_DEPLOYMENT
      }).toJSON()
    ).toEqual(
      initialState
    );
  });

  it('should handle FETCH_DEPLOYMENTS_PENDING', () => {
    expect(
      deployments(initialState, {
        type: constants.FETCH_DEPLOYMENTS_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        records: [],
        activeRecord: null
      }
    );
  });

  it('should handle FETCH_DEPLOYMENTS_REJECTED', () => {
    expect(
      deployments(initialState, {
        type: constants.FETCH_DEPLOYMENTS_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while loading the deployments: ERROR',
        records: [],
        activeRecord: null
      }
    );
  });

  it('should handle FETCH_DEPLOYMENTS_FULFILLED', () => {
    expect(
      deployments(initialState, {
        type: constants.FETCH_DEPLOYMENTS_FULFILLED,
        payload: {
          data: [
            {
              _id: '49559553682563810286559514516535449676088458549131214850',
              client_name: 'My App',
              connection: 'Username-Password-Authentication',
              date: '2016-09-26T13:03:36.005Z'
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
            _id: '49559553682563810286559514516535449676088458549131214850',
            client_name: 'My App',
            connection: 'Username-Password-Authentication',
            date: '2016-09-26T13:03:36.005Z',
            date_relative: moment('2016-09-26T13:03:36.005Z').fromNow()
          }
        ],
        activeRecord: null
      }
    );
  });

  it('should handle RUN_DEPLOYMENT_PENDING', () => {
    expect(
      deployments(initialState, {
        type: constants.RUN_DEPLOYMENT_PENDING
      }).toJSON()
    ).toEqual(
      {
        loading: true,
        error: null,
        records: [],
        activeRecord: null
      }
    );
  });

  it('should handle RUN_DEPLOYMENT_REJECTED', () => {
    expect(
      deployments(initialState, {
        type: constants.RUN_DEPLOYMENT_REJECTED,
        errorMessage: 'ERROR'
      }).toJSON()
    ).toEqual(
      {
        loading: false,
        error: 'An error occurred while running the deployment: ERROR',
        records: [],
        activeRecord: null
      }
    );
  });

  it('should handle RUN_DEPLOYMENT_FULFILLED', () => {
    expect(
      deployments(initialState, {
        type: constants.RUN_DEPLOYMENT_FULFILLED
      }).toJSON()
    ).toEqual(
      initialState
    );
  });
});
