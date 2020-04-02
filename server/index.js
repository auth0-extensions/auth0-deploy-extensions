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
    scopes: config('AUTH0_SCOPES')
  }));

  // Configure routes.
  app.use('/app', Express.static(path.join(__dirname, '../dist')));
  app.use('/', api(storage));

  // Generic error handler.
  app.use(middlewares.errorHandler(logger.error.bind(logger)));
  return app;
};
