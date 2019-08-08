import _ from 'lodash';
import express from 'express';

export default (storage, type) => {
  const api = express.Router(); // eslint-disable-line new-cap
  api.get('/', (req, res, next) => {
    if (!req.auth0[type] || typeof req.auth0[type].get !== 'function') {
      return next(new Error(`Get excluded error: wrong type ${type}`));
    }

    return req.auth0[type].get()
      .then(items => {
        storage.getData(true)
          .then(data => {
            const result = {};
            const excludedItems = data && data.exclude && data.exclude[type];
            if (type === 'resourceServers') {
              items = _.filter(items, server => !server.is_system);
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
            res.json(result);
          })
          .catch(next);
      })
      .catch(next);
  });

  api.post('/', (req, res, next) => {
    const excludedItems = req.body.names || [];

    storage.saveExclude(excludedItems, type)
      .then(() => res.status(201).send())
      .catch(next);
  });

  return api;
};
