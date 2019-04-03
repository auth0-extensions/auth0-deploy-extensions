import _ from 'lodash';
import axios from 'axios';

export default class Bitbucket {
  constructor(options) {
    if (!(this instanceof Bitbucket)) {
      return new Bitbucket(options);
    }

    this.options = Object.assign({
      user_name: null,
      password: null,
      rest_base: '',
      rest_version: '',
      rest_path: '',
      request_options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }, options);

    this.request = (opts, cb) =>
      axios({ ...opts, auth: { username: this.options.user_name, password: this.options.password } })
        .then(response => cb(null, response.data))
        .catch(cb);
  }
}

Bitbucket.prototype.buildEndpoint = function buildEndpoint(path, params) {
  let url = `${this.options.rest_base}${this.options.rest_path}${this.options.rest_version}/${path}`;

  _.forEach(params, (param, key) => {
    url = url.replace(`{${key}}`, param);
  });

  return {
    url,
    params
  };
};

Bitbucket.prototype.getAll = function getAll(options, callback) {
  const perPage = 100;
  const result = [];

  options.url = options.url + '?pagelen=' + perPage;

  const getPage = (url, cb) => {
    const pageOptions = { ...options };
    if (url) {
      pageOptions.url = url;
    }

    this.request(pageOptions, (error, data) => {
      if (error) {
        return cb(error);
      }

      data.values.forEach(item => result.push(item));

      if (data.next) {
        return getPage(data.next, cb);
      }

      return cb(null, result);
    });
  };

  return getPage(null, callback);
};

Bitbucket.prototype.doRequest = function doRequest(isTree, path, params, callback) {
  if (typeof params === 'function') {
    callback = params; // eslint-disable-line no-param-reassign
    params = {}; // eslint-disable-line no-param-reassign
  }

  const endpoint = this.buildEndpoint(path, params);

  const options = {
    method: 'get',
    url: endpoint.url
  };

  options.qs = endpoint.params;
  options.headers = this.options.request_options.headers;

  if (isTree) {
    return this.getAll(options, (error, data) => {
      if (error) {
        callback(error);
      } else {
        callback(null, data);
      }
    });
  }

  return this.request(options, (error, data) => {
    if (error) {
      callback(error);
    } else {
      callback(null, data);
    }
  });
};

Bitbucket.prototype.getTree = function getTree(url, params, callback) {
  return this.doRequest(true, url, params, callback);
};

Bitbucket.prototype.get = function get(url, params, callback) {
  return this.doRequest(false, url, params, callback);
};
