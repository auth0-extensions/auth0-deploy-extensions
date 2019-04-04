import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import { ArgumentError } from 'auth0-extension-tools';
import { constants } from 'auth0-source-control-extension-tools';

import Cipher from './cipher';
import config from './config';
import logger from './logger';

const getBaseDir = () => {
  let baseDir = config('BASE_DIR') || '';
  if (baseDir.startsWith('/')) baseDir = baseDir.slice(1);
  if (baseDir !== '' && !baseDir.endsWith('/')) baseDir += '/';
  return baseDir;
};

const getPrefix = () =>
  (config('TYPE') === 'tfvc' ? config('PROJECT_PATH') : getBaseDir());

/*
 * Check if a file is part of the rules folder.
 */
const isRule = (file) =>
  file.indexOf(`${path.join(getPrefix(), constants.RULES_DIRECTORY)}/`) === 0;

/*
 * Check if a file is part of the database folder.
 */
const isDatabaseConnection = (file) =>
  file.indexOf(`${path.join(getPrefix(), constants.DATABASE_CONNECTIONS_DIRECTORY)}/`) === 0;

/*
 * Check if a file is part of the templates folder - emails or pages.
 */
const isTemplate = (file, dir, allowedNames) =>
  file.indexOf(`${path.join(getPrefix(), dir)}/`) === 0 && allowedNames.indexOf(file.split('/').pop()) >= 0;

/*
 * Check if a file is part of the pages folder.
 */
const isEmailProvider = (file) =>
  file === path.join(getPrefix(), constants.EMAIL_TEMPLATES_DIRECTORY, 'provider.json');

/*
 * Check if a file is part of configurable folder.
 */
const isConfigurable = (file, directory) =>
  file.indexOf(`${path.join(getPrefix(), directory)}/`) === 0;

/*
 * Get the details of a database file script.
 */
const getDatabaseScriptDetails = (filename) => {
  if (config('TYPE') === 'tfvc') {
    filename = filename.replace(`${config('PROJECT_PATH')}/`, '');
  }

  const parts = filename.split('/');
  const length = parts.length;
  if (length >= 3 && /\.js$/i.test(parts[length - 1])) {
    const scriptName = path.parse(parts[length - 1]).name;
    if (constants.DATABASE_SCRIPTS.indexOf(scriptName) > -1) {
      return {
        database: parts[length - 2],
        name: path.parse(scriptName).name
      };
    }
  }

  return null;
};

const getDatabaseSettingsDetails = (filename) => {
  if (config('TYPE') === 'tfvc') {
    filename = filename.replace(`${config('PROJECT_PATH')}/`, '');
  }

  const parts = filename.split('/');
  const length = parts.length;
  if (length >= 3 && parts[length - 1] === 'settings.json') {
    return {
      database: parts[length - 2],
      name: 'settings'
    };
  }
  return null;
};

/*
 * Only Javascript and JSON files.
 */
const validFilesOnly = (fileName) => {
  if (isTemplate(fileName, constants.PAGES_DIRECTORY, constants.PAGE_NAMES)) {
    return true;
  } else if (isTemplate(fileName, constants.EMAIL_TEMPLATES_DIRECTORY, constants.EMAIL_TEMPLATES_NAMES)) {
    return true;
  } else if (isEmailProvider(fileName)) {
    return true;
  } else if (isRule(fileName)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isConfigurable(fileName, constants.CLIENTS_DIRECTORY)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isConfigurable(fileName, constants.CLIENTS_GRANTS_DIRECTORY)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isConfigurable(fileName, constants.CONNECTIONS_DIRECTORY)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isConfigurable(fileName, constants.RESOURCE_SERVERS_DIRECTORY)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isConfigurable(fileName, constants.RULES_CONFIGS_DIRECTORY)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isDatabaseConnection(fileName)) {
    const script = !!getDatabaseScriptDetails(fileName);
    const settings = !!getDatabaseSettingsDetails(fileName);
    return script || settings;
  }

  return false;
};

const getDatabaseFiles = (files) => {
  const databases = {};

  _.filter(files, f => isDatabaseConnection(f.path)).forEach(file => {
    const script = getDatabaseScriptDetails(file.path);
    const settings = getDatabaseSettingsDetails(file.path);

    if (script) {
      databases[script.database] = databases[script.database] || [];
      databases[script.database].push({
        ...script,
        id: file.id,
        sha: file.sha,
        path: file.path
      });
    }

    if (settings) {
      databases[settings.database] = databases[settings.database] || [];
      databases[settings.database].push({
        ...settings,
        id: file.id,
        sha: file.sha,
        path: file.path
      });
    }
  });

  return databases;
};

const getConfigurablesFiles = (files, directory) => {
  const configurables = {};

  _.filter(files, f => isConfigurable(f.path, directory)).forEach(file => {
    let meta = false;
    let name = path.parse(file.path).name;
    const ext = path.parse(file.path).ext;

    if (ext === '.json') {
      if (name.endsWith('.meta')) {
        name = path.parse(name).name;
        meta = true;
      }

      configurables[name] = configurables[name] || {};

      if (meta) {
        configurables[name].metadataFile = file;
      } else {
        configurables[name].configFile = file;
      }

      configurables[name].sha = file.sha;
      configurables[name].path = file.path;
    }
  });

  return configurables;
};

