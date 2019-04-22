module.exports = {
  full: {
    rules: [ {
      script: true,
      metadata: true,
      name: 'Rule',
      scriptFile: 'Rule script',
      metadataFile: '{ "enabled":true }'
    } ],
    databases: [ {
      name: 'Database',
      settings: '{ "options": { "enabled_clients": [ "whatever" ] } }',
      scripts: [ {
        name: 'login',
        scriptFile: 'Database login script'
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
  encoded: {
    rules: [ {
      script: true,
      metadata: false,
      name: 'Rule',
      scriptFile: 'Rule script with [!cipher]0af380a9782ab0765416e9521121146abe4b292560ae09ebb6efc108e2f31a1421b1d8be9b1a13-db22fc9248cb6709564b5ff76212ba2f8ccefeed791de678[rehpic!] text'
    } ],
    databases: [ {
      name: 'Database',
      scripts: [ {
        name: 'login',
        scriptFile: 'Database login script with some [!cipher]8ab12c0a32d38704bfead72c078fde104cf7cef9a3e030ff8d1df7e5c1389d170d4c158f9bcc-fe97e5f537d33c70763b6fa00f8b0e0386360ec06973d4fe[rehpic!]'
      } ]
    } ],
    emailTemplates: [],
    pages: [],
    clients: [],
    clientGrants: [],
    connections: [],
    rulesConfigs: [ {
      name: 'RuleConfig',
      configFile: '{ "value":"[!cipher]06ecaac4b16ba5d31687a445a58560284d1b2f38fa884581328f7676c06ef74fff792b61943596ca460613-8fc615e4d53fc3b2034b1b8877131c779d8245ca5491315e[rehpic!]" }'
    } ],
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
