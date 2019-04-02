import _ from 'lodash';
import Promise from 'bluebird';
import GitHubApi from 'github';
import request from 'request-promise';
import { constants } from 'auth0-source-control-extension-tools';

import config from '../config';
import logger from '../logger';
import utils from '../utils';


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
 * Get tree.
 */
const getTree = (repository, branch, sha) =>
  new Promise((resolve, reject) => {
    try {
      logger.log('Repository: ', repository);
      logger.log('Branch: ', branch);
      logger.log('Sha: ', sha);

      const host = config('HOST') || 'api.github.com';
      const pathPrefix = host !== 'api.github.com' ? config('API_PATH') || '/api/v3' : '';
      const github = new GitHubApi({
        version: '3.0.0',
        host,
        pathPrefix
      });
      github.authenticate({
        type: 'oauth',
        token: config('TOKEN')
      });

      const { user, repo } = utils.parseRepo(repository);
      github.gitdata.getTree({ user, repo, sha: sha || branch, recursive: true },
        (err, res) => {
          if (err) {
            return reject(err);
          }

          try {
            const files = res.tree
              .filter(f => f.type === 'blob')
              .filter(f => utils.validFilesOnly(f.path));
            return resolve(files);
          } catch (mappingError) {
            return reject(mappingError);
          }
        });
    } catch (e) {
      logger.error(e);
      reject(e);
    }
  });

/*
 * Download a single file.
 */
const downloadFile = (repository, branch, file) => {
  const token = config('TOKEN');
  const host = config('HOST') || 'api.github.com';
  const pathPrefix = host !== 'api.github.com' ? config('API_PATH') || '/api/v3' : '';
  const url = `https://${token}:x-oauth-basic@${host}${pathPrefix}/repos/${repository}/git/blobs/${file.sha}`;

  return request({ uri: url, json: true, headers: { 'user-agent': 'auth0-github-deploy' } })
    .promise()
    .then(blob => {
      logger.debug(`Downloaded ${file.path} (${file.sha})`);

      return {
        fileName: file.path,
        contents: (new Buffer(blob.content, 'base64')).toString()
      };
    })
    .catch(err => {
      logger.error(`Error downloading '${host}${pathPrefix}/repos/${repository}/git/blobs/${file.sha}'`);
      logger.error(err);

      throw err;
    });
};

/*
 * Download a single rule with its metadata.
 */
const downloadRule = (repository, branch, ruleName, rule) => {
  const currentRule = {
    script: false,
    metadata: false,
    name: ruleName
  };

  const downloads = [];

  if (rule.script) {
    downloads.push(downloadFile(repository, branch, rule.scriptFile)
      .then(file => {
        currentRule.script = true;
        currentRule.scriptFile = file.contents;
      }));
  }

  if (rule.metadata) {
    downloads.push(downloadFile(repository, branch, rule.metadataFile)
      .then(file => {
        currentRule.metadata = true;
        currentRule.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads)
    .then(() => currentRule);
};

/*
 * Determine if we have the script, the metadata or both.
 */
const getRules = (repository, branch, files) => {
  const rules = utils.getRulesFiles(files);

  // Download all rules.
  return Promise.map(Object.keys(rules), (ruleName) =>
    downloadRule(repository, branch, ruleName, rules[ruleName]), { concurrency: 2 });
};

/*
 * Download a single database script.
 */
const downloadDatabaseScript = (repository, branch, databaseName, scripts) => {
  const database = {
    name: databaseName,
    scripts: []
  };

  const downloads = [];
  scripts.forEach(script => {
    downloads.push(downloadFile(repository, branch, script)
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
const getDatabaseData = (repository, branch, files) => {
  const databases = utils.getDatabaseFiles(files);

  return Promise.map(Object.keys(databases), (databaseName) =>
      downloadDatabaseScript(repository, branch, databaseName, databases[databaseName]),
    { concurrency: 2 });
};

/*
 * Download a single page or email script.
 */
const downloadTemplate = (repository, branch, tplName, template, shaToken) => {
  const downloads = [];
  const currentPage = {
    metadata: false,
    name: tplName
  };

  if (template.file) {
    downloads.push(downloadFile(repository, branch, template.file, shaToken)
      .then(file => {
        currentPage.htmlFile = file.contents;
      }));
  }

  if (template.meta_file) {
    downloads.push(downloadFile(repository, branch, template.meta_file, shaToken)
      .then(file => {
        currentPage.metadata = true;
        currentPage.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads).then(() => currentPage);
};

/*
 * Download a single configurable file.
 */
const downloadConfigurable = (repository, branch, itemName, item) => {
  const downloads = [];
  const currentItem = {
    metadata: false,
    name: itemName
  };

  if (item.configFile) {
    downloads.push(downloadFile(repository, branch, item.configFile)
      .then(file => {
        currentItem.configFile = file.contents;
      }));
  }

  if (item.metadataFile) {
    downloads.push(downloadFile(repository, branch, item.metadataFile)
      .then(file => {
        currentItem.metadata = true;
        currentItem.metadataFile = file.contents;
      }));
  }

  return Promise.all(downloads).then(() => currentItem);
};

/*
 * Get all html templates - emails/pages.
 */
const getHtmlTemplates = (repository, branch, files, dir, allowedNames) => {
  const templates = utils.getTplFiles(files, dir, allowedNames);

  return Promise.map(Object.keys(templates), (tplName) =>
    downloadTemplate(repository, branch, tplName, templates[tplName]), { concurrency: 2 });
};


/*
 * Get email provider.
 */
const getEmailProvider = (repository, branch, files) =>
  downloadConfigurable(
    repository,
    branch,
    'emailProvider',
    { configFile: _.find(files, f => utils.isEmailProvider(f.path)) }
    );

/*
 * Get all configurables (resource servers / clients).
 */
const getConfigurables = (repository, branch, files, directory) => {
  const configurables = utils.getConfigurablesFiles(files, directory);

  return Promise.map(Object.keys(configurables), (key) =>
    downloadConfigurable(repository, branch, key, configurables[key]), { concurrency: 2 });
};

/*
 * Get a list of all changes that need to be applied to rules and database scripts.
 */
export const getChanges = ({ repository, branch, sha }) =>
  getTree(repository, branch, sha)
    .then(files => {
      logger.debug(`Files in tree: ${JSON.stringify(files.map(file => ({
        path: file.path,
        sha: file.sha
      })), null, 2)}`);

      const promises = {
        rules: getRules(repository, branch, files),
        databases: getDatabaseData(repository, branch, files),
        emailProvider: getEmailProvider(repository, branch, files),
        emailTemplates: getHtmlTemplates(repository, branch, files, constants.EMAIL_TEMPLATES_DIRECTORY, constants.EMAIL_TEMPLATES_NAMES),
        pages: getHtmlTemplates(repository, branch, files, constants.PAGES_DIRECTORY, constants.PAGE_NAMES),
        clients: getConfigurables(repository, branch, files, constants.CLIENTS_DIRECTORY),
        clientGrants: getConfigurables(repository, branch, files, constants.CLIENTS_GRANTS_DIRECTORY),
        connections: getConfigurables(repository, branch, files, constants.CONNECTIONS_DIRECTORY),
        rulesConfigs: getConfigurables(repository, branch, files, constants.RULES_CONFIGS_DIRECTORY),
        resourceServers: getConfigurables(repository, branch, files, constants.RESOURCE_SERVERS_DIRECTORY)
      };

      return Promise.props(promises)
        .then((result) => utils.unifyData(result));
    });

export const getOptions = utils.getOptions;
