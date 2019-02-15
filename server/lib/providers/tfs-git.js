import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import { constants } from 'auth0-source-control-extension-tools';
import { getPersonalAccessTokenHandler, getBasicHandler, WebApi } from 'vso-node-api';

import utils from '../utils';
import logger from '../logger';
import config from '../config';


/*
 * TFS API connection
 */
let apiInstance = null;

const getApi = () => {
  if (!apiInstance) {
    const collectionURL = `https://${config('INSTANCE')}.visualstudio.com/${config('COLLECTION')}`;
    const vsCredentials = config('AUTH_METHOD') === 'pat' ?
      getPersonalAccessTokenHandler(config('TOKEN')) :
      getBasicHandler(config('USERNAME'), config('PASSWORD'));
    const vsConnection = new WebApi(collectionURL, vsCredentials);
    apiInstance = vsConnection.getGitApi();
  }

  return Promise.resolve(apiInstance);
};

/*
 * Get a flat list of changes and files that need to be added/updated/removed.
 */
export const hasChanges = (commitId, repoId) =>
  new Promise((resolve, reject) => {
    // 1. get changes for commit
    // 2. get valid files from changes, if any
    try {
      let files = [];

      return getApi()
        .then(api => api.getChanges(commitId, repoId))
        .then(data => {
          files = data ? files.concat(data.changes) : [];
        })
        .then(() => resolve(_.chain(files)
          .map(file => file.item.path)
          .flattenDeep()
          .uniq()
          .filter(f => utils.validFilesOnly(f.slice(1)))
          .value()
          .length > 0))
        .catch(e => reject(e));
    } catch (e) {
      return reject(e);
    }
  });

/*
 * Get last commitId for branch
 */
const getCommitId = (repositoryId, branch) =>
  new Promise((resolve, reject) => {
    if (/[a-z0-9]{40}/.test(branch)) {
      return resolve(branch);
    }

    try {
      return getApi()
        .then(api => api.getBranch(repositoryId, branch))
        .then(data => {
          if (!data) {
            logger.error(`Branch '${branch}' not found`);
            return reject(new Error(`Branch '${branch}' not found`));
          }

          return resolve(data.commit.commitId);
        })
        .catch(e => reject(e));
    } catch (e) {
      return reject(e);
    }
  });

/*
 * Get full tree.
 */
const getTree = (repositoryId, branch) =>
  getCommitId(repositoryId, branch)
    .then(commitId => getApi().then(api => api.getCommit(commitId, repositoryId)))
    .then(commit => getApi().then(api => api.getTree(repositoryId, commit.treeId, null, null, true)))
    .then(data =>
      data.treeEntries
        .filter(f => f.gitObjectType === 3)
        .filter(f => utils.validFilesOnly(f.relativePath))
        .map(f => ({ path: f.relativePath, id: f.objectId })));


/*
 * Download a single file.
 */
const downloadFile = (repositoryId, branch, file) =>
  new Promise((resolve, reject) => {
    try {
      getApi()
        .then(api => api.getBlobContent(repositoryId, file.id, null, true))
        .then(data => {
          if (data) {
            let result = '';

            data.on('data', (chunk) => {
              result += chunk;
            });

            data.on('end', () => resolve({
              fileName: file.path,
              contents: result
            }));
          } else {
            logger.error(`Error downloading '${file.path}'`);
            reject(new Error(`Error downloading '${file.path}'`));
          }
        });
    } catch (e) {
      reject(e);
    }
  });

/*
 * Download a single rule with its metadata.
 */
const downloadRule = (repositoryId, branch, ruleName, rule) => {
  const currentRule = {
    script: false,
    metadata: false,
    name: ruleName
  };

  const downloads = [];

  if (rule.script) {
    downloads.push(downloadFile(repositoryId, branch, rule.scriptFile)
      .then(file => {
        currentRule.script = true;
        currentRule.scriptFile = file.contents;
      }));
  }

  if (rule.metadata) {
    downloads.push(downloadFile(repositoryId, branch, rule.metadataFile)
      .then(file => {
        currentRule.metadata = true;
        currentRule.metadataFile = JSON.parse(file.contents);
      }));
  }

  return Promise.all(downloads)
    .then(() => currentRule);
};

/*
 * Download a single configurable file.
 */
const downloadConfigurable = (repositoryId, branch, name, item) => {
  const configurable = {
    metadata: false,
    name
  };

  const downloads = [];

  if (item.configFile) {
    downloads.push(downloadFile(repositoryId, branch, item.configFile)
      .then(file => {
        configurable.configFile = JSON.parse(file.contents);
      }));
  }

  if (item.metadataFile) {
    downloads.push(downloadFile(repositoryId, branch, item.metadataFile)
      .then(file => {
        configurable.metadata = true;
        configurable.metadataFile = JSON.parse(file.contents);
      }));
  }

  return Promise.all(downloads).then(() => configurable);
};


