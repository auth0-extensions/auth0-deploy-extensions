import nock from 'nock';
import expect from 'expect';

import config from '../../server/lib/config';
import report from '../../server/lib/reporter';

const defaultConfig = {
  WT_URL: 'https://wt.example.com',
  SLACK_INCOMING_WEBHOOK_URL: 'https://slack.example.com',
  REPORT_WEBHOOK: 'https://hook.example.com'
};

const storage = {
  data: {
    someData: true
  },
  read: () => Promise.resolve(storage.data),
  write: (data) => {
    storage.data = data;
    return Promise.resolve();
  }
};

const repo = {
  id: 'id',
  sha: 'sha',
  user: 'user',
  branch: 'branch',
  repository: 'repository'
};

const progress = {
  rules: {
    created: 1,
    updated: 2,
    deleted: 0
  },
  pages: {
    created: 0,
    updated: 0,
    deleted: 0
  }
};

const checkData = (result, isError, done) => {
  const { slack, hook, data } = result;

  if (slack) {
    expect(slack).toBeAn('object');
    expect(slack.username).toEqual('auth0-deployments');
    expect(slack.attachments).toBeAn('array');
    expect(slack.attachments[0]).toBeAn('object');
    expect(slack.attachments[0].fields).toBeAn('array');
    expect(slack.attachments[0].fields[0].title).toEqual('Repository');
    expect(slack.attachments[0].fields[0].value).toEqual('repository');

    if (isError) {
      expect(slack.attachments[0].fallback).toEqual('Bitbucket to Auth0 Deployment failed: Testing error');
      expect(slack.attachments[0].text).toEqual('Bitbucket to Auth0 Deployment failed: (<https://wt.example.com/login|Details>)');
      expect(slack.attachments[0].fields.length).toEqual(5);
      expect(slack.attachments[0].fields[4].title).toEqual('Error');
      expect(slack.attachments[0].fields[4].value).toEqual('Testing error');
    } else {
      expect(slack.attachments[0].fallback).toEqual('Bitbucket to Auth0 Deployment');
      expect(slack.attachments[0].text).toEqual('Bitbucket to Auth0 Deployment (<https://wt.example.com/login|Details>)');
      expect(slack.attachments[0].fields.length).toEqual(6);
      expect(slack.attachments[0].fields[5].title).toEqual('rules updated');
      expect(slack.attachments[0].fields[5].value).toEqual(2);
    }
  }

  if (hook) {
    expect(hook).toBeAn('object');
    expect(hook.id).toEqual('id');
    expect(hook.sha).toEqual('sha');
    expect(hook.user).toEqual('user');
    expect(hook.branch).toEqual('branch');
    expect(hook.repository).toEqual('repository');

    if (isError) {
      expect(hook.logs).toNotExist();
      expect(hook.error).toEqual('Testing error');
    } else {
      expect(hook.logs).toBeAn('object');
      expect(hook.logs.pages).toNotExist();
      expect(hook.logs.rules).toBeAn('object');
      expect(hook.logs.rules.created).toEqual(1);
      expect(hook.logs.rules.updated).toEqual(2);
      expect(hook.logs.rules.deleted).toEqual(0);
    }
  }

  if (data) {
    expect(data).toBeAn('object');
    expect(data.someData).toEqual(true);
    expect(data.deployments).toBeAn('array');
    expect(data.deployments.length).toEqual(1);
    expect(data.deployments[0]).toBeAn('object');
    expect(data.deployments[0].id).toEqual('id');
    expect(data.deployments[0].sha).toEqual('sha');
    expect(data.deployments[0].user).toEqual('user');
    expect(data.deployments[0].branch).toEqual('branch');
    expect(data.deployments[0].repository).toEqual('repository');
    expect(data.deployments[0].warnings.length).toEqual(0);

    if (isError) {
      expect(data.deployments[0].logs).toNotExist();
      expect(data.deployments[0].error).toEqual('Testing error');
    } else {
      expect(data.deployments[0].logs).toBeAn('object');
      expect(data.deployments[0].logs.pages).toNotExist();
      expect(data.deployments[0].logs.rules).toBeAn('object');
      expect(data.deployments[0].logs.rules.created).toEqual(1);
      expect(data.deployments[0].logs.rules.updated).toEqual(2);
      expect(data.deployments[0].logs.rules.deleted).toEqual(0);
    }
  }

  return done();
};
describe('reporter', () => {
  before((done) => {
    config.setProvider((key) => defaultConfig[key], null);
    return done();
  });

  beforeEach((done) => {
    storage.data = { someData: true };
    return done();
  });

  it('should send data to the hooks and save it to the storage', (done) => {
    const result = {};

    nock('https://slack.example.com')
      .post('/', (body) => {
        result.slack = body;
        return true;
      })
      .reply(200);

    nock('https://hook.example.com')
      .post('/', (body) => {
        result.hook = body;
        return true;
      })
      .reply(200);

    report(storage, { repo, progress })
      .then(() => {
        result.data = storage.data;
        checkData(result, false, done);
      });
  });

  it('should add warnings if unable to send data to the hooks', (done) => {
    report(storage, { repo, progress })
      .then(() => {
        expect(storage.data.someData).toEqual(true);
        expect(storage.data.deployments).toBeAn('array');
        expect(storage.data.deployments.length).toEqual(1);
        expect(storage.data.deployments[0].warnings.length).toEqual(2);
        expect(storage.data.deployments[0].warnings[0].title).toEqual('Error sending report to Slack');
        expect(storage.data.deployments[0].warnings[1].title).toEqual('Error sending report to https://hook.example.com');

        return done();
      });
  });
  it('should send error report to the hooks and save it to the storage', (done) => {
    const result = {};

    nock('https://slack.example.com')
      .post('/', (body) => {
        result.slack = body;
        return true;
      })
      .reply(200);

    nock('https://hook.example.com')
      .post('/', (body) => {
        result.hook = body;
        return true;
      })
      .reply(200);

    report(storage, { repo, error: 'Testing error' })
      .then(() => {
        result.data = storage.data;
        checkData(result, true, done);
      });
  });
  it('should keep only 20 records in the storage', (done) => {
    storage.data.deployments = [];

    for (let i = 0; i < 30; i++) {
      storage.data.deployments.push({ id: i });
    }

    report(storage, { repo, error: 'Testing error' })
      .then(() => {
        expect(storage.data.someData).toEqual(true);
        expect(storage.data.deployments).toBeAn('array');
        expect(storage.data.deployments.length).toEqual(20);
        expect(storage.data.deployments[19].id).toEqual('id');
        expect(storage.data.deployments[0].id).toEqual(11);

        return done();
      });
  });
});
