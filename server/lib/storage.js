export default function(storage, report) {
  return storage.read()
    .then((data) => {
      const maxLogs = 20;

      report.assets = null;
      delete report.assets;

      data.deployments = data.deployments || [];
      data.deployments.push(report);
      data.deployments = data.deployments.splice(-maxLogs, maxLogs);

      return storage.write(data).then(() => report);
    });
}

export function getExcluded(storage) {
  return storage.read()
    .then((data) => ({ rules: data.excluded_rules, resourceServers: data.excluded_resource_servers}));
}
