import _ from 'lodash';
import Promise from 'bluebird';
import { constants } from 'auth0-source-control-extension-tools';

import BitbucketApi from './bitbucketApi';
import config from '../config';
import logger from '../logger';
import utils from '../utils';


const bitbucket = () =>
  new BitbucketApi({
    user_name: config('USER'),
    password: config('PASSWORD'),
    rest_base: 'https://api.bitbucket.org/',
    rest_version: '2.0'
  });

const checkRepo = (repository) => {
  const { user, repo } = utils.parseRepo(repository);

  return bitbucket()
    .get('repositories/{username}/{repo_slug}', { username: user, repo_slug: repo })
    .then(() => ({ user, repo }));
};

/*
 * Get pages tree.
 */
const getTreeByDir = (params, dir) =>
  bitbucket()
    .getTree(`repositories/{username}/{repo_slug}/src/{revision}/${utils.getBaseDir()}${dir}`, params)
    .then(res => {
      if (!res) {
        return [];
      }

      const files = res.filter(f => utils.validFilesOnly(f.path));

      files.forEach((elem, idx) => {
        files[idx].path = elem.path;
      });

      return files;
    });

/*
 * Get connection files for one db connection
 */
const getDBConnectionTreeByPath = (params, filePath) =>
  bitbucket()
    .getTree(`repositories/{username}/{repo_slug}/src/{revision}/${filePath}`, params)
    .then(res => {
      if (!res) {
        return [];
      }

      const files = res.filter(f => utils.validFilesOnly(f.path));

      files.forEach((elem, idx) => {
        files[idx].path = elem.path;
      });

      return files;
    });

/*
 * Get all files for all database-connections.
 */
const getDBConnectionsTree = (params) => {
  const dbPath = `repositories/{username}/{repo_slug}/src/{revision}/${utils.getBaseDir()}${constants.DATABASE_CONNECTIONS_DIRECTORY}`;
  return bitbucket()
    .getTree(dbPath, params)
    .then(res => {
      if (!res) {
        return [];
      }

      const subdirs = res.filter(item => item.type === 'commit_directory');
      const promisses = [];
      let files = [];

      _.forEach(subdirs, (dir) => {
        promisses.push(getDBConnectionTreeByPath(params, dir.path).then(data => {
          files = files.concat(data);
        }));
      });

      return Promise.all(promisses)
        .then(() => files);
    });
};

/*
 * Get tree.
 */
