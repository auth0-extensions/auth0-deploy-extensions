import crypto from 'crypto';
import { ArgumentError, UnauthorizedError } from 'auth0-extension-tools';

import { hasChanges } from '../providers/github';
import config from '../config';

const calculateSignature = (key, blob) =>
  `sha1=${crypto.createHmac('sha1', key).update(new Buffer(blob, 'utf-8')).digest('hex')}`;

const parse = (headers, { ref = '', commits = [], head_commit = {}, repository = {}, sender = {} }) => { // eslint-disable-line camelcase
  // If the ref starts with "refs/heads/", strip it
  const branch = ref.replace(/^refs\/heads\//i, '');

  return {
    id: headers['x-github-delivery'],
    event: headers['x-github-event'],
    branch,
    commits,
    repository: repository.full_name,
    user: sender.login,
    sha: head_commit.id
  };
};

module.exports = () => (req, res, next) => {
  if (!req.headers['x-github-delivery']) {
    return next(new ArgumentError('The GitHub delivery identifier is missing.'));
  }

  if (!req.headers['x-github-event']) {
    return next(new ArgumentError('The GitHub event name is missing.'));
  }

  const signature = calculateSignature(config('EXTENSION_SECRET'), req.rawBody);
  if (signature !== req.headers['x-hub-signature']) {
    return next(new UnauthorizedError('The GitHub webhook signature is incorrect.'));
  }

  const result = parse(req.headers, req.body);

  if (result.event !== 'push') {
    return res.status(202).json({ message: `Request ignored, the '${result.event}' event is not supported.` });
  }

  // Only for the active branch.
  if (result.branch !== config('BRANCH')) {
    return res.status(202).json({ message: `Request ignored, '${result.branch}' is not the active branch.` });
  }

  // Only run if there really are changes.
  if (!hasChanges(result.commits)) {
    return res.status(202).json({ message: 'Request ignored, none of the Rules or Database Connection scripts were changed.' });
  }

  req.webhook = result; // eslint-disable-line no-param-reassign

  return next();
};
