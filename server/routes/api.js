import _ from 'lodash';
import express from 'express';
import { middlewares } from 'auth0-extension-express-tools';

import rules from './rules';
import resourceServers from './resourceServers';
import deploy from '../lib/deploy';
import config from '../lib/config';
import { Cipher } from '../lib/decipher';


const { getOptions } = require(`../lib/providers/${process.env.A0EXT_PROVIDER}`);

const setNotified = (storage) =>
  storage.read()
    .then(data => {
      data.isNotified = true; // eslint-disable-line no-param-reassign
      return data;
    })
    .then(data => storage.write(data));

export default (storage) => {
  const cipher = new Cipher(config('EXTENSION_SECRET'));
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

  api.use('/rules', rules(storage));
  api.use('/resourceServers', resourceServers(storage));

  api.post('/notified', (req, res, next) => {
    setNotified(storage)
      .then(() => res.status(204).send())
      .catch(next);
  });

  api.get('/config', (req, res, next) => {
    storage.read()
      .then(data => {
        if (data.isNotified) {
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
              setNotified(storage);
            }

            return result;
          });
      })
      .then(data => res.json(data))
      .catch(next);
  });

  api.get('/deployments', (req, res, next) =>
    storage.read()
      .then(data => res.json(_.orderBy(data.deployments || [], [ 'date' ], [ 'desc' ])))
      .catch(next)
  );

  api.post('/deployments', (req, res, next) =>
    getOptions(req)
      .then(options => deploy(storage, req.auth0, options))
      .then(stats => res.json(stats))
      .catch(next));

  api.post('/cipher', (req, res, next) =>
    cipher.encrypt(req.body.text)
      .then(result => res.json({ result }))
      .catch(next));

  return api;
};
