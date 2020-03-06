import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import GitLabApi from 'gitlab';
import { constants } from 'auth0-source-control-extension-tools';

import config from '../config';
import logger from '../logger';
import utils from '../utils';

/*
 * GitLab API connection
 */
let gitlab = null;

const getApi = () => {
  if (!gitlab) {
    gitlab = new GitLabApi({
      url: config('URL') || 'https://gitlab.com',
      token: config('TOKEN')
    });
  }

  return gitlab;
};

/*
 * Get a flat list of changes and files that need to be added/updated/removed.
 */
export const hasChanges = (commits) =>
_.chain(commits)
  .map(commit => _.union(commit.added, commit.modified, commit.removed))
  .flattenDeep()
  .uniq()
  .filter(utils.validFilesOnly)
  .value()
  .length > 0;

/*
 * Get by given path.
 */
const getTreeByPath = (projectId, branch, directory) =>
  getApi().Repositories.tree(projectId, {
    ref: branch,
    path: utils.getBaseDir() + directory
  }).then((res) => {
    if (!res) {
      return [];
    }
    const files = res
      .filter(f => f.type === 'blob')
      .filter(f => utils.validFilesOnly(f.path));

    files.forEach((elem, idx) => {
      const dir = directory ? `${directory}/` : '';
      files[idx].path = `${utils.getBaseDir()}${dir}${elem.name}`;
    });
    return files;
  });

/*
 * Get connection files for one db connection
 */
const getDBConnectionTreeByPath = (projectId, branch, filePath) =>
  getApi().Repositories.tree(projectId, {
    ref: branch,
    path: `${utils.getBaseDir()}${constants.DATABASE_CONNECTIONS_DIRECTORY}/${filePath}`
  }).then((res) => {
    if (!res) {
      return [];
    }

    const files = res
      .filter(f => f.type === 'blob');

    files.forEach((elem, idx) => {
      files[idx].path = `${utils.getBaseDir()}${constants.DATABASE_CONNECTIONS_DIRECTORY}/${filePath}/${elem.name}`;
    });

    return files;
  });

/*
 * Get all files for all database-connections.
 */
const getDBConnectionsTree = (projectId, branch) =>
  getApi().Repositories.tree(projectId, {
    ref: branch,
    path: utils.getBaseDir() + constants.DATABASE_CONNECTIONS_DIRECTORY
  }).then((res) => {
    if (!res) {
      return [];
    }

    const subdirs = res.filter(f => f.type === 'tree');
    const promisses = [];
    let files = [];

    subdirs.forEach(subdir => {
      promisses.push(getDBConnectionTreeByPath(projectId, branch, subdir.name).then(data => {
        files = files.concat(data);
      }));
    });

    return Promise.all(promisses)
      .then(() => files);
  });
/*
 * Get full tree.
 */
const getTree = (projectId, branch) => {
  // Getting separate trees for rules and connections, as GitLab does not provide full (recursive) tree
  const promises = {
    tenant: getTreeByPath(projectId, branch, ''),
    rules: getTreeByPath(projectId, branch, constants.RULES_DIRECTORY),
    databases: getDBConnectionsTree(projectId, branch),
    emails: getTreeByPath(projectId, branch, constants.EMAIL_TEMPLATES_DIRECTORY),
    guardianFactors: getTreeByPath(projectId, branch, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_FACTORS_DIRECTORY)),
    guardianFactorTemplates: getTreeByPath(projectId, branch, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_TEMPLATES_DIRECTORY)),
    guardianFactorProviders: getTreeByPath(projectId, branch, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_PROVIDERS_DIRECTORY)),
    pages: getTreeByPath(projectId, branch, constants.PAGES_DIRECTORY),
    roles: getTreeByPath(projectId, branch, constants.ROLES_DIRECTORY),
    clients: getTreeByPath(projectId, branch, constants.CLIENTS_DIRECTORY),
    clientGrants: getTreeByPath(projectId, branch, constants.CLIENTS_GRANTS_DIRECTORY),
    connections: getTreeByPath(projectId, branch, constants.CONNECTIONS_DIRECTORY),
    rulesConfigs: getTreeByPath(projectId, branch, constants.RULES_CONFIGS_DIRECTORY),
    resourceServers: getTreeByPath(projectId, branch, constants.RESOURCE_SERVERS_DIRECTORY)
  };

  return Promise.props(promises)
    .then((result) => (_.union(
      result.tenant,
      result.rules,
      result.databases,
      result.emails,
      result.guardianFactors,
      result.guardianFactorTemplates,
      result.guardianFactorProviders,
      result.pages,
      result.roles,
      result.clients,
      result.clientGrants,
      result.connections,
      result.rulesConfigs,
      result.resourceServers
    )));
};

