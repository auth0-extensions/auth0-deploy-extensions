import axios from 'axios';

export default function(report, hook) {
  if (!hook) {
    return Promise.resolve();
  }

  return axios
    .post(hook, report)
    .then(() => null)
    .catch(err => err);
}
