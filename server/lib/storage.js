import _ from 'lodash';

export default class Storage {
  constructor(storageContext) {
    this.storage = storageContext;
  }
}

Storage.prototype.saveReport = function(report) {
  return this.storage.read()
    .then((data) => {
      const maxLogs = 20;

      report.assets = null;
      delete report.assets;

      data.deployments = data.deployments || [];
      data.deployments.push(report);
      data.deployments = data.deployments.splice(-maxLogs, maxLogs);

      if (!report.error) {
        data.lastSuccess = _.omit(report, [ 'error', 'warnings', 'logs' ]);
      }

      return this.storage.write(data).then(() => report);
    });
};

Storage.prototype.getReports = function() {
  return this.storage.read()
    .then(data => _.orderBy(data.deployments || [], [ 'date' ], [ 'desc' ]));
};

Storage.prototype.getData = function() {
  return this.storage.read();
};

Storage.prototype.saveMappings = function(mappings) {
  return this.storage.read()
    .then((data) => this.storage.write({ ...data, mappings }));
};

Storage.prototype.saveExclude = function(excludes, type) {
  return this.storage.read()
    .then(data => {
      data.exclude = data.exclude || {};
      data.exclude[type] = excludes;
      return data;
    })
    .then(data => this.storage.write(data));
};

Storage.prototype.getNotified = function() {
  return this.storage.read()
    .then(data => data.isNotified);
};

Storage.prototype.setNotified = function() {
  return this.storage.read()
    .then(data => {
      data.isNotified = true;
      return data;
    })
    .then(data => this.storage.write(data));
};
