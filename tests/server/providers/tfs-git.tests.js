import sinon from 'sinon';
import expect from 'expect';
import * as vso from 'vso-node-api';

import config from '../../../server/lib/config';
import { hasChanges, getChanges } from '../../../server/lib/providers/tfs-git';
import files from '../mocks/repo-tree-mock';
import expectedResults from '../mocks/expected-data';


const defaultConfig = {
  INSTANCE: 'test-instance',
  COLLECTION: 'defaultCollection',
  REPOSITORY: 'test/auth0',
  BRANCH: 'master',
  AUTH_METHOD: 'pat',
  TOKEN: 'secret_token',
  BASE_DIR: 'tenant'
};

const contentsById = {};

const generateTree = () => {
  const tree = [];
  const types = Object.keys(files);

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const items = Object.keys(files[type]);

    if (type === 'tenant.json') {
      const content = JSON.stringify(files[type]);
      const sha = `${type}.sha`;
      const path = `tenant/${type}`;

      contentsById[sha] = { on: (event, cb) => cb(content) };

      tree.push({ gitObjectType: 3, relativePath: path, objectId: sha });
    } else {
      for (let j = 0; j < items.length; j++) {
        const name = items[j];

        const content = (name.endsWith('.json')) ? JSON.stringify(files[type][name]) : files[type][name];
        const sha = `${name}.sha`;
        const path = (type === 'database-connections')
          ? `tenant/${type}/test-db/${name}`
          : `tenant/${type}/${name}`;

        contentsById[sha] = { on: (event, cb) => cb(content) };

        tree.push({ gitObjectType: 3, relativePath: path, objectId: sha });
      }
    }
  }

  return tree;
};

const gitApi = {};

const stubs = [];

describe('tfs-git', () => {
  before((done) => {
    config.setProvider((key) => defaultConfig[key], null);

    stubs.push(sinon.stub(vso, 'getPersonalAccessTokenHandler').callsFake((token) => {
      expect(token).toEqual(defaultConfig.TOKEN);
      return 'credentials';
    }));

    stubs.push(sinon.stub(vso, 'WebApi').callsFake(function(url, creds) {
      expect(url).toEqual(`https://${defaultConfig.INSTANCE}.visualstudio.com/${defaultConfig.COLLECTION}`);
      expect(creds).toEqual('credentials');

      this.getGitApi = () => gitApi;
      return this;
    }));

    return done();
  });

  describe('hasChanges', () => {
    it('should return true if something has been changed', (done) => {
      const data = {
        changes: [ { item: { path: '/tenant/rules/rule1.js' } } ]
      };

      gitApi.getChanges = () => Promise.resolve(data);

      hasChanges('commit', 'repo')
        .then((result) => {
          expect(result).toEqual(true);
          done();
        })
        .catch(done);
    });

    it('should return false if changes are irrelevant', (done) => {
      const data = {
        changes: [ { item: { path: '/tenant/readme.md' } } ]
      };

      gitApi.getChanges = () => Promise.resolve(data);

      hasChanges('commit', 'repo')
        .then((result) => {
          expect(result).toEqual(false);
          done();
        })
        .catch(done);
    });

    it('should return true if some of changes are relevant', (done) => {
      const data = {
        changes: [
          { item: { path: '/tenant/readme.md' } },
          { item: { path: '/package.json' } },
          { item: { path: '/tenant/rules/rule1.js' } }
        ]
      };

      gitApi.getChanges = () => Promise.resolve(data);

      hasChanges('commit', 'repo')
        .then((result) => {
          expect(result).toEqual(true);
          done();
        })
        .catch(done);
    });
  });

  describe('getChanges', () => {
    it('should get and format files', (done) => {
      gitApi.getBranch = () => Promise.resolve({ commit: { commitId: 'commit-id' } });
      gitApi.getCommit = () => Promise.resolve({ treeId: 'tree-id' });
      gitApi.getTree = () => Promise.resolve({ treeEntries: generateTree() });
      gitApi.getBlobContent = (repo, fileId) => Promise.resolve(contentsById[fileId]);

      getChanges({ repositoryId: 'repo', branch: 'branch' })
        .then(results => {
          expect(results).toEqual(expectedResults);

          done();
        })
        .catch(done);
    });
  });

  after((done) => {
    stubs.forEach(stub => stub.restore());
    done();
  });
});
