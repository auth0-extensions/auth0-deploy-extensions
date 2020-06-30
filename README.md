# Auth0 Deploy Extensions

These extensions makes it possible to deploy Rules and Database Connection scripts from Bitbucket, Github, Gitlab or VisualStudio to Auth0.

## Usage

There is more extensive documentation online for how the files are expected to be laid out to work with the source control configuration utilities [here](https://auth0.com/docs/extensions/bitbucket-deploy).

#### Organize your repository

Here is a simple overview:

```
repository =>
  clients
    client1-name.json
    client1-name.meta.json # if specifying client grants
    my-other-client-name.json
  grants
    client1-api.json
  resource-servers
    resource server 1.json
    some other resource server.json
  database-connections
    my-connection-name
      database.json
      get_user.js
      login.js
  rules-configs
    some-config.json
    some-secret.json
  rules
    rule1.js
    rule1.json
    rule2.js
  roles
      role1.json
      role2.json
  pages
    login.html
    login.json
    password_reset.html
    password_reset.json
```

##### Roles

In the .json file you can specify roles options, the name of the file does not matter. Example:

```
{
  "name": "Role name",
  "description": "Role description",
  "permissions": [
    {
      "permission_name": "read:something",
      "resource_server_identifier": "api-identifier"
    }
  ]
}
```

##### Clients

The name of the file is the name of the client that is created or updated.

In the .json file you can put the same json you would put when using the Management API for creating clients. It will only try to keep the fields specified inline with what is configured already. If a client doesn't exist yet, it will create it.

##### Clients Grants

In the .json file you can specify client grants options, the name of the file does not matter. Example:

```
{
  "client_id": "client1",
  "audience": "https://myapp.example.com/api/v1",
  "scope": [
    "update:account"
  ]
}
```

##### Resource servers

The name of the file is the name of the resource server that is created or updated.

In the .json file you can put the same json you would put when using the Management API for creating resource servers. It will only try to keep the fields specified inline with what is configured already. If a resource server doesn't exist yet, it will create it.

##### Database Connections

See Database Connection configuration [here](https://auth0.com/docs/extensions/bitbucket-deploy#deploy-database-connection-scripts)

##### Rules Configs

In the .json file you can define value for rule-config, while filename is a key:

```
{
  "value": "some-secret-value"
}
```

##### Rules

See Rules configuration [here](https://auth0.com/docs/extensions/bitbucket-deploy#deploy-rules)

NOTE: There is not currently a way to mark rules as manual yet, that will become part of the configuration file in the future.

##### Custom Pages

See Custom Pages configuration [here](https://auth0.com/docs/extensions/bitbucket-deploy#deploy-hosted-pages)

## Running

### Local Development

First create a machine-machine `Application` in your tenant all scopes selected for the Auth0 Management API. Then create a `config.json` file under `./server/` containing the following settings:

```json
{
  "EXTENSION_SECRET": "any-random-value-will-do",
  "SLACK_INCOMING_WEBHOOK_URL": "https://hooks.slack.com/services/...",
  "REPOSITORY": "YOUR_REPO",
  "BRANCH": "YOUR_BRANCH",
  "USER": "BITBUCKET_USER",
  "PASSWORD": "BITBUCKET_PASSWORD",
  "TOKEN": "GITHUB_OR_GITLAB_TOKEN",
  "AUTH0_DOMAIN": "YOUR_DOMAIN",
  "AUTH0_CLIENT_ID": "YOUR_CLIENT_ID",
  "AUTH0_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
  "AUTH0_SCOPES": "read:client_grants create:client_grants delete:client_grants update:client_grants read:clients update:clients delete:clients create:clients read:client_keys update:client_keys delete:client_keys create:client_keys read:connections update:connections delete:connections create:connections read:resource_servers update:resource_servers delete:resource_servers create:resource_servers read:rules update:rules delete:rules create:rules read:rules_configs update:rules_configs delete:rules_configs read:email_provider update:email_provider delete:email_provider create:email_provider read:tenant_settings update:tenant_settings read:grants delete:grants read:guardian_factors update:guardian_factors read:email_templates create:email_templates update:email_templates read:roles update:roles delete:roles create:roles read:hooks update:hooks delete:hooks create:hooks"
}
```

Build the repo at least once:
```bash
npm run build
```

To run the extension locally:

```bash
npm install
A0EXT_PROVIDER=github npm run serve:dev
```

Replace github with `bitbucket`, `gitlab` or `visualstudio`.

The command will spin up a development server for this repo, and will also setup an `ngrok` tunnel to expose the extension (Auth0 needs to reach out to the extension for authentication).

The command will open your browser and navigate to the extension and should ask you to login using your Auth0 dashboard account:

```
https://YOU.ngrok.io/login
```

### Deployment

Deployment artifacts are automatically generated when a git tag (or a github release) is created with the `v*` format. These artifacts are stored on the circle build job. These can then be downloaded and uploaded via the Extensions Deployer Tool.

Since this is a monorepo, there are now 2 parts, the UI and the webtasks. The UI is shared by each individual webtask and is deployed seperately and manually.

```
npm run build
```

The output will be in the `/dist` directory. The root will contain the UI files and each extension will have its own directory. If updating an extension without a change on the client, use the deploy tool to deploy only the bundle (no need to upload the client files).

If the client has been updated, the version number needs to be updated here: https://github.com/auth0-extensions/auth0-deploy-extensions/blob/master/package.json#L78
