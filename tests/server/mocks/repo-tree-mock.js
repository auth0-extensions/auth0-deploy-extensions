module.exports = {
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
  connections: {
    'connection.json': {
      name: 'connection'
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
