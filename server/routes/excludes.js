import _ from 'lodash';
import express from 'express';
import Promise from 'bluebird';
import multiPartRequest from '../lib/multipartRequest';

const getExcludes = (type, client, storage) => {
  const resourceType = type === 'databases' ? 'connections' : type;

  const query = {
    rules: { fields: 'name' },
    clients: { is_global: false, fields: 'name' },
    databases: { strategy: 'auth0', fields: 'name' },
    connections: { fields: 'name,strategy' },
    resourceServers: { fields: 'name,is_system' }
  };

  if (!client[resourceType] || typeof client[resourceType].getAll !== 'function') {
    return Promise.reject(new Error(`Get excluded error: wrong type ${type}`));
  }

  return multiPartRequest(client, resourceType, query[type])
    .then(items =>
      storage.getData()
        .then(data => {
          const result = {};
          const excludedItems = data && data.exclude && data.exclude[type];
          if (type === 'resourceServers') {
            items = _.filter(items, server => !server.is_system);
          } else if (type === 'connections') {
            items = _.filter(items, connection => connection.strategy !== 'auth0');
          }

          if (excludedItems) {
            _.forEach(items, (item) => {
              result[item.name] = (excludedItems.indexOf(item.name) >= 0);
            });
          } else {
            _.forEach(items, (item) => {
              result[item.name] = false;
            });
          }

          return result;
        })
    );
};

export default (storage) => {
  const api = express.Router(); // eslint-disable-line new-cap
  api.get('/', (req, res, next) => {
    const promises = {
      rules: getExcludes('rules', req.auth0, storage),
      clients: getExcludes('clients', req.auth0, storage),
      databases: getExcludes('databases', req.auth0, storage),
      connections: getExcludes('connections', req.auth0, storage),
      resourceServers: getExcludes('resourceServers', req.auth0, storage)
    };

    return Promise.props(promises)
      .then(result => res.json(result))
      .catch(err => next(err));
  });

  api.post('/', (req, res, next) => {
    const excludedItems = req.body.names || [];
    const type = req.body.type;

    storage.saveExclude(excludedItems, type)
      .then(() => res.status(201).send())
      .catch(next);
  });

  return api;
};
