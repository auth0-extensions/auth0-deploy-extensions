import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import { Octokit } from '@octokit/rest';
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
const getTree = (github, repository, branch, sha) =>
  new Promise((resolve, reject) => {
    try {
      logger.log('Repository: ', repository);
      logger.log('Branch: ', branch);
      logger.log('Sha: ', sha);

      const { user, repo } = utils.parseRepo(repository);
      github.git.getTree({ owner: user, repo, tree_sha: sha || branch, recursive: true }).then(({ data }) => {
        try {
          const files = data.tree
            .filter(f => f.type === 'blob')
            .filter(f => utils.validFilesOnly(f.path));
          return resolve(files);
        } catch (mappingError) {
          return reject(mappingError);
        }
      }).catch(err => {
        return reject(err);
      });
    } catch (e) {
      logger.error(e);
      reject(e);
    }
  });

/*
 * Download a single file.
 */
const downloadFile = (github, repository, branch, file) => {
  const { user, repo } = utils.parseRepo(repository);

  return github.git.getBlob({
    owner: user,
    file_sha: file.sha,
    repo
  }).then(({ data }) => ({
    fileName: file.path,
    contents: data.content
  })
  ).catch(err => {
    logger.error(`Error downloading '${file.sha}'`);
    logger.error(err);
    throw err;
  });
};

/*
 * Download a single rule with its metadata.
 */
const downloadRule = (github, repository, branch, ruleName, rule) => {
  const currentRule = {
    script: false,
    metadata: false,
    name: ruleName
  };

  const downloads = [];

  if (rule.script) {
    downloads.push(downloadFile(github, repository, branch, rule.scriptFile)
      .then(file => {
        currentRule.script = true;
        currentRule.scriptFile = file.contents;
      }));
  }

  if (rule.metadata) {
    downloads.push(downloadFile(github, repository, branch, rule.metadataFile)
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
const getHooksOrRules = (github, repository, branch, files, dir) => {
  const rules = utils.getHooksOrRulesFiles(files, dir);

  // Download all rules.
  return Promise.map(Object.keys(rules), (ruleName) =>
    downloadRule(github, repository, branch, ruleName, rules[ruleName]), { concurrency: 2 });
};

/*
 * Download a single database script.
 */
const downloadDatabaseScript = (github, repository, branch, databaseName, scripts) => {
  const database = {
    name: databaseName,
    scripts: []
  };

  const downloads = [];
  scripts.forEach(script => {
    downloads.push(downloadFile(github, repository, branch, script)
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
const getDatabaseData = (github, repository, branch, files) => {
  const databases = utils.getDatabaseFiles(files);

  return Promise.map(Object.keys(databases), (databaseName) =>
      downloadDatabaseScript(github, repository, branch, databaseName, databases[databaseName]),
    { concurrency: 2 });
};

/*
 * Download a single page or email script.
 */
const downloadTemplate = (github, repository, branch, tplName, template, shaToken) => {
  const downloads = [];
  const currentPage = {
    metadata: false,
    name: tplName
  };

  if (template.file) {
    downloads.push(downloadFile(github, repository, branch, template.file, shaToken)
      .then(file => {
        currentPage.htmlFile = file.contents;
      }));
  }

  if (template.meta_file) {
    downloads.push(downloadFile(github, repository, branch, template.meta_file, shaToken)
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
const downloadConfigurable = (github, repository, branch, itemName, item) => {
  const downloads = [];
  const currentItem = {
    metadata: false,
    name: itemName
  };

  if (item.configFile) {
    downloads.push(downloadFile(github, repository, branch, item.configFile)
      .then(file => {
        currentItem.configFile = file.contents;
      }));
  }

  if (item.metadataFile) {
    downloads.push(downloadFile(github, repository, branch, item.metadataFile)
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
const getHtmlTemplates = (github, repository, branch, files, dir, allowedNames) => {
  const templates = utils.getTplFiles(files, dir, allowedNames);

  return Promise.map(Object.keys(templates), (tplName) =>
    downloadTemplate(github, repository, branch, tplName, templates[tplName]), { concurrency: 2 });
};


/*
 * Get email provider.
 */
const getEmailProvider = (github, repository, branch, files) =>
  downloadConfigurable(
    github,
    repository,
    branch,
    'emailProvider',
    { configFile: _.find(files, f => utils.isEmailProvider(f.path)) }
    );

/*
 * Get tenant settings.
 */
const getTenant = (github, repository, branch, files) =>
  downloadConfigurable(
    github,
    repository,
    branch,
    'tenant',
    { configFile: _.find(files, f => utils.isTenantFile(f.path)) }
    );

/*
 * Get all configurables (resource servers / clients).
 */
const getConfigurables = (github, repository, branch, files, directory) => {
  const configurables = utils.getConfigurablesFiles(files, directory);

  return Promise.map(Object.keys(configurables), (key) =>
    downloadConfigurable(github, repository, branch, key, configurables[key]), { concurrency: 2 });
};

/*
 * Get a list of all changes that need to be applied to rules and database scripts.
 */
export const getChanges = ({ repository, branch, sha, mappings }) => {
  const github = new Octokit({
    auth: config('TOKEN'),
    userAgent: 'Auth0 Github Deploy Extension',
    baseUrl: config('BASE_URL')
  });
  return getTree(github, repository, branch, sha)
    .then(files => {
      logger.debug(`Files in tree: ${JSON.stringify(files.map(file => ({
        path: file.path,
        sha: file.sha
      })), null, 2)}`);

      const promises = {
        rules: getHooksOrRules(github, repository, branch, files, constants.RULES_DIRECTORY),
        hooks: getHooksOrRules(github, repository, branch, files, constants.HOOKS_DIRECTORY),
        tenant: getTenant(github, repository, branch, files),
        databases: getDatabaseData(github, repository, branch, files),
        emailProvider: getEmailProvider(github, repository, branch, files),
        emailTemplates: getHtmlTemplates(github, repository, branch, files, constants.EMAIL_TEMPLATES_DIRECTORY, constants.EMAIL_TEMPLATES_NAMES),
        guardianFactors: getConfigurables(github, repository, branch, files, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_FACTORS_DIRECTORY)),
        guardianFactorTemplates: getConfigurables(github, repository, branch, files, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_TEMPLATES_DIRECTORY)),
        guardianFactorProviders: getConfigurables(github, repository, branch, files, path.join(constants.GUARDIAN_DIRECTORY, constants.GUARDIAN_PROVIDERS_DIRECTORY)),
        pages: getHtmlTemplates(github, repository, branch, files, constants.PAGES_DIRECTORY, constants.PAGE_NAMES),
        roles: getConfigurables(github, repository, branch, files, constants.ROLES_DIRECTORY),
        clients: getConfigurables(github, repository, branch, files, constants.CLIENTS_DIRECTORY),
        clientGrants: getConfigurables(github, repository, branch, files, constants.CLIENTS_GRANTS_DIRECTORY),
        connections: getConfigurables(github, repository, branch, files, constants.CONNECTIONS_DIRECTORY),
        rulesConfigs: getConfigurables(github, repository, branch, files, constants.RULES_CONFIGS_DIRECTORY),
        resourceServers: getConfigurables(github, repository, branch, files, constants.RESOURCE_SERVERS_DIRECTORY)
      };

      return Promise.props(promises)
        .then((result) => utils.unifyData(result, mappings));
    });
};

export const getOptions = utils.getOptions;
