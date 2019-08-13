import { deploy as sourceDeploy } from 'auth0-source-control-extension-tools';

import report from './reporter';
import config from './config';

const { getChanges } = require(`./providers/${process.env.A0EXT_PROVIDER}`);

let repo;

export default (storage, client, options) => {
  const run = (opts, mappings, exclude) => {
    const { id, sha, user, branch, repository } = opts;
    repo = {
      id,
      sha,
      user,
      branch,
      repository
    };

    opts.version = (id === 'manual') ? sha : branch;

    return getChanges({ ...opts, mappings })
      .then(assets => {
        assets.exclude = exclude;
        repo.assets = assets;
        return assets;
      })
      .then(assets => sourceDeploy(assets, client, config))
      .then(progress => report(storage, { repo, progress }));
  };

  return storage.getData()
    .then(({ mappings, exclude, lastSuccess }) =>
      run(options, mappings, exclude)
        .catch(err => report(storage, { repo, error: err.message })
          .then(() => {
            const reDeployEnabled = config('AUTO_REDEPLOY') === 'true' || config('AUTO_REDEPLOY') === true;
            const isValidationError = err.message.startsWith('Schema validation failed');

            if (repo.id !== 'manual' && reDeployEnabled && !isValidationError) {
              const lastSuccessOptions = Object.assign({}, options, lastSuccess);

              return run(lastSuccessOptions, mappings, exclude)
                .catch(redeployErr => report(storage, { repo, error: redeployErr.message })
                  .then(() => Promise.reject(redeployErr)));
            }

            return Promise.reject(err);
          })));
};
