import nock from 'nock';
import expect from 'expect';

import config from '../../../server/lib/config';
import { hasChanges, getChanges } from '../../../server/lib/providers/gitlab';
import files from '../mocks/repo-tree-mock';
import expectedResults from '../mocks/expected-data';

const defaultConfig = {
  REPOSITORY: 'test/auth0',
  BRANCH: 'master',
  TOKEN: 'secret_token',
  BASE_DIR: 'tenant',
  URL: 'https://test.gl'
};

const generateTree = () => {
  const types = Object.keys(files);
  const dbTypes = types.filter(type => type.startsWith('database-connections'));

  const dbTree = [];
  for (let i = 0; i < dbTypes.length; i++) {
    const path = dbTypes[i];
    const name = path.split('/').slice(-1)[0];
    dbTree.push({ type: 'tree', path, name });
  }
  nock('https://test.gl')
    .get(
      '/api/v4/projects/projectId/repository/tree?ref=branch&path=tenant%2Fdatabase-connections'
    )
    .reply(200, dbTree);

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const items = Object.keys(files[type]);
    const tree = [];

    if (type === 'tenant.json') {
      const content = JSON.stringify(files[type]);
      const path = `tenant/${type}`;

      tree.push({ type: 'blob', path, name: 'tenant.json' });

      nock('https://test.gl')
        .get(`/api/v4/projects/projectId/repository/files/${path.replace(RegExp('/', 'g'), '%2F')}`)
        .query(() => true)
        .reply(200, { content: new Buffer(content) });

      nock('https://test.gl')
        .get('/api/v4/projects/projectId/repository/tree?ref=branch&path=tenant%2F')
        .reply(200, tree);
    } else {
      for (let j = 0; j < items.length; j++) {
        const name = items[j];

        const content = (name.endsWith('.json')) ? JSON.stringify(files[type][name]) : files[type][name];
        const path = `tenant/${type}/${name}`;

        tree.push({ type: 'blob', path, name });

        nock('https://test.gl')
          .get(`/api/v4/projects/projectId/repository/files/${path.replace(RegExp('/', 'g'), '%2F')}`)
          .query(() => true)
          .reply(200, { content: new Buffer(content) });
      }
      nock('https://test.gl')
      .get(`/api/v4/projects/projectId/repository/tree?ref=branch&path=tenant%2F${type.replace(RegExp('/', 'g'), '%2F')}`)
      .reply(200, tree);
    }
  }
};

describe('gitlab', () => {
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

  describe('getChanges', () => {
    it('should get and format files', (done) => {
      generateTree();

      getChanges({ projectId: 'projectId', branch: 'branch' })
        .then(results => {
          expect(results).toEqual(expectedResults);

          done();
        })
        .catch(done);
    });
  });
});
