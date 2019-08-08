import express from 'express';
import { middlewares } from 'auth0-extension-express-tools';

import excluded from './excluded';
import mappings from './mappings';
import deploy from '../lib/deploy';
import config from '../lib/config';

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
    clientSecret: config('AUTH0_CLIENT_SECRET')
  }));

  api.use('/rules', excluded(storage, 'rules'));
  api.use('/resourceServers', excluded(storage, 'resourceServers'));

  api.use('/mappings', mappings(storage));

  api.post('/notified', (req, res, next) => {
    storage.setNotified()
      .then(() => res.status(204).send())
      .catch(next);
  });

  api.get('/config', (req, res, next) => {
    storage.getNotified(isNotified => {
      if (isNotified) {
        return {
          showNotification: false,
          branch: config('BRANCH') || config('PROJECT_PATH'),
          secret: config('EXTENSION_SECRET'),
          repository: config('REPOSITORY'),
          prefix: config('INSTANCE')
        };
      }

      return req.auth0.rules.get()
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
    .catch(next);
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
