import Promise from 'bluebird';
import request from 'superagent';

export default function(report, hook) {
  if (!hook) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    request
      .post(hook)
      .send(report)
      .set('Accept', 'application/json')
      .end((err) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
  });
}
