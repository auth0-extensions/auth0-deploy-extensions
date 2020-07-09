import express from 'express';
import { middlewares } from 'auth0-extension-express-tools';

import excludes from './excludes';
import mappings from './mappings';
import deploy from '../lib/deploy';
import config from '../lib/config';
import multiPartRequest from '../lib/multipartRequest';
import { version as packageVersion } from '../../package.json';

const { getOptions } = require(`../lib/providers/${process.env.A0EXT_PROVIDER}`);

export default (storage) => {
  const api = express.Router(); // eslint-disable-line new-cap
  api.use(middlewares.authenticateAdmins({
    credentialsRequired: true,
    secret: config('EXTENSION_SECRET'),
    audience: `urn:${process.env.A0EXT_PROVIDER}-deploy`,
    baseUrl: config('PUBLIC_WT_URL'),
    onLoginSuccess: (req, res, next) => {
      next();
    }
  }));
  api.use(middlewares.managementApiClient({
    domain: config('AUTH0_DOMAIN'),
    clientId: config('AUTH0_CLIENT_ID'),
    clientSecret: config('AUTH0_CLIENT_SECRET'),
    headers: {
      'User-agent': `${process.env.A0EXT_PROVIDER}-deploy-ext/${packageVersion} (node.js/${process.version.replace('v', '')})`
    }
  }));

  api.use('/excludes', excludes(storage));

  api.use('/mappings', mappings(storage));

  api.post('/notified', (req, res, next) => {
    storage.setNotified()
      .then(() => res.status(204).send())
      .catch(next);
  });

  api.get('/config', (req, res, next) => {
    storage.getNotified()
      .then(isNotified => {
        if (isNotified) {
          return {
            showNotification: false,
            branch: config('BRANCH') || config('PROJECT_PATH'),
            secret: config('EXTENSION_SECRET'),
            repository: config('REPOSITORY'),
            prefix: config('INSTANCE')
          };
        }

        return multiPartRequest(req.auth0, 'rules')
          .then(existingRules => {
            const result = {
              showNotification: false,
              branch: config('BRANCH') || config('PROJECT_PATH'),
              secret: config('EXTENSION_SECRET'),
              repository: config('REPOSITORY'),
              prefix: config('INSTANCE')
            };

            if (existingRules && existingRules.length) {
              result.showNotification = true;
            } else {
              storage.setNotified();
            }

            return result;
          });
      })
    .then(data => res.json(data))
    .catch(err => next(err));
  });

  api.get('/deployments', (req, res, next) =>
    storage.getReports()
      .then(reports => res.json(reports))
      .catch(next)
  );

  api.post('/deployments', (req, res, next) =>
    getOptions(req)
      .then(options => deploy(storage, req.auth0, options))
      .then(stats => res.json(stats))
      .catch(next));

  return api;
};
