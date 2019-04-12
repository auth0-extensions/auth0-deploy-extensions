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

    this.request = (opts) =>
      axios({ ...opts, auth: { username: this.options.user_name, password: this.options.password } })
        .then(response => response.data);
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

Bitbucket.prototype.getAll = function getAll(options) {
  const perPage = 100;
  const result = [];

  options.url = options.url + '?pagelen=' + perPage;

  const getPage = (url) => {
    const pageOptions = { ...options };
    if (url) {
      pageOptions.url = url;
    }

    return this.request(pageOptions)
      .then(data => {
        data.values.forEach(item => result.push(item));

        if (data.next) {
          return getPage(data.next);
        }

        return result;
      });
  };

  return getPage();
};

Bitbucket.prototype.doRequest = function doRequest(isTree, path, params) {
  const endpoint = this.buildEndpoint(path, params);

  const options = {
    method: 'get',
    url: endpoint.url
  };

  options.qs = endpoint.params;
  options.headers = this.options.request_options.headers;

  if (isTree) {
    return this.getAll(options);
  }

  return this.request(options);
};

Bitbucket.prototype.getTree = function getTree(url, params) {
  return this.doRequest(true, url, params)
    .then(res => res)
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        return Promise.resolve([]);
      }

      return Promise.reject(err);
    });
};

Bitbucket.prototype.get = function get(url, params) {
  return this.doRequest(false, url, params);
};
