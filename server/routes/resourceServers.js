import _ from 'lodash';
import express from 'express';

export default (storage) => {
  const api = express.Router(); // eslint-disable-line new-cap
  api.get('/', (req, res, next) => {
    req.auth0.resourceServers.get()
      .then(resourceServers => {
        storage.read()
          .then(data => {
            const result = {};
            const filtered = _.filter(resourceServers, server => !server.is_system);

            if (data && data.excluded_resource_servers) {
              _.forEach(filtered, (server) => {
                result[server.name] = (data.excluded_resource_servers.indexOf(server.name) >= 0);
              });
            } else {
              _.forEach(filtered, (server) => {
                result[server.name] = false;
              });
            }
            res.json(result);
          })
          .catch(next);
      })
      .catch(next);
  });

  api.post('/', (req, res, next) => {
    const excludedResourceServers = req.body.names || [];
    storage.read()
      .then(data => {
        data.excluded_resource_servers = excludedResourceServers; // eslint-disable-line no-param-reassign
        data.excluded_resource_servers = excludedResourceServers; // eslint-disable-line no-param-reassign
        return data;
      })
      .then(data => storage.write(data))
      .then(() => res.status(200).send())
      .catch(next);
  });

  return api;
};
