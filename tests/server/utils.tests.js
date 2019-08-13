import expect from 'expect';

import config from '../../server/lib/config';
import utils from '../../server/lib/utils';
import assets from './mocks/repo-data-mock';

const defaultConfig = {
  ENABLE_CIPHER: 'true',
  CIPHER_PASSWORD: 'testpwd'
};

describe('unifyData', () => {
  before((done) => {
    config.setProvider((key) => defaultConfig[key], null);
    return done();
  });

  it('should unify full assets', (done) => {
    utils.unifyData(assets.full)
      .then((unified) => {
        expect(unified.rules).toBeAn('array');
        expect(unified.rules[0]).toBeAn('object');
        expect(unified.rules[0].script).toEqual('Rule script');
        expect(unified.rules[0].name).toEqual('Rule');
        expect(unified.rules[0].order).toEqual(0);
        expect(unified.rules[0].stage).toEqual('login_success');
        expect(unified.rules[0].enabled).toEqual(true);

        expect(unified.databases).toBeAn('array');
        expect(unified.databases[0]).toBeAn('object');
        expect(unified.databases[0].options).toBeAn('object');
        expect(unified.databases[0].strategy).toEqual('auth0');
        expect(unified.databases[0].name).toEqual('Database');
        expect(unified.databases[0].options.enabled_clients).toBeAn('array');
        expect(unified.databases[0].options.enabled_clients[0]).toEqual('whatever');
        expect(unified.databases[0].options.customScripts).toBeAn('object');
        expect(unified.databases[0].options.customScripts.login).toEqual('Database login script');
        expect(unified.databases[0].options.enabledDatabaseCustomization).toEqual(true);

        expect(unified.emailProvider.string).toEqual('Email Provider');

        expect(unified.emailTemplates[0].string).toEqual('Email Template Meta');
        expect(unified.emailTemplates[0].body).toEqual('Email Template Content');

        expect(unified.pages[0].name).toEqual('Page');
        expect(unified.pages[0].html).toEqual('Page Content');
        expect(unified.pages[0].enabled).toEqual(true);

        expect(unified.clients[0].name).toEqual('Client');
        expect(unified.clients[0].string).toEqual('Client Config');

        expect(unified.roles[0].name).toEqual('Role');
        expect(unified.roles[0].string).toEqual('Role Data');

        expect(unified.clientGrants[0].string).toEqual('Grant Config');

        expect(unified.connections[0].name).toEqual('Connection');
        expect(unified.connections[0].string).toEqual('Connection Config');

        expect(unified.rulesConfigs[0].key).toEqual('RuleConfig');
        expect(unified.rulesConfigs[0].value).toEqual('RuleConfig Data');

        expect(unified.resourceServers[0].name).toEqual('API');
        expect(unified.resourceServers[0].string).toEqual('API Config');

        done();
      });
  });

  it('should unify mapped assets', (done) => {
    utils.unifyData(assets.mapped, { MAP_ONE: 'first', MAP_TWO: 'second', ARR_MAP: [ 1, 2 ] })
      .then((unified) => {
        expect(unified.rules[0].script).toEqual('Rule script with first');
        expect(unified.rules[0].name).toEqual('Rule');

        expect(unified.databases[0].name).toEqual('Database');
        expect(unified.databases[0].options.customScripts.login).toEqual('Database login script with second');
        expect(unified.databases[0].options.enabledDatabaseCustomization).toEqual(true);

        expect(unified.clients[0].name).toEqual('Client');
        expect(unified.clients[0].string).toEqual('Client Config');
        expect(unified.clients[0].array).toEqual([ 1, 2 ]);

        expect(unified.rulesConfigs).toNotExist();
        expect(unified.emailProvider).toNotExist();
        expect(unified.emailTemplates).toNotExist();
        expect(unified.pages).toNotExist();
        expect(unified.roles).toNotExist();
        expect(unified.clientGrants).toNotExist();
        expect(unified.connections).toNotExist();
        expect(unified.resourceServers).toNotExist();

        done();
      });
  });

  it('should unify database without custom scripts', (done) => {
    utils.unifyData(assets.dbSettings)
      .then((unified) => {
        expect(unified.databases[0].name).toEqual('Database');
        expect(unified.databases[0].options.customScripts).toNotExist();
        expect(unified.databases[0].options.enabledDatabaseCustomization).toNotExist();
        expect(unified.databases[0].options.meta).toEqual('No scripts');

        expect(unified.rules).toNotExist();
        expect(unified.rulesConfigs).toNotExist();
        expect(unified.emailProvider).toNotExist();
        expect(unified.emailTemplates).toNotExist();
        expect(unified.pages).toNotExist();
        expect(unified.roles).toNotExist();
        expect(unified.clients).toNotExist();
        expect(unified.clientGrants).toNotExist();
        expect(unified.connections).toNotExist();
        expect(unified.resourceServers).toNotExist();

        done();
      });
  });

  it('should unify database and not include customScripts if customization is disabled', (done) => {
    utils.unifyData(assets.dbScriptsNoCustom)
      .then((unified) => {
        expect(unified.databases[0].name).toEqual('Database');
        expect(unified.databases[0].options.customScripts).toNotExist();
        expect(unified.databases[0].options.enabledDatabaseCustomization).toEqual(false);

        expect(unified.rules).toNotExist();
        expect(unified.rulesConfigs).toNotExist();
        expect(unified.emailProvider).toNotExist();
        expect(unified.emailTemplates).toNotExist();
        expect(unified.pages).toNotExist();
        expect(unified.roles).toNotExist();
        expect(unified.clients).toNotExist();
        expect(unified.clientGrants).toNotExist();
        expect(unified.connections).toNotExist();
        expect(unified.resourceServers).toNotExist();

        done();
      });
  });
});
