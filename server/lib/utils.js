import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import { ArgumentError } from 'auth0-extension-tools';
import { keywordReplace, constants } from 'auth0-source-control-extension-tools';

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
 * Check if a file is the tenant settings file.
 */
const isTenantFile = (file) =>
  file === path.join(getPrefix(), 'tenant.json');

/*
 * Check if a file is the email provider file.
 */
const isEmailProvider = (file) =>
  file === path.join(getPrefix(), constants.EMAIL_TEMPLATES_DIRECTORY, 'provider.json');

/*
 * Check if a file is the guardian file.
 */
const isGuardianFile = (file) => {
  const guardianDir = path.join(getPrefix(), constants.GUARDIAN_DIRECTORY);
  const isJSON = file.endsWith('.json');
  const isGuardian = file.startsWith(path.join(guardianDir, constants.GUARDIAN_FACTORS_DIRECTORY))
    || file.startsWith(path.join(guardianDir, constants.GUARDIAN_PROVIDERS_DIRECTORY))
    || file.startsWith(path.join(guardianDir, constants.GUARDIAN_TEMPLATES_DIRECTORY));

  return isJSON && isGuardian;
}

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
  } else if (isTenantFile(fileName)) {
    return true;
  } else if (isEmailProvider(fileName)) {
    return true;
  } else if (isGuardianFile(fileName)) {
    return true;
  } else if (isRule(fileName)) {
    return /\.(js|json)$/i.test(fileName);
  } else if (isConfigurable(fileName, constants.ROLES_DIRECTORY)) {
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

const extractFileContent = (item = {}, mappings, asString) => {
  const content = (typeof item === 'object') ? JSON.stringify(item) : item;
  const converted = keywordReplace(content, mappings);

  if (asString) {
    return converted;
  }

  try {
    return JSON.parse(converted);
  } catch (e) {
    logger.info(`Cannot extract data from:\n${item}\nError:${e}`);
    return item;
  }
};

const checkSessionLifetime = (data, property) => {
  const hours = data[property];
  if (hours !== undefined && !Number.isInteger(hours)) {
    data[`${property}_in_minutes`] = Math.round(hours * 60);
    delete data[property];
  }
};

const unifyItem = (item, type, mappings) => {
  switch (type) {
    default:
    case 'rules': {
      const meta = extractFileContent(item.metadataFile, mappings);
      const script = extractFileContent(item.scriptFile, mappings, true);
      const { order = 0, enabled, stage = 'login_success' } = meta;

      return ({ script, name: item.name, order, stage, enabled });
    }
    case 'pages': {
      const meta = extractFileContent(item.metadataFile, mappings);
      const html = extractFileContent(item.htmlFile, mappings, true);
      const { enabled } = meta;

      return ({ html, name: item.name, enabled });
    }

    case 'emailTemplates': {
      if (item.name === 'provider') return null;
      const meta = extractFileContent(item.metadataFile, mappings);
      const body = extractFileContent(item.htmlFile, mappings, true);

      return ({ ...meta, body });
    }
    case 'roles':
    case 'clientGrants':
    case 'guardianFactors':
    case 'guardianFactorTemplates':
    case 'guardianFactorProviders':
    case 'emailProvider': {
      const data = extractFileContent(item.configFile, mappings);

      return ({ ...data });
    }

    case 'tenant': {
      const data = extractFileContent(item.configFile, mappings);
      checkSessionLifetime(data, 'session_lifetime');
      checkSessionLifetime(data, 'idle_session_lifetime');

      return ({ ...data });
    }

    case 'databases': {
      const settings = extractFileContent(item.settings, mappings);
      const customScripts = {};
      const options = settings.options || {};

      _.forEach(item.scripts, (script) => { customScripts[script.name] = extractFileContent(script.scriptFile, mappings, true); });

      if (item.scripts && item.scripts.length && options.enabledDatabaseCustomization !== false) {
        options.customScripts = customScripts;
        options.enabledDatabaseCustomization = true;
      }

      return ({ ...settings, options, strategy: 'auth0', name: item.name });
    }

    case 'resourceServers':
    case 'connections':
    case 'clients': {
      const meta = extractFileContent(item.metadataFile, mappings);
      const data = extractFileContent(item.configFile, mappings);

      return ({ name: item.name, ...meta, ...data });
    }

    case 'rulesConfigs': {
      const data = extractFileContent(item.configFile, mappings);

      return ({ key: item.name, value: data.value });
    }
  }
};

const unifyData = (assets, mappings) => {
  const result = {};

  _.forEach(assets, (data, type) => {
    result[type] = [];
    if (Array.isArray(data)) {
      _.forEach(data, (item) => {
        const unified = unifyItem(item, type, mappings);
        if (unified) result[type].push(unified);
      });
    } else {
      result[type] = unifyItem(data, type, mappings);
    }
  });

  _.forEach(result, (asset, name) => {
    if (Array.isArray(asset) && asset.length === 0) {
      result[name] = null;
      delete result[name];
    }
  });

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
  isTenantFile,
  isGuardianFile,
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