/*
 * Download a single file.
 */
const downloadFile = (projectId, branch, file) =>
  getApi().RepositoryFiles.show(projectId, file.path, branch)
    .then((data) => ({
      fileName: file.path,
      contents: (new Buffer(data.content, 'base64')).toString()
    }));

/*
 * Download a single rule with its metadata.
 */
const downloadRule = (projectId, branch, ruleName, rule) => {
  const currentRule = {
    script: false,
    metadata: false,
    name: ruleName
  };

  const downloads = [];

  if (rule.script) {
    downloads.push(downloadFile(projectId, branch, rule.scriptFile)
      .then(file => {
        currentRule.script = true;
        currentRule.scriptFile = file.contents;
      }));
  }

  if (rule.metadata) {
    downloads.push(downloadFile(projectId, branch, rule.metadataFile)
      .then(file => {
        currentRule.metadata = true;
        currentRule.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads)
    .then(() => currentRule);
};

/*
 * Download a single configurable file.
 */
const downloadConfigurable = (projectId, branch, itemName, item) => {
  const downloads = [];
  const currentItem = {
    metadata: false,
    name: itemName
  };

  if (item.configFile) {
    downloads.push(downloadFile(projectId, branch, item.configFile)
      .then(file => {
        currentItem.configFile = file.contents;
      }));
  }

  if (item.metadataFile) {
    downloads.push(downloadFile(projectId, branch, item.metadataFile)
      .then(file => {
        currentItem.metadata = true;
        currentItem.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads).then(() => currentItem);
};

/*
 * Determine if we have the script, the metadata or both.
 */
const getRules = (projectId, branch, files) => {
  const rules = utils.getRulesFiles(files);

  // Download all rules.
  return Promise.map(Object.keys(rules), (ruleName) =>
    downloadRule(projectId, branch, ruleName, rules[ruleName]), { concurrency: 2 });
};

/*
 * Get all configurables from certain directory.
 */
const getConfigurables = (projectId, branch, files, directory) => {
  const configurables = utils.getConfigurablesFiles(files, directory);

  // Download all rules.
  return Promise.map(Object.keys(configurables), (key) =>
    downloadConfigurable(projectId, branch, key, configurables[key]), { concurrency: 2 });
};

/*
 * Download a single database script.
 */
const downloadDatabaseScript = (projectId, branch, databaseName, scripts) => {
  const database = {
    name: databaseName,
    scripts: []
  };

  const downloads = [];

  scripts.forEach(script => {
    downloads.push(downloadFile(projectId, branch, script)
      .then(file => {
        if (script.name === 'settings') {
          database.settings = file.contents;
        } else {
          database.scripts.push({
            name: script.name,
            scriptFile: file.contents
          });
        }
      })
    );
  });

  return Promise.all(downloads)
    .then(() => database);
};

/*
 * Get all database scripts.
 */
const getDatabaseData = (projectId, branch, files) => {
  const databases = utils.getDatabaseFiles(files);

  return Promise.map(Object.keys(databases), (databaseName) =>
    downloadDatabaseScript(projectId, branch, databaseName, databases[databaseName]), { concurrency: 2 });
};

/*
 * Download a single page or email script.
 */
const downloadTemplate = (projectId, branch, tplName, template) => {
  const downloads = [];
  const currentTpl = {
    metadata: false,
    name: tplName
  };

  if (template.file) {
    downloads.push(downloadFile(projectId, branch, template.file)
      .then(file => {
        currentTpl.htmlFile = file.contents;
      }));
  }

  if (template.meta_file) {
    downloads.push(downloadFile(projectId, branch, template.meta_file)
      .then(file => {
        currentTpl.metadata = true;
        currentTpl.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads)
    .then(() => currentTpl);
};

/*
 * Get all html templates - emails/pages.
 */
const getHtmlTemplates = (projectId, branch, files, dir, allowedNames) => {
  const templates = utils.getTplFiles(files, dir, allowedNames);

  return Promise.map(Object.keys(templates), (name) =>
    downloadTemplate(projectId, branch, name, templates[name]), { concurrency: 2 });
};

/*
 * Get tenant settings.
 */
const getTenant = (projectId, branch, files) =>
  downloadConfigurable(projectId, branch, 'tenant', { configFile: _.find(files, f => utils.isTenantFile(f.path)) });

/*
 * Get email provider.
 */
const getEmailProvider = (projectId, branch, files) =>
  downloadConfigurable(projectId, branch, 'emailProvider', { configFile: _.find(files, f => utils.isEmailProvider(f.path)) });

/*
 * Get a list of all changes that need to be applied to rules and database scripts.
 */
export const getChanges = ({ projectId, branch, mappings }) =>
  getTree(projectId, branch)
    .then(files => {
      logger.debug(`Files in tree: ${JSON.stringify(files.map(file => ({ name: file.path, id: file.id })), null, 2)}`);

      const promises = {
        tenant: getTenant(projectId, branch, files),
        rules: getRules(projectId, branch, files),
        databases: getDatabaseData(projectId, branch, files),
        emailProvider: getEmailProvider(projectId, branch, files),
        emailTemplates: getHtmlTemplates(projectId, branch, files, constants.EMAIL_TEMPLATES_DIRECTORY, constants.EMAIL_TEMPLATES_NAMES),
        guardianFactors: getConfigurables(projectId, branch, files, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_FACTORS_DIRECTORY)),
        guardianFactorTemplates: getConfigurables(projectId, branch, files, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_TEMPLATES_DIRECTORY)),
        guardianFactorProviders: getConfigurables(projectId, branch, files, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_PROVIDERS_DIRECTORY)),
        pages: getHtmlTemplates(projectId, branch, files, constants.PAGES_DIRECTORY, constants.PAGE_NAMES),
        roles: getConfigurables(projectId, branch, files, constants.ROLES_DIRECTORY),
        clients: getConfigurables(projectId, branch, files, constants.CLIENTS_DIRECTORY),
        clientGrants: getConfigurables(projectId, branch, files, constants.CLIENTS_GRANTS_DIRECTORY),
        connections: getConfigurables(projectId, branch, files, constants.CONNECTIONS_DIRECTORY),
        rulesConfigs: getConfigurables(projectId, branch, files, constants.RULES_CONFIGS_DIRECTORY),
        resourceServers: getConfigurables(projectId, branch, files, constants.RESOURCE_SERVERS_DIRECTORY)
      };

      return Promise.props(promises)
        .then((result) => utils.unifyData(result, mappings));
    });

/*
 * Get a project id by path.
 */
const getProjectId = () => {
  const { user, repo } = utils.parseRepo(config('REPOSITORY'));
  const repository = `${user}/${repo}`;

  return getApi().Projects.all({ membership: true }).then(projects => {
    if (!projects) {
      return Promise.reject(new Error('Unable to determine project ID'));
    }

    const currentProject = projects.filter(f => f.path_with_namespace === repository);

    if (currentProject[0] && currentProject[0].id) {
      return currentProject[0].id;
    }

    return Promise.reject(new Error('Unable to determine project ID'));
  });
};

/*
 * Get default options for manual deploy
 */
export const getOptions = (req) =>
  getProjectId()
    .then(projectId => ({
      id: 'manual',
      branch: config('BRANCH'),
      repository: config('REPOSITORY'),
      sha: (req.body && req.body.sha) || config('BRANCH'),
      user: req.user.sub,
      projectId
    }));
