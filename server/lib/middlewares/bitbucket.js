import { ArgumentError } from 'auth0-extension-tools';
import config from '../config';

const parse = (headers, { push = {}, repository = {}, actor = {} }) => {
  let data = {};

  if (push.changes && push.changes.length > 0 && push.changes[0].new) {
    const details = push.changes[0].new;
    let diff = null;

    if (push.changes[0].links && push.changes[0].links.diff) {
      diff = push.changes[0].links.diff.href.split('/').pop();
    }

    data = {
      id: headers['x-hook-uuid'],
      event: headers['x-event-key'],
      branch: (details.type === 'branch' || details.type === 'named_branch') ? details.name : '',
      commits: push.changes[0].commits,
      repository: repository.full_name,
      user: actor.display_name,
      diff,
      sha: details.target.hash
    };
  } else {
    data = {
      id: headers['x-hook-uuid'],
      event: headers['x-event-key'],
      branch: '',
      commits: [],
      repository: repository.full_name,
      user: actor.display_name,
      sha: '',
      diff: ''
    };
  }

  return data;
};

module.exports = () => (req, res, next) => {
  if (!req.headers['x-hook-uuid']) {
    return next(new ArgumentError('The Bitbucket delivery identifier is missing.'));
  }

  if (!req.headers['x-event-key']) {
    return next(new ArgumentError('The Bitbucket event name is missing.'));
  }

  if (!req.params.secret || req.params.secret !== config('EXTENSION_SECRET')) {
    return next(new ArgumentError('The Extension Secret is incorrect.'));
  }

  const result = parse(req.headers, req.body);

  // Only accept push requests.
  if (result.event !== 'repo:push') {
    return res.status(202).json({ message: `Request ignored, the '${result.event}' event is not supported.` });
  }

  // Only for the active branch.
  if (result.branch !== config('BRANCH')) {
    return res.status(202).json({ message: `Request ignored, '${result.branch}' is not the active branch.` });
  }

  req.webhook = result; // eslint-disable-line no-param-reassign

  return next();
};
