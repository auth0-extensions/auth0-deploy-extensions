import _ from 'lodash';
import Promise from 'bluebird';
import request from 'superagent';

const createPayload = (report, extensionUrl) => {
  const msg = {
    username: 'auth0-deployments',
    icon_emoji: ':rocket:',
    attachments: []
  };

  const template = {
    fallback: 'Bitbucket to Auth0 Deployment',
    text: 'Bitbucket to Auth0 Deployment',
    fields: [
      { title: 'Repository', value: report.repository, short: true },
      { title: 'Branch', value: report.branch, short: true },
      { title: 'ID', value: report.id, short: true },
      { title: 'Commit', value: report.sha, short: true }
    ],
    error_field: { title: 'Error', value: report.error || null, short: false }
  };

  const details = `(<${extensionUrl}|Details>)`;
  const fields = template.fields;

  if (report.error) {
    fields.push(template.error_field);
    msg.attachments.push({
      color: '#F35A00',
      fallback: `${template.fallback} failed: ${report.error.message || report.error}`,
      text: `${template.text} failed: ${details}`,
      fields: template.fields
    });
  } else {
    if (report.logs) {
      _.forEach(report.logs, (item, name) => {
        _.forEach(item, (count, type) => {
          if (count) {
            fields.push({ title: `${name} ${type}`, value: count, short: true });
          }
        });
      });
    }

    msg.attachments.push({
      color: '#7CD197',
      fallback: template.fallback,
      text: `${template.fallback} ${details}`,
      fields
    });
  }

  return msg;
};

export default function (report, extensionUrl, hook) {
  if (!hook) {
    return Promise.resolve();
  }

  const msg = createPayload(report, extensionUrl);

  return new Promise((resolve, reject) => {
    request
      .post(hook)
      .send(msg)
      .set('Accept', 'application/json')
      .end((err) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
  });
}
