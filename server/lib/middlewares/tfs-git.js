import { ArgumentError, UnauthorizedError } from 'auth0-extension-tools';

import { hasChanges } from '../providers/tfs-git';
import config from '../config';

const parse = ({ notificationId = '', resource = {}, eventType = '' }) => {
  const checkoutSha = resource.refUpdates[0].newObjectId;
  // If the ref starts with "refs/heads/", strip it
  const branch = resource.refUpdates[0].name.replace(/^refs\/heads\//i, '');

  return {
    id: notificationId,
    repositoryId: resource.repository.id,
    event: eventType,
    branch: branch,
    commitId: checkoutSha,
    repository: resource.repository.name,
    user: resource.pushedBy.uniqueName,
    sha: checkoutSha
  };
};

module.exports = () => (req, res, next) => {
  if (config('EXTENSION_SECRET') !== req.headers['x-hook-secret']) {
    return next(new UnauthorizedError('The webhook secret is incorrect.'));
  }

  if (!req.body.resource.refUpdates || !req.body.resource.refUpdates[0]) {
    return next(new ArgumentError('The webhook details are incorrect.'));
  }

  const result = parse(req.body);
  // Only accept push requests.
  if (result.event !== 'git.push') {
    return res.status(202).json({ message: `Request ignored, the '${result.event}' event is not supported.` });
  }

  // Only for the active branch.
  if (result.branch !== config('BRANCH')) {
    return res.status(202).json({ message: `Request ignored, '${result.branch}' is not the active branch.` });
  }

  // Only run if there really are changes.
  return hasChanges(result.commitId, result.repositoryId).then(changes => {
    if (!changes) {
      return res.status(202).json({ message: 'Request ignored, none of the Rules or Database Connection scripts were changed.' });
    }

    req.webhook = result;

    return next();
  });
};
