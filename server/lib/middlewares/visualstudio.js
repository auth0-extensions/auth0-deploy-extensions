const git = require('./tfs-git');
const tfvc = require('./tfs-tfvc');
const config = require('../config');

module.exports = () => {
  if (config('TYPE') === 'git') {
    return git();
  }

  return tfvc();
};
