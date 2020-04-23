import { version as packageVersion } from '../../../package.json';
import expect from 'expect';

const managementApiClient = require('auth0-extension-express-tools').middlewares.managementApiClient;

describe('ManagementApi middleware', () => {
  let request = { user: { access_token: 'user_access_token' } };

  function wrapperFunction(i, callback) {
    return function() {
      return callback(i);
    };
  }

  it('should set header properly', () => {
    const response = {};
    managementApiClient({
      domain: 'test-domain',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      headers: {
        'User-agent': `${process.env.A0EXT_PROVIDER}-deploy-ext/${packageVersion} (node.js/${process.version.replace('v', '')})`
      }
    })(request, response, wrapperFunction(request, function(i) {
      const keys = Object.keys(i.auth0);
      keys.forEach(key => {
        if (i.auth0[key].resource) {
          expect(i.auth0[key].resource.restClient.options.headers['User-agent']).toEqual(`${process.env.A0EXT_PROVIDER}-deploy-ext/${packageVersion} (node.js/${process.version.replace('v', '')})`);
        }
      });
    }));
  });
});
