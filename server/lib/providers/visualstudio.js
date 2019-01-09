const git = require('./tfs-git');
const tfvc = require('./tfs-tfvc');
const config = require('../config');

module.exports = {
  getChanges: (options) => {
    if (config('TYPE') === 'git') {
      return git.getChanges(options);
    }

    return tfvc.getChanges(options);
  },
  getOptions: (req) => {
    if (config('TYPE') === 'git') {
      return git.getOptions(req);
    }

    return tfvc.getOptions(req);
  }
};
