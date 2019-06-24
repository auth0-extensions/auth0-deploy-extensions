module.exports = {
  rules: [
    {
      script: 'rule1 script',
      name: 'rule1',
      order: 10,
      stage: 'login_success',
      enabled: false
    },
    {
      enabled: undefined,
      script: 'rule2 script',
      name: 'rule2',
      order: 0,
      stage: 'login_success'
    }
  ],
  databases: [
    {
      enabled_clients: [
        'client'
      ],
      options: {
        customScripts: {
          login: 'login function content'
        },
        enabledDatabaseCustomization: true
      },
      strategy: 'auth0',
      name: 'test-db'
    }
  ],
  emailProvider: {
    name: 'smtp',
    enabled: true,
    credentials: {
      smtp_host: 'smtp.server.com',
      smtp_port: 25,
      smtp_user: 'smtp_user',
      smtp_pass: 'smtp_secret_password'
    }
  },
  emailTemplates: [
    {
      template: 'blocked_account',
      from: 'from',
      subject: 'subject',
      resultUrl: 'url',
      syntax: 'liquid',
      body: 'blocked email html',
      urlLifetimeInSeconds: 432000,
      enabled: true
    }
  ],
  pages: [
    {
      enabled: undefined,
      html: 'login page html',
      name: 'login'
    }
  ],
  roles: [
    {
      name: 'Test role',
      description: 'test',
      permissions: [
        {
          permission_name: 'update:account',
          resource_server_identifier: 'sapi'
        }
      ]
    }
  ],
  clients: [
    {
      name: 'client'
    }
  ],
  clientGrants: [
    {
      client_id: 'client',
      audience: 'sapi',
      scope: [
        'update:account'
      ]
    }
  ],
  connections: [
    {
      name: 'connection'
    }
  ],
  rulesConfigs: [
    {
      key: 'secret1',
      value: 'first-secret'
    },
    {
      key: 'secret2',
      value: 'second-secret'
    }
  ],
  resourceServers: [
    {
      name: 'some-api',
      identifier: 'sapi',
      scopes: [
        {
          description: 'update account',
          value: 'update:account'
        }
      ]
    }
  ],
  tenant: {
    friendly_name: 'My Company',
    support_email: 'support@company.com',
    session_lifetime_in_minutes: 74,
    default_directory: 'users',
    sandbox_version: '4',
    idle_session_lifetime: 72
  }
};
