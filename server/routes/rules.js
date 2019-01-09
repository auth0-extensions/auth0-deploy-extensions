import _ from 'lodash';
import express from 'express';

export default (storage) => {
  const api = express.Router(); // eslint-disable-line new-cap
  api.get('/', (req, res, next) => {
    req.auth0.rules.get()
      .then(rules => {
        storage.read()
          .then(data => {
            const result = {};
            if (data && data.excluded_rules) {
              _.forEach(rules, (rule) => {
                result[rule.name] = (data.excluded_rules.indexOf(rule.name) >= 0);
              });
            } else {
              _.forEach(rules, (rule) => {
                result[rule.name] = false;
              });
            }

            res.json(result);
          })
          .catch(next);
      })
      .catch(next);
  });

  api.post('/', (req, res, next) => {
    const excludedRules = req.body.names || [];

    storage.read()
      .then(data => {
        data.excluded_rules = excludedRules; // eslint-disable-line no-param-reassign
        return data;
      })
      .then(data => storage.write(data))
      .then(() => res.status(201).send())
      .catch(next);
  });

  return api;
};