/*
 * Determine if we have the script, the metadata or both.
 */
const getRules = (repositoryId, branch, files) => {
  const rules = utils.getRulesFiles(files);

  // Download all rules.
  return Promise.map(Object.keys(rules), (ruleName) => downloadRule(repositoryId, branch, ruleName, rules[ruleName]), { concurrency: 2 });
};

/*
 * Determine if we have the script, the metadata or both.
 */
const getConfigurables = (repositoryId, branch, files, directory) => {
  const configurables = utils.getConfigurablesFiles(files, directory);

  // Download all rules.
  return Promise.map(Object.keys(configurables), (key) =>
    downloadConfigurable(repositoryId, branch, key, configurables[key]), { concurrency: 2 });
};

/*
 * Download a single database script.
 */
const downloadDatabaseScript = (repositoryId, branch, databaseName, scripts) => {
  const database = {
    name: databaseName,
    scripts: []
  };

  const downloads = [];

  scripts.forEach(script => {
    downloads.push(downloadFile(repositoryId, branch, script)
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
const getDatabaseData = (repositoryId, branch, files) => {
  const databases = utils.getDatabaseFiles(files);

  return Promise.map(Object.keys(databases), (databaseName) => downloadDatabaseScript(repositoryId, branch, databaseName, databases[databaseName]), { concurrency: 2 });
};

/*
 * Download a single page or email script.
 */
const downloadTemplate = (repositoryId, branch, tplName, template) => {
  const downloads = [];
  const currentTpl = {
    metadata: false,
    name: tplName
  };

  if (template.file) {
    downloads.push(downloadFile(repositoryId, branch, template.file)
      .then(file => {
        currentTpl.htmlFile = file.contents;
      }));
  }

  if (template.meta_file) {
    downloads.push(downloadFile(repositoryId, branch, template.meta_file)
      .then(file => {
        currentTpl.metadata = true;
        currentTpl.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads).then(() => currentTpl);
};

/*
 * Get all html templates - emails/pages.
 */
const getHtmlTemplates = (repositoryId, branch, files, dir, allowedNames) => {
  const templates = utils.getTplFiles(files, dir, allowedNames);

  return Promise.map(Object.keys(templates), (name) =>
    downloadTemplate(repositoryId, branch, name, templates[name]), { concurrency: 2 });
};

/*
 * Get email provider.
 */
const getEmailProvider = (projectId, branch, files) =>
  downloadConfigurable(projectId, branch, 'emailProvider', { configFile: _.find(files, f => utils.isEmailProvider(f.path)) });


/*
 * Get a list of all changes that need to be applied to rules and database scripts.
 */
export const getChanges = ({ repositoryId, branch }) =>
  new Promise((resolve, reject) => {
    getTree(repositoryId, branch)
      .then(files => {
        logger.debug(`Files in tree: ${JSON.stringify(files.map(file => ({
          name: file.path,
          id: file.id
        })), null, 2)}`);

        const promises = {
          rules: getRules(repositoryId, branch, files),
          databases: getDatabaseData(repositoryId, branch, files),
          emailProvider: getEmailProvider(repositoryId, branch, files),
          emailTemplates: getHtmlTemplates(repositoryId, branch, files, constants.EMAIL_TEMPLATES_DIRECTORY, constants.EMAIL_TEMPLATES_NAMES),
          pages: getHtmlTemplates(repositoryId, branch, files, constants.PAGES_DIRECTORY, constants.PAGE_NAMES),
          clients: getConfigurables(repositoryId, branch, files, constants.CLIENTS_DIRECTORY),
          clientGrants: getConfigurables(repositoryId, branch, files, constants.CLIENTS_GRANTS_DIRECTORY),
          connections: getConfigurables(repositoryId, branch, files, constants.CONNECTIONS_DIRECTORY),
          rulesConfigs: getConfigurables(repositoryId, branch, files, constants.RULES_CONFIGS_DIRECTORY),
          resourceServers: getConfigurables(repositoryId, branch, files, constants.RESOURCE_SERVERS_DIRECTORY)
        };

        return Promise.props(promises)
          .then((result) => utils.unifyData(result));
      })
      .catch(e => reject(e));
  });

/*
 * Get a repository id by name.
 */
const getRepositoryId = () =>
  getApi()
    .then(api => api.getRepositories())
    .then(repositories => {
      if (!repositories) return null;

      let rID = null;
      const repository = repositories.filter(f => f.name === config('REPOSITORY'));

      if (repository[0] && repository[0].id) rID = repository[0].id;

      return rID;
    });

/*
 * Get default options for manual deploy
 */
export const getOptions = (req) =>
  getRepositoryId()
    .then(repositoryId => ({
      id: 'manual',
      branch: config('BRANCH'),
      repository: config('REPOSITORY'),
      sha: (req.body && req.body.sha) || config('BRANCH'),
      user: req.user.sub,
      repositoryId
    }));
