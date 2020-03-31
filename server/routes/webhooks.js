import express from 'express';
import { middlewares } from 'auth0-extension-express-tools';

import config from '../lib/config';
import deploy from '../lib/deploy';

const middleware = require(`../lib/middlewares/${process.env.A0EXT_PROVIDER}`);

export default (storage) => {
  const webhooks = express.Router(); // eslint-disable-line new-cap
  webhooks.use(middlewares.managementApiClient({
    domain: config('AUTH0_DOMAIN'),
    clientId: config('AUTH0_CLIENT_ID'),
    clientSecret: config('AUTH0_CLIENT_SECRET')
  }));

  webhooks.post('/deploy/:secret?', middleware(), (req, res) => {
    // Send response ASAP to prevent extra requests.
    res.status(202).json({ message: 'Request accepted, deployment started.' });

    // Deploy the changes.
    return deploy(storage, req.auth0, req.webhook);
  });

  return webhooks;
};
