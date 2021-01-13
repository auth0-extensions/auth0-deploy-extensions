import join from 'url-join';
import path from 'path';
import morgan from 'morgan';
import Express from 'express';
import bodyParser from 'body-parser';
import tools from 'auth0-extension-tools';
import { middlewares, routes } from 'auth0-extension-express-tools';

import api from './routes';
import logger from './lib/logger';
import config from './lib/config';
import Storage from './lib/storage';

module.exports = (configProvider, storageProvider) => {
  config.setProvider(configProvider);

  const storageContext = storageProvider
    ? new tools.WebtaskStorageContext(storageProvider, { force: 1 })
    : new tools.FileStorageContext(path.join(__dirname, './data.json'), { mergeWrites: true });

  const storage = new Storage(storageContext);

  const app = new Express();
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
    stream: logger.stream
  }));
  app.use(bodyParser.json({
    verify: (req, res, buf, encoding) => {
      if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8'); // eslint-disable-line no-param-reassign
      }
    }
  }));
  app.use(bodyParser.urlencoded({ extended: false }));

  // Configure authentication.
  app.get('/login', (req, res) => {
    res.redirect(join(config('PUBLIC_WT_URL'), '/admins/login'));
  });
  app.use(routes.dashboardAdmins({
    secret: config('EXTENSION_SECRET'),
    audience: `urn:${process.env.A0EXT_PROVIDER}-deploy`,
    rta: config('AUTH0_RTA').replace('https://', ''),
    domain: config('AUTH0_DOMAIN'),
    baseUrl: config('PUBLIC_WT_URL'),
    clientName: `${process.env.A0EXT_PROVIDER} Deploy Extension`,
    urlPrefix: '/admins',
    sessionStorageKey: `${process.env.A0EXT_PROVIDER}-deploy:apiToken`,
    scopes: [
      'read:client_grants',
      'create:client_grants',
      'delete:client_grants',
      'update:client_grants',
      'read:roles',
      'update:roles',
      'delete:roles',
      'create:roles',
      'read:clients',
      'update:clients',
      'delete:clients',
      'create:clients',
      'read:client_keys',
      'update:client_keys',
      'delete:client_keys',
      'create:client_keys',
      'read:connections',
      'update:connections',
      'delete:connections',
      'create:connections',
      'read:resource_servers',
      'update:resource_servers',
      'delete:resource_servers',
      'create:resource_servers',
      'read:rules',
      'update:rules',
      'delete:rules',
      'create:rules',
      'read:rules_configs',
      'update:rules_configs',
      'delete:rules_configs',
      'read:email_provider',
      'update:email_provider',
      'delete:email_provider',
      'create:email_provider',
      'read:tenant_settings',
      'update:tenant_settings',
      'read:grants',
      'delete:grants',
      'read:guardian_factors',
      'update:guardian_factors',
      'read:email_templates',
      'create:email_templates',
      'update:email_templates',
      'read:hooks',
      'update:hooks',
      'delete:hooks',
      'create:hooks'
    ].join(' ')
  }));

  // Configure routes.
  app.use('/app', Express.static(path.join(__dirname, '../dist')));
  app.use('/', api(storage));

  // Generic error handler.
  app.use(middlewares.errorHandler(logger.error.bind(logger)));
  return app;
};
