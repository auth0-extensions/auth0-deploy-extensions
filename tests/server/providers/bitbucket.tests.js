import nock from 'nock';
import expect from 'expect';

import config from '../../../server/lib/config';
import { getChanges } from '../../../server/lib/providers/bitbucket';
import files from '../mocks/repo-tree-mock';

const defaultConfig = {
  REPOSITORY: 'test/auth0',
  BRANCH: 'master',
  USER: 'user',
  PASSWORD: 'password',
  BASE_DIR: 'tenant'
};

const generateTree = () => {
  const types = Object.keys(files);

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const items = Object.keys(files[type]);
    const tree = [];

    for (let j = 0; j < items.length; j++) {
      const name = items[j];

      const content = (name.endsWith('.json')) ? JSON.stringify(files[type][name]) : files[type][name];
      const path = (type === 'database-connections')
        ? `tenant/${type}/test-db/${name}`
        : `tenant/${type}/${name}`;

      tree.push({ type: 'blob', path, name });

      nock('https://api.bitbucket.org')
        .get(`/2.0/repositories/test/auth0/src/sha/${path}`)
        .query(() => true)
        .reply(200, content);
    }

    if (type === 'database-connections') {
      nock('https://api.bitbucket.org')
        .get('/2.0/repositories/test/auth0/src/sha/tenant/database-connections')
        .query(() => true)
        .reply(200, { values: [ { type: 'commit_directory', path: 'tenant/database-connections/test-db' } ] });

      nock('https://api.bitbucket.org')
        .get('/2.0/repositories/test/auth0/src/sha/tenant/database-connections/test-db')
        .query(() => true)
        .reply(200, { values: tree });
    } else {
      nock('https://api.bitbucket.org')
        .get(`/2.0/repositories/test/auth0/src/sha/tenant/${type}`)
        .query(() => true)
        .reply(200, { values: tree });
    }
  }
};

describe('bitbucket', () => {
  before((done) => {
    config.setProvider((key) => defaultConfig[key], null);
    return done();
  });

  describe('getChanges', () => {
    it('should get and format files', (done) => {
      generateTree();

      nock('https://api.bitbucket.org')
        .get('/2.0/repositories/test/auth0')
        .reply(200);

      getChanges({ repository: 'test/auth0', branch: 'branch', sha: 'sha' })
        .then(results => {
          // rules
          expect(results.rules).toBeAn('array');
          expect(results.rules[0].name).toEqual('rule1');
          expect(results.rules[0].script).toEqual('rule1 script');
          expect(results.rules[0].stage).toEqual('login_success');
          expect(results.rules[0].enabled).toEqual(false);
          expect(results.rules[0].order).toEqual(10);
          expect(results.rules[1].name).toEqual('rule2');
          expect(results.rules[1].script).toEqual('rule2 script');
          expect(results.rules[1].stage).toEqual('login_success');
          expect(results.rules[1].order).toEqual(0);

          // databases
          expect(results.databases).toBeAn('array');
          expect(results.databases[0].name).toEqual('test-db');
          expect(results.databases[0].strategy).toEqual('auth0');
          expect(results.databases[0].enabled_clients).toEqual([ 'client' ]);
          expect(results.databases[0].options.enabledDatabaseCustomization).toEqual(true);
          expect(results.databases[0].options.customScripts.login).toEqual('login function content');

          // connections
          expect(results.connections).toBeAn('array');
          expect(results.connections[0].name).toEqual('connection');

          // emails
          expect(results.emailProvider).toBeAn('object');
          expect(results.emailTemplates).toBeAn('array');
          expect(results.emailProvider).toEqual(files.emails['provider.json']);
          expect(results.emailTemplates[0].template).toEqual('blocked_account');
          expect(results.emailTemplates[0].from).toEqual('from');
          expect(results.emailTemplates[0].subject).toEqual('subject');
          expect(results.emailTemplates[0].resultUrl).toEqual('url');
          expect(results.emailTemplates[0].syntax).toEqual('liquid');
          expect(results.emailTemplates[0].body).toEqual('blocked email html');
          expect(results.emailTemplates[0].urlLifetimeInSeconds).toEqual(432000);
          expect(results.emailTemplates[0].enabled).toEqual(true);

          // pages
          expect(results.pages).toBeAn('array');
          expect(results.pages[0].name).toEqual('login');
          expect(results.pages[0].html).toEqual('login page html');

          // roles
          expect(results.roles).toBeAn('array');
          expect(results.roles[0].name).toEqual('Test role');
          expect(results.roles[0].description).toEqual('test');
          expect(results.roles[0].permissions[0].permission_name).toEqual('update:account');
          expect(results.roles[0].permissions[0].resource_server_identifier).toEqual('sapi');

          // clients
          expect(results.clients).toBeAn('array');
          expect(results.clients[0].name).toEqual('client');

          // clientGrants
          expect(results.clientGrants).toBeAn('array');
          expect(results.clientGrants[0].client_id).toEqual('client');
          expect(results.clientGrants[0].audience).toEqual('sapi');
          expect(results.clientGrants[0].scope).toEqual([ 'update:account' ]);

          // rulesConfigs
          expect(results.rulesConfigs).toBeAn('array');
          expect(results.rulesConfigs[0].key).toEqual('secret1');
          expect(results.rulesConfigs[0].value).toEqual('first-secret');
          expect(results.rulesConfigs[1].key).toEqual('secret2');
          expect(results.rulesConfigs[1].value).toEqual('second-secret');

          // resourceServers
          expect(results.resourceServers).toBeAn('array');
          expect(results.resourceServers[0].name).toEqual('some-api');
          expect(results.resourceServers[0].identifier).toEqual('sapi');
          expect(results.resourceServers[0].scopes[0].value).toEqual('update:account');
          expect(results.resourceServers[0].scopes[0].description).toEqual('update account');

          done();
        })
        .catch(done);
    });
  });
});
