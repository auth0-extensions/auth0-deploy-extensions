import { Router as router } from 'express';
import { managementApi } from 'auth0-extension-tools';
import { middlewares } from 'auth0-extension-express-tools';

import config from '../lib/config';
import logger from '../lib/logger';

export default () => {
  const hooks = router();
  const hookValidator = middlewares
    .validateHookToken(config('AUTH0_DOMAIN'), config('WT_URL'), config('EXTENSION_SECRET'));

  hooks.use('/on-uninstall', hookValidator('/.extensions/on-uninstall'));

  hooks.delete('/on-uninstall', (req, res) => {
    logger.debug('Uninstall running...');
    const clientId = config('AUTH0_CLIENT_ID');
    const options = {
      domain: config('AUTH0_DOMAIN'),
      clientSecret: config('AUTH0_CLIENT_SECRET'),
      clientId
    };
    managementApi.getClient(options)
      .then(auth0 => auth0.clients.delete({ client_id: clientId }))
      .then(() => {
        logger.debug(`Deleted client ${config('AUTH0_CLIENT_ID')}`);
        res.sendStatus(204);
      })
      .catch((err) => {
        logger.debug(`Error deleting client: ${config('AUTH0_CLIENT_ID')}`);
        logger.error(err);

        // Even if deleting fails, we need to be able to uninstall the extension.
        res.sendStatus(204);
      });
  });

  return hooks;
};
