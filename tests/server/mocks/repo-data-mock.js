module.exports = {
  full: {
    rules: [ {
      script: true,
      metadata: true,
      name: 'Rule',
      scriptFile: 'Rule script',
      metadataFile: '{ "enabled":true }'
    } ],
    hooks: [ {
      script: true,
      metadata: true,
      name: 'test-script-111',
      scriptFile: 'Hook script',
      metadataFile: '{ "name": "Hook", "triggerId": "client-credentials" }'
    } ],
    databases: [ {
      name: 'Database',
      settings: '{ "options": { "enabled_clients": [ "whatever" ] } }',
      scripts: [ {
        name: 'login',
        scriptFile: 'Database login script'
      } ]
    }, {
      name: 'Database 2 with only scripts',
      scripts: [ {
        name: 'get_user',
        scriptFile: 'Database 2 get_user script'
      } ]
    } ],
    emailProvider: {
      name: 'emailProvider',
      configFile: '{ "string":"Email Provider" }'
    },
    emailTemplates: [ {
      name: 'ETemplate',
      htmlFile: 'Email Template Content',
      metadata: true,
      metadataFile: '{ "string":"Email Template Meta" }'
    } ],
    pages: [ {
      name: 'Page',
      htmlFile: 'Page Content',
      metadata: true,
      metadataFile: '{ "enabled":true }'
    } ],
    roles: [ {
      name: 'Role',
      configFile: '{ "name": "Role", "string":"Role Data" }'
    } ],
    clients: [ {
      name: 'Client',
      configFile: '{ "string":"Client Config" }'
    } ],
    clientGrants: [ {
      name: 'Grant',
      configFile: '{ "string":"Grant Config" }'
    } ],
    connections: [ {
      name: 'Connection',
      configFile: '{ "string":"Connection Config" }'
    } ],
    rulesConfigs: [ {
      name: 'RuleConfig',
      configFile: '{ "value":"RuleConfig Data" }'
    } ],
    resourceServers: [ {
      name: 'API',
      configFile: '{ "string":"API Config" }'
    } ]
  },
  mapped: {
    rules: [ {
      script: true,
      metadata: false,
      name: 'Rule',
      scriptFile: 'Rule script with ##MAP_ONE##'
    } ],
    databases: [ {
      name: 'Database',
      scripts: [ {
        name: 'login',
        scriptFile: 'Database login script with ##MAP_TWO##'
      } ]
    } ],
    emailTemplates: [],
    pages: [],
    clients: [
      {
        name: 'ClientOne',
        configFile: '{ "string":"Client One Config", "array": @@ARR_MAP@@ }'
      },
      {
        name: 'ClientTwo',
        configFile: '{ "string":"Client Two Config", "array": [ ##ONE##, "##TWO##" ] }'
      },
      {
        name: 'ClientThree',
        configFile: { string: 'Client ##THREE## Config', array: [] }
      }
    ],
    clientGrants: [],
    connections: [],
    rulesConfigs: [],
    resourceServers: []
  },
  dbSettings: {
    rules: [],
    databases: [ {
      name: 'Database',
      settings: '{ "options": { "meta": "No scripts" } }',
      scripts: []
    } ],
    emailTemplates: [],
    pages: [],
    clients: [],
    clientGrants: [],
    connections: [],
    rulesConfigs: [],
    resourceServers: []
  },
  dbScriptsNoCustom: {
    rules: [],
    databases: [ {
      name: 'Database',
      settings: '{ "options": { "enabledDatabaseCustomization": false } }',
      scripts: [ {
        name: 'login',
        scriptFile: 'Database login script'
      } ]
    } ],
    emailTemplates: [],
    pages: [],
    clients: [],
    clientGrants: [],
    connections: [],
    rulesConfigs: [],
    resourceServers: []
  }
};
