import express from 'express';

export default (storage) => {
  const api = express.Router(); // eslint-disable-line new-cap
  api.get('/', (req, res, next) =>
    storage.getData()
      .then(data => res.json(data.mappings || {}))
      .catch(next));

  api.post('/', (req, res, next) => {
    let mappings;
    try {
      mappings = JSON.parse(req.body.mappings);
    } catch (e) {
      return next(e);
    }

    return storage.saveMappings(mappings)
      .then(() => res.status(200).send(mappings))
      .catch(next);
  });

  return api;
};
