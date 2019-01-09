import _ from 'lodash';
import Promise from 'bluebird';

import config from './config';
import saveToStorage from './storage';
import sendToSlack from './slack';
import sendToHook from './hook';

const clearEmpty = (data) => {
  if (!data) {
    return null;
  }
  return _.pickBy(data, (entity) => entity.deleted + entity.created + entity.updated > 0);
};

export default function(storage, info) {
  const report = {
    ...info.repo,
    error: info.error,
    warnings: [],
    logs: clearEmpty(info.progress),
    date: new Date()
  };

  return Promise.all([
    sendToSlack(report, `${config('WT_URL')}/login`, config('SLACK_INCOMING_WEBHOOK_URL'))
      .catch((err) => {
        report.warnings.push({ title: 'Error sending report to Slack', message: err });
        return Promise.resolve();
      }),
    sendToHook(report, config('REPORT_WEBHOOK'))
      .catch((err) => {
        report.warnings.push({ title: `Error sending report to ${config('REPORT_WEBHOOK')}`, message: err });
        return Promise.resolve();
      })
  ]).then(() => saveToStorage(storage, report));
}
