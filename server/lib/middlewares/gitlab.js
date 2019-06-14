import { ArgumentError, UnauthorizedError } from 'auth0-extension-tools';

import { hasChanges } from '../providers/gitlab';
import config from '../config';


const parse = (headers, { ref = '', commits = [], project = {}, project_id = '', user_email = '', event_name = '', checkout_sha = '' }) => { // eslint-disable-line camelcase
  // If the ref starts with "refs/heads/", strip it
  const branch = ref.replace(/^refs\/heads\//i, '');

  return {
    id: checkout_sha,
    projectId: project_id,
    event: event_name,
    branch: branch,
    commits,
    repository: project.path_with_namespace,
    user: user_email,
    sha: checkout_sha
  };
};

module.exports = () => (req, res, next) => {
  if (!req.headers['x-gitlab-event']) {
    return next(new ArgumentError('The GitLab event name is missing.'));
  }

  if (config('EXTENSION_SECRET') !== req.headers['x-gitlab-token']) {
    return next(new UnauthorizedError('The GitLab webhook secret is incorrect.'));
  }

  const result = parse(req.headers, req.body);

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