const getTree = (parsedRepo, branch, sha) => {
  const { user, repo } = parsedRepo;

  const params = {
    username: user,
    repo_slug: repo,
    revision: sha
  };
  const promises = {
    databases: getDBConnectionsTree(params),
    tenant: getTreeByDir(params, ''),
    rules: getTreeByDir(params, constants.RULES_DIRECTORY),
    pages: getTreeByDir(params, constants.PAGES_DIRECTORY),
    roles: getTreeByDir(params, constants.ROLES_DIRECTORY),
    emails: getTreeByDir(params, constants.EMAIL_TEMPLATES_DIRECTORY),
    clientGrants: getTreeByDir(params, constants.CLIENTS_GRANTS_DIRECTORY),
    connections: getTreeByDir(params, constants.CONNECTIONS_DIRECTORY),
    clients: getTreeByDir(params, constants.CLIENTS_DIRECTORY),
    rulesConfigs: getTreeByDir(params, constants.RULES_CONFIGS_DIRECTORY),
    resourceServers: getTreeByDir(params, constants.RESOURCE_SERVERS_DIRECTORY)
  };
  return Promise.props(promises)
    .then((result) => (_.union(
      result.rules,
      result.databases,
      result.tenant,
      result.emails,
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
const downloadFile = (parsedRepo, branch, file, shaToken) => {
  const { user, repo } = parsedRepo;
  const params = {
    username: user,
    repo_slug: repo,
    filename: file.path,
    revision: shaToken
  };

  const url = 'repositories/{username}/{repo_slug}/src/{revision}/{filename}';
  return bitbucket()
    .get(url, params)
    .then(data => ({
      fileName: file.path,
      contents: data
    }));
};


/*
 * Download a single rule with its metadata.
 */
const downloadRule = (parsedRepo, branch, ruleName, rule, shaToken) => {
  const currentRule = {
    script: false,
    metadata: false,
    name: ruleName
  };

  const downloads = [];

  if (rule.script) {
    downloads.push(downloadFile(parsedRepo, branch, rule.scriptFile, shaToken)
      .then(file => {
        currentRule.script = true;
        currentRule.scriptFile = file.contents;
      }));
  }

  if (rule.metadata) {
    downloads.push(downloadFile(parsedRepo, branch, rule.metadataFile, shaToken)
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
const downloadConfigurable = (parsedRepo, branch, name, item, shaToken) => {
  const downloads = [];
  const currentItem = {
    metadata: false,
    name
  };

  if (item.configFile) {
    downloads.push(downloadFile(parsedRepo, branch, item.configFile, shaToken)
      .then(file => {
        currentItem.configFile = file.contents;
      }));
  }

  if (item.metadataFile) {
    downloads.push(downloadFile(parsedRepo, branch, item.metadataFile, shaToken)
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
const getRules = (parsedRepo, branch, files, shaToken) => {
  const rules = utils.getRulesFiles(files);

  // Download all rules.
  return Promise.map(Object.keys(rules), (ruleName) =>
    downloadRule(parsedRepo, branch, ruleName, rules[ruleName], shaToken), { concurrency: 2 });
};

/*
 * Try to download tenant settings.
 */
const getTenant = (parsedRepo, branch, files, shaToken) => {
  const tenantFile = { configFile: _.find(files, f => utils.isTenantFile(f.path)) };
  return downloadConfigurable(parsedRepo, branch, 'tenant', tenantFile, shaToken);
};

/*
 * Get email provider.
 */
const getEmailProvider = (parsedRepo, branch, files, shaToken) => {
  const providerFile = { configFile: _.find(files, f => utils.isEmailProvider(f.path)) };
  return downloadConfigurable(parsedRepo, branch, 'emailProvider', providerFile, shaToken);
};

/*
 * Determine if we have the script, the metadata or both.
 */
const getConfigurables = (parsedRepo, branch, files, shaToken, directory) => {
  const configurables = utils.getConfigurablesFiles(files, directory);

  // Download all rules.
  return Promise.map(Object.keys(configurables), (key) =>
    downloadConfigurable(parsedRepo, branch, key, configurables[key], shaToken), { concurrency: 2 });
};

/*
 * Download a single database script.
 */
const downloadDatabaseScript = (parsedRepo, branch, databaseName, scripts, shaToken) => {
  const database = {
    name: databaseName,
    scripts: []
  };

  const downloads = [];
  scripts.forEach(script => {
    downloads.push(downloadFile(parsedRepo, branch, script, shaToken)
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
const getDatabaseData = (parsedRepo, branch, files, shaToken) => {
  const databases = utils.getDatabaseFiles(files);

  return Promise.map(Object.keys(databases), (databaseName) =>
    downloadDatabaseScript(parsedRepo, branch, databaseName, databases[databaseName], shaToken), { concurrency: 2 });
};

/*
 * Download a single page script.
 */
const downloadTemplate = (parsedRepo, branch, tplName, template, shaToken) => {
  const downloads = [];
  const currentTpl = {
    metadata: false,
    name: tplName
  };

  if (template.file) {
    downloads.push(downloadFile(parsedRepo, branch, template.file, shaToken)
      .then(file => {
        currentTpl.htmlFile = file.contents;
      }));
  }

  if (template.meta_file) {
    downloads.push(downloadFile(parsedRepo, branch, template.meta_file, shaToken)
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
const getHtmlTemplates = (parsedRepo, branch, files, shaToken, dir, allowedNames) => {
  const templates = utils.getTplFiles(files, dir, allowedNames);

  return Promise.map(Object.keys(templates), (name) =>
    downloadTemplate(parsedRepo, branch, name, templates[name], shaToken), { concurrency: 2 });
};

/*
 * Get a list of all changes that need to be applied to rules and database scripts.
 */
export function getChanges({ repository, branch, sha }) {
  return checkRepo(repository)
    .then((parsedRepo) => getTree(parsedRepo, branch, sha)
      .then(files => {
        logger.debug(`Files in tree: ${JSON.stringify(files.map(file => ({
          path: file.path,
          sha: file.path
        })), null, 2)}`);

        const promises = {
          tenant: getTenant(parsedRepo, branch, files, sha),
          rules: getRules(parsedRepo, branch, files, sha),
          databases: getDatabaseData(parsedRepo, branch, files, sha),
          emailProvider: getEmailProvider(parsedRepo, branch, files, sha),
          emailTemplates: getHtmlTemplates(parsedRepo, branch, files, sha, constants.EMAIL_TEMPLATES_DIRECTORY, constants.EMAIL_TEMPLATES_NAMES),
          pages: getHtmlTemplates(parsedRepo, branch, files, sha, constants.PAGES_DIRECTORY, constants.PAGE_NAMES),
          roles: getConfigurables(parsedRepo, branch, files, sha, constants.ROLES_DIRECTORY),
          clients: getConfigurables(parsedRepo, branch, files, sha, constants.CLIENTS_DIRECTORY),
          clientGrants: getConfigurables(parsedRepo, branch, files, sha, constants.CLIENTS_GRANTS_DIRECTORY),
          connections: getConfigurables(parsedRepo, branch, files, sha, constants.CONNECTIONS_DIRECTORY),
          rulesConfigs: getConfigurables(parsedRepo, branch, files, sha, constants.RULES_CONFIGS_DIRECTORY),
          resourceServers: getConfigurables(parsedRepo, branch, files, sha, constants.RESOURCE_SERVERS_DIRECTORY)
        };

        return Promise.props(promises)
          .then(result => utils.unifyData(result));
      }));
}

export const getOptions = utils.getOptions;
