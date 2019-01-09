import { Router as router } from 'express';

import api from './api';
import html from './html';
import meta from './meta';
import hooks from './hooks';
import webhooks from './webhooks';

export default (storage) => {
  const routes = router();
  routes.use('/.extensions', hooks());
  routes.get('/', html());
  routes.use('/meta', meta());
  routes.use('/webhooks', webhooks(storage));
  routes.use('/api', api(storage));
  return routes;
};
