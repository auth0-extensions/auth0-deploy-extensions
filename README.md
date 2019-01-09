# Auth0 Bitbucket Deployments

This extension makes it possible to deploy Rules and Database Connection scripts from Bitbucket to Auth0.

## Warning
Since v2.3, this extension is using new version of `auth0-source-control-extension-tools`, which is incompatible with node 4. The extension will work on node 8 runtime only. Please, read this [Migration Guide](https://auth0.com/docs/migrations/guides/extensibility-node8) for more information.

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
  resource-servers
    resource server 1.json
    some other resource server.json
  database-connections
    my-connection-name
      settings.json
      get_user.js
      login.js
  rules-configs
    some-config.json
    some-secret.json
  rules
    rule1.js
    rule1.json
    rule2.js
  pages
    login.html
    login.json
    password_reset.html
    password_reset.json
```

##### Clients
The name of the file is the name of the client that is created or updated.

In the .json file you can put the same json you would put when using the Management API for creating clients.  It will only try to keep the fields specified inline with what is configured already.  If a client doesn't exist yet, it will create it.

To specify client grants, you must specify the following in the metadata file.  (e.g. client1-name.meta.json)

```
{
  "grants": {
    "Resource server audience": [
      "scope1",
      "scope2"
    ]
  }
}
```

##### Resource servers
The name of the file is the name of the resource server that is created or updated.

In the .json file you can put the same json you would put when using the Management API for creating resource servers.  It will only try to keep the fields specified inline with what is configured already.  If a resource server doesn't exist yet, it will create it.

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

First create a `Client` in your account with `read:connections` and `read/create/update/delete:rules` access to the Auth0 Management API. Then create a `config.json` file under `./server/` containing the following settings:

```json
{
  "EXTENSION_SECRET": "any-random-value-will-do",
  "SLACK_INCOMING_WEBHOOK_URL": "https://hooks.slack.com/services/...",
  "BITBUCKET_BRANCH": "YOUR_BRANCH",
  "BITBUCKET_REPOSITORY": "YOUR_REPO",
  "BITBUCKET_USER": "",
  "BITBUCKET_PASSWORD": "",
  "AUTH0_DOMAIN": "YOUR_DOMAIN",
  "AUTH0_CLIENT_ID": "YOUR_CLIENT_ID",
  "AUTH0_CLIENT_SECRET": "YOUR_CLIENT_SECRET"
}
```

To run the extension locally:

```bash
npm install
npm run serve:dev
```

After that you need to use something like `ngrok` to expose the extension (Auth0 needs to reach out to the extension for authentication):

```bash
./ngrok http 3000
```

Finally you can login to the extension using your Auth0 dashboard account:

```
https://YOU.ngrok.io/login
```

### Deployment

```
npm run build
```
