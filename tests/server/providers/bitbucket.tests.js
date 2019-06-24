import nock from 'nock';
import expect from 'expect';

import config from '../../../server/lib/config';
import { getChanges } from '../../../server/lib/providers/bitbucket';
import files from '../mocks/repo-tree-mock';
import expectedResults from '../mocks/expected-data';

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

    if (type === 'tenant.json') {
      const content = JSON.stringify(files[type]);
      const path = `tenant/${type}`;

      tree.push({ type: 'blob', path, name: 'tenant.json' });

      nock('https://api.bitbucket.org')
        .get('/2.0/repositories/test/auth0/src/sha/tenant/')
        .query(() => true)
        .reply(200, { values: tree });

      nock('https://api.bitbucket.org')
        .get(`/2.0/repositories/test/auth0/src/sha/${path}`)
        .query(() => true)
        .reply(200, content);
    }

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

describe.only('bitbucket', () => {
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
          expect(results).toEqual(expectedResults);

          done();
        })
        .catch(done);
    });
  });
});
