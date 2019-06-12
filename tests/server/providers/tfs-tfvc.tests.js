import sinon from 'sinon';
import expect from 'expect';
import * as vso from 'vso-node-api';
import nock from 'nock';

import config from '../../../server/lib/config';
import { hasChanges, getChanges } from '../../../server/lib/providers/tfs-tfvc';
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

const generateTreeByDir = (dir) => {
  const tree = [];
  let type = dir.split('/').pop();

  if (type === 'database-connections') {
    tree.push({ isFolder: true, path: 'tenant/database-connections/test-db' });
    return tree;
  }

  if (type === 'test-db') {
    type = 'database-connections';
  }

  const items = Object.keys(files[type]);

  for (let j = 0; j < items.length; j++) {
    const name = items[j];

    const content = (name.endsWith('.json')) ? JSON.stringify(files[type][name]) : files[type][name];
    const path = (type === 'database-connections')
      ? `tenant/${type}/test-db/${name}`
      : `tenant/${type}/${name}`;

    nock('https://test-instance.visualstudio.com')
      .get(`/defaultCollection/_apis/tfvc/items?path=${path}&api-version=5.0&includeContent=true`)
      .reply(200, { content });

    tree.push({ path, size: 1 });
  }

  return tree;
};

const tfvcApi = {};

const stubs = [];

describe('tfs-tfvc', () => {
  before((done) => {
    config.setProvider((key) => defaultConfig[key], null);

    stubs.push(sinon.stub(vso, 'getPersonalAccessTokenHandler').callsFake((token) => {
      expect(token).toEqual(defaultConfig.TOKEN);
      return 'credentials';
    }));

    stubs.push(sinon.stub(vso, 'WebApi').callsFake(function(url, creds) {
      expect(url).toEqual(`https://${defaultConfig.INSTANCE}.visualstudio.com/${defaultConfig.COLLECTION}`);
      expect(creds).toEqual('credentials');

      this.getTfvcApi = () => tfvcApi;
      return this;
    }));

    return done();
  });

  describe('hasChanges', () => {
    it('should return true if something has been changed', (done) => {
      const data = [ { item: { path: 'tenant/rules/rule1.js' } } ];

      tfvcApi.getChangesetChanges = () => Promise.resolve(data);

      hasChanges('commit', 'repo')
        .then((result) => {
          expect(result).toEqual(true);
          done();
        })
        .catch(done);
    });

    it('should return false if changes are irrelevant', (done) => {
      const data = [ { item: { path: 'tenant/readme.md' } } ];

      tfvcApi.getChangesetChanges = () => Promise.resolve(data);

      hasChanges('commit', 'repo')
        .then((result) => {
          expect(result).toEqual(false);
          done();
        })
        .catch(done);
    });

    it('should return true if some of changes are relevant', (done) => {
      const data = [
        { item: { path: 'tenant/readme.md' } },
        { item: { path: 'package.json' } },
        { item: { path: 'tenant/rules/rule1.js' } }
      ];

      tfvcApi.getChangesetChanges = () => Promise.resolve(data);

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
      tfvcApi.getItems = (project, dir) => Promise.resolve(generateTreeByDir(dir));

      getChanges({ project: 'project', changesetId: 'branch' })
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
