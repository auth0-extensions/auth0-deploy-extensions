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
  hooks: [
    {
      script: 'hook1 script',
      name: 'Hook-1',
      triggerId: 'client-credentials',
      enabled: true,
      secrets: {},
      dependencies: {}
    },
    {
      script: 'hook2 script',
      name: 'Hook-2',
      triggerId: 'post-user-registration',
      enabled: true,
      secrets: { TEST: 'test' },
      dependencies: { bcrypt: '1.0.0' }
    }
  ],
  databases: [
    {
      enabled_clients: [
        'client_A'
      ],
      options: {},
      strategy: 'auth0',
      name: 'db-connection-1'
    },
    {
      enabled_clients: [
        'client_A'
      ],
      options: {
        customScripts: {
          login: 'login function content'
        },
        enabledDatabaseCustomization: true
      },
      strategy: 'auth0',
      name: 'db-connection-2'
    },
    {
      enabled_clients: [
        'client_B'
      ],
      options: {
        customScripts: {
          login: 'login function content'
        },
        enabledDatabaseCustomization: true
      },
      strategy: 'auth0',
      name: 'db-connection-3'
    },
    {
      options: {
        customScripts: {
          get_user: 'get_user function content'
        },
        enabledDatabaseCustomization: true
      },
      strategy: 'auth0',
      name: 'db-connection-4'
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
  guardianFactors: [
    {
      name: 'sms',
      enabled: true
    },
    {
      name: 'email',
      enabled: false
    }
  ],
  guardianFactorProviders: [
    {
      name: 'sms',
      provider: 'twilio',
      auth_token: 'test_twilio_authtoken',
      sid: 'test_twilio_sid',
      from: '0800-TEST-NUMBER',
      messaging_service_sid: 'test_copilot_sid'
    }
  ],
  guardianFactorTemplates: [
    {
      name: 'sms',
      enrollment_message: 'test enroll {{ code }}',
      verification_message: 'test verification {{ code }}'
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
