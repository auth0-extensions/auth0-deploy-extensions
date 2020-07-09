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
  'database-connections/db-connection-1': {
    'database.json': {
      enabled_clients: [ 'client_A' ]
    },
    'settings.json': {
      enabled_clients: [ 'client_B' ]
    }
  },
  'database-connections/db-connection-2': {
    'database.json': {
      enabled_clients: [ 'client_A' ]
    },
    'login.js': 'login function content'
  },
  'database-connections/db-connection-3': {
    'settings.json': {
      enabled_clients: [ 'client_B' ]
    },
    'login.js': 'login function content'
  },
  'database-connections/db-connection-4': {
    'get_user.js': 'get_user function content'
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
  hooks: {
    'hook1.js': 'hook1 script',
    'hook1.json': { name: 'Hook-1', triggerId: 'client-credentials', enabled: true },
    'hook2.js': 'hook2 script',
    'hook2.json': { name: 'Hook-2', triggerId: 'post-user-registration', enabled: true, secrets: { TEST: 'test' }, dependencies: { bcrypt: '1.0.0' } }
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
  },
  guardian: {
    'phoneFactorMessageTypes.json': {
      message_types: [ 'sms', 'voice' ]
    },
    'phoneFactorSelectedProvider.json': {
      provider: 'twilio'
    },
    'policies.json': {
      policies: [ 'all-applications' ]
    }
  },
  'guardian/factors': {
    'sms.json': {
      name: 'sms',
      enabled: true
    },
    'email.json': {
      name: 'email',
      enabled: false
    }
  },
  'guardian/providers': {
    'sms-twilio.json': {
      name: 'sms',
      provider: 'twilio',
      auth_token: 'test_twilio_authtoken',
      sid: 'test_twilio_sid',
      from: '0800-TEST-NUMBER',
      messaging_service_sid: 'test_copilot_sid'
    }
  },
  'guardian/templates': {
    'sms.json': {
      name: 'sms',
      enrollment_message: 'test enroll {{ code }}',
      verification_message: 'test verification {{ code }}'
    }
  },
  'tenant.json': {
    friendly_name: 'My Company',
    support_email: 'support@company.com',
    session_lifetime: 1.23,
    default_directory: 'users',
    sandbox_version: '4',
    idle_session_lifetime: 72
  }
};
