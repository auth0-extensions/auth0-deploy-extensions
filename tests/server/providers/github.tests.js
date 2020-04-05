import nock from 'nock';
import expect from 'expect';

import config from '../../../server/lib/config';
import { hasChanges, getChanges } from '../../../server/lib/providers/github';
import files from '../mocks/repo-tree-mock';
import expectedResults from '../mocks/expected-data';


const defaultConfig = {
  REPOSITORY: 'test/auth0',
  BRANCH: 'master',
  TOKEN: 'secret_token',
  BASE_DIR: 'tenant',
  BASE_URL: 'https://test.gh/api'
};

const generateTree = () => {
  const tree = [];
  const types = Object.keys(files);

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const items = Object.keys(files[type]);

    if (type === 'tenant.json') {
      const content = JSON.stringify(files[type]);
      const path = `tenant/${type}`;
      const sha = `${type}.sha`;

      tree.push({ type: 'blob', path, sha });

      nock('https://test.gh')
        .get(`/api/repos/test/repo/git/blobs/${sha}`)
        .reply(200, { content });
    } else {
      for (let j = 0; j < items.length; j++) {
        const name = items[j];
        const content = (name.endsWith('.json')) ? JSON.stringify(files[type][name]) : files[type][name];
        const sha = `${name}.sha`;
        const path = `tenant/${type}/${name}`;
        tree.push({ type: 'blob', path, sha });

        nock('https://test.gh')
          .get(`/api/repos/test/repo/git/blobs/${sha}`)
          .reply(200, { content });
      }
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

  describe('getChanges', () => {
    it.only('should get and format files', async () => {
      const repo = { tree: generateTree() };

      const scope = nock('https://test.gh', {
        reqheaders: {
          authorization: `token ${defaultConfig.TOKEN}`
        }
      })
        .get('/api/repos/test/repo/git/trees/sha?recursive=true')
        .reply(200, repo);

      const results = await getChanges({ repository: 'test/repo', branch: 'branch', sha: 'sha' });
      expect(results).toEqual(expectedResults);
      scope.done();
    });
  });
});
