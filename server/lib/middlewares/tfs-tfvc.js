import { UnauthorizedError } from 'auth0-extension-tools';

import { hasChanges } from '../providers/tfs-tfvc';
import config from '../config';

const parse = ({ notificationId = '', resource = {}, eventType = '' }) =>
  ({
    id: notificationId,
    event: eventType,
    changesetId: resource.changesetId,
    sha: resource.changesetId,
    user: resource.checkedInBy.uniqueName,
    repository: config('REPOSITORY'),
    projectId: config('REPOSITORY'),
    branch: config('PROJECT_PATH')
  });

module.exports = () => (req, res, next) => {
  if (config('EXTENSION_SECRET') !== req.headers['x-hook-secret']) {
    return next(new UnauthorizedError('The webhook secret is incorrect.'));
  }
  const result = parse(req.body);

  // Only accept checkin requests.
  if (result.event !== 'tfvc.checkin') {
    return res.status(202).json({ message: `Request ignored, the '${result.event}' event is not supported.` });
  }

  // Only run if there really are changes.
  return hasChanges(result.changesetId).then(changes => {
    if (!changes) {
      return res.status(202).json({ message: 'Request ignored, none of the Rules or Database Connection scripts were changed.' });
    }

    req.webhook = result;

    return next();
  });
};
