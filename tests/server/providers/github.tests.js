import nock from 'nock';
import expect from 'expect';

import config from '../../../server/lib/config';
import { hasChanges, getChanges } from '../../../server/lib/providers/github';

const defaultConfig = {
  REPOSITORY: 'test/auth0',
  BRANCH: 'master',
  TOKEN: 'secret_token',
  BASE_DIR: 'tenant',
  HOST: 'test.gh',
  API_PATH: '/api'
};

const files = {
  clients: {
    'client.json': {
      name: 'client'
    }
  },
  grants: {
    'grant.json': {
      client_id: 'client',
      audience: 'sapi',
      scope: [ 'update:account' ]
    }
  },
  'resource-servers': {
    'sapi.json': {
      name: 'some-api',
      identifier: 'sapi',
      scopes: [
        { description: 'update account', value: 'update:account' }
      ]
    }
  },
  emails: {
    'provider.json': {
      name: 'smtp',
      enabled: true,
      credentials: {
        smtp_host: 'smtp.server.com',
        smtp_port: 25,
        smtp_user: 'smtp_user',
        smtp_pass: 'smtp_secret_password'
      }
    },
    'blocked_account.html': 'blocked email html',
    'blocked_account.json': {
      template: 'blocked_account',
      from: 'from',
      subject: 'subject',
      resultUrl: 'url',
      syntax: 'liquid',
      body: './blocked_account.html',
      urlLifetimeInSeconds: 432000,
      enabled: true
    }
  },
  'database-connections': {
    'settings.json': {
      enabled_clients: [ 'client' ]
    },
    'login.js': 'login function content'
  },
  'rules-configs': {
    'secret1.json': { value: 'first-secret' },
    'secret2.json': { value: 'second-secret' }
  },
  rules: {
    'rule1.js': 'rule1 script',
    'rule1.json': { order: 10, enabled: false },
    'rule2.js': 'rule2 script'
  },
  roles: {
    'role.json': {
      name: 'Test role',
      description: 'test',
      permissions: [
        {
          permission_name: 'update:account',
          resource_server_identifier: 'sapi'
        }
      ]
    }
  },
  pages: {
    'login.html': 'login page html'
  }
};

const generateTree = () => {
  const tree = [];
  const types = Object.keys(files);

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const items = Object.keys(files[type]);

    for (let j = 0; j < items.length; j++) {
      const name = items[j];

      const content = (name.endsWith('.json')) ? JSON.stringify(files[type][name]) : files[type][name];
      const sha = `${name}.sha`;
      const path = (type === 'database-connections')
        ? `tenant/${type}/test-db/${name}`
        : `tenant/${type}/${name}`;

      tree.push({ type: 'blob', path, sha });

      nock('https://test.gh')
        .get(`/api/repos/test/repo/git/blobs/${sha}`)
        .reply(200, { content: new Buffer(content) });
    }
  }

  return tree;
};

describe('github', () => {
  before((done) => {
    config.setProvider((key) => defaultConfig[key], null);
    return done();
  });

  describe('hasChanges', () => {
    it('should return true if something was added to the tenant config', (done) => {
      const commit = {
        added: [ 'tenant/rules/rule1.js' ]
      };

      expect(hasChanges([ commit ])).toEqual(true);
      done();
    });

    it('should return true if something was modified in the tenant config', (done) => {
      const commit = {
        modified: [ 'tenant/rules/rule1.js' ]
      };

      expect(hasChanges([ commit ])).toEqual(true);
      done();
    });

    it('should return true if something was removed from the tenant config', (done) => {
      const commit = {
        removed: [ 'tenant/rules/rule1.js' ]
      };

      expect(hasChanges([ commit ])).toEqual(true);
      done();
    });

    it('should return false if changes are unrelated to the tenant config', (done) => {
      const commit = {
        added: [ 'rules/rule1.js' ],
        modified: [ 'tenant/readme.md' ],
        removed: [ 'whatever.js', 'somedir/somefile.txt' ]
      };

      expect(hasChanges([ commit ])).toEqual(false);
      done();
    });

    it('should return true if there are at least one commit is relevant', (done) => {
      const commits = [
        { modified: [ 'tenant/readme.md' ] },
        { modified: [ 'tenant/rules/rule.js' ] }
      ];

      expect(hasChanges(commits)).toEqual(true);
      done();
    });
  });

  describe.only('getChanges', () => {
    it('should get and format files', (done) => {
      const repo = { tree: generateTree() };

      nock('https://test.gh')
        .get('/api/repos/test/repo/git/trees/sha?recursive=true&access_token=secret_token')
        .reply(200, repo);

      getChanges({ repository: 'test/repo', branch: 'branch', sha: 'sha' })
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