const getTplFiles = (files, directory, allowedNames) => {
  const templates = {};

  _.filter(files, f => isTemplate(f.path, directory, allowedNames)).forEach(file => {
    const tplName = path.parse(file.path).name;
    const ext = path.parse(file.path).ext;
    templates[tplName] = templates[tplName] || {};

    if (ext !== '.json') {
      templates[tplName].file = file;
      templates[tplName].sha = file.sha;
      templates[tplName].path = file.path;
    } else {
      templates[tplName].meta_file = file;
      templates[tplName].meta_sha = file.sha;
      templates[tplName].meta_path = file.path;
    }
  });

  return templates;
};

const getRulesFiles = (files) => {
  const rules = {};

  _.filter(files, f => isRule(f.path)).forEach(file => {
    const ruleName = path.parse(file.path).name;
    rules[ruleName] = rules[ruleName] || {};

    if (/\.js$/i.test(file.path)) {
      rules[ruleName].script = true;
      rules[ruleName].scriptFile = file;
    } else if (/\.json$/i.test(file.path)) {
      rules[ruleName].metadata = true;
      rules[ruleName].metadataFile = file;
    }
  });

  return rules;
};

const extractFileContent = (item) => {
  if (typeof item === 'string') {
    try {
      item = JSON.parse(item);
    } catch (e) {
      logger.info(`Cannot extract data from:\n${item}`);
    }
  }

  return item || {};
};

const unifyItem = (item, type) => {
  switch (type) {
    default:
    case 'rules': {
      const meta = extractFileContent(item.metadataFile);
      const { order = 0, enabled, stage = 'login_success' } = meta;

      return ({ script: item.scriptFile, name: item.name, order, stage, enabled });
    }
    case 'pages': {
      const meta = extractFileContent(item.metadataFile);
      const { enabled } = meta;

      return ({ html: item.htmlFile, name: item.name, enabled });
    }

    case 'emailTemplates': {
      if (item.name === 'provider') return null;
      const meta = extractFileContent(item.metadataFile);

      return ({ ...meta, body: item.htmlFile });
    }
    case 'clientGrants':
    case 'emailProvider': {
      const data = extractFileContent(item.configFile);

      return ({ ...data });
    }

    case 'databases': {
      const settings = extractFileContent(item.settings);
      const customScripts = {};
      const options = settings.options || {};

      _.forEach(item.scripts, (script) => { customScripts[script.name] = script.scriptFile; });

      if (item.scripts && item.scripts.length) {
        options.customScripts = customScripts;
        options.enabledDatabaseCustomization = true;
      }

      return ({ ...settings, options, strategy: 'auth0', name: item.name });
    }

    case 'resourceServers':
    case 'connections':
    case 'clients': {
      const meta = extractFileContent(item.metadataFile);
      const data = extractFileContent(item.configFile);

      return ({ name: item.name, ...meta, ...data });
    }

    case 'rulesConfigs': {
      const data = extractFileContent(item.configFile);

      return ({ key: item.name, value: data.value });
    }
  }
};

const unifyData = (assets) => {
  const result = {};

  _.forEach(assets, (data, type) => {
    result[type] = [];
    if (Array.isArray(data)) {
      _.forEach(data, (item) => {
        const unified = unifyItem(item, type);
        if (unified) result[type].push(unified);
      });
    } else {
      result[type] = unifyItem(data, type);
    }
  });

  if (config('ENABLE_CIPHER') === true || config('ENABLE_CIPHER') === 'true') {
    const cipher = new Cipher(config('CIPHER_PASSWORD'));
    return cipher.processData(result)
      .then(() => result);
  }

  return Promise.resolve(result);
};

/*
 * Parse the repository.
 */
const parseRepo = (repository = '') => {
  const parts = repository.split('/');
  if (parts.length === 2) {
    const [ user, repo ] = parts;
    return { user, repo };
  } else if (parts.length === 5) {
    const [ , , , user, repo ] = parts;
    return { user, repo };
  }

  throw new ArgumentError(`Invalid repository: ${repository}`);
};

/*
 * Get default options for manual deploy
 */
const getOptions = (req) =>
  new Promise((resolve) => {
    const { user, repo } = parseRepo(config('REPOSITORY'));
    const repository = `${user}/${repo}`;

    return resolve({
      id: 'manual',
      branch: config('BRANCH'),
      sha: (req.body && req.body.sha) || config('BRANCH'),
      user: req.user.sub,
      repository
    });
  });

module.exports = {
  unifyData,
  getBaseDir,
  getPrefix,
  isRule,
  isDatabaseConnection,
  isTemplate,
  isEmailProvider,
  isConfigurable,
  getDatabaseFiles,
  getConfigurablesFiles,
  getTplFiles,
  getRulesFiles,
  validFilesOnly,
  getOptions,
  parseRepo
};
