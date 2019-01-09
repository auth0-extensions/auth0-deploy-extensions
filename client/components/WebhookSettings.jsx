import React, { Component } from 'react';

const templates = {
  bitbucket: ({ payloadUrl, repository, branch, secret }) => {
    return (
      <div>
        <h5>Webhook Settings</h5>
        <p>A webhook has to be created in <strong><a href={`https://bitbucket.org/${repository}/admin/addon/admin/bitbucket-webhooks/bb-webhooks-repo-admin`}>{repository}</a></strong> with the following settings to enable deployments from Bitbucket (<strong>{branch}</strong> branch).</p>
        <form className="form-horizontal col-xs-9">
          <div className="form-group">
            <label className="col-xs-2 control-label">Payload URL</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={`${payloadUrl}/${secret}`} />
            </div>
          </div>
        </form>
      </div>
    );
  },
  visualstudio: ({ payloadUrl, secret, repository, branch, prefix }) => {
    return (
      <div>
        <h5>Webhook Settings</h5>
        <p>A webhook has to be created in <strong><a href={`https://${prefix}.visualstudio.com/${repository}/_admin/_apps/hub/ms.vss-servicehooks-web.manageServiceHooks-project`}>{repository}</a></strong> with the following settings to enable deployments from Visual Studio Team Services (<strong>{branch}</strong>).</p>
        <form className="form-horizontal col-xs-9">
          <div className="form-group">
            <label className="col-xs-2 control-label">Payload URL</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={payloadUrl} />
            </div>
          </div>
          <div className="form-group">
            <label className="col-xs-2 control-label">HTTP headers</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={`x-hook-secret:${secret}`} />
            </div>
          </div>
        </form>
      </div>
    );
  },
  github: ({ payloadUrl, secret, contentType, repository, branch }) => {
    return (
      <div>
        <h5>Webhook Settings</h5>
        <p>A webhook has to be created in <strong><a href={`https://github.com/${repository}/settings/hooks`}>{repository}</a></strong> with the following settings to enable deployments from GitHub (<strong>{branch}</strong> branch).</p>
        <form className="form-horizontal col-xs-9">
          <div className="form-group">
            <label className="col-xs-2 control-label">Payload URL</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={payloadUrl} />
            </div>
          </div>
          <div className="form-group">
            <label className="col-xs-2 control-label">Content Type</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={contentType} />
            </div>
          </div>
          <div className="form-group">
            <label className="col-xs-2 control-label">Secret</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={secret} />
            </div>
          </div>
        </form>
      </div>
    );
  },
  gitlab: ({ payloadUrl, secret, repository, branch }) => {
    return (
      <div>
        <h5>Webhook Settings</h5>
        <p>A webhook has to be created in <strong><a href={`https://gitlab.com/${repository}/settings/integrations`}>{repository}</a></strong> with the following settings to enable deployments from GitLab (<strong>{branch}</strong> branch).</p>
        <form className="form-horizontal col-xs-9">
          <div className="form-group">
            <label className="col-xs-2 control-label">Payload URL</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={payloadUrl} />
            </div>
          </div>
          <div className="form-group">
            <label className="col-xs-2 control-label">Secret</label>
            <div className="col-xs-9">
              <input type="text" readOnly="readonly" className="form-control" value={secret} />
            </div>
          </div>
        </form>
      </div>
    );
  }
};

export default class WebhookSettings extends Component {
  static defaultProps = {
    repository: '',
    branch: '',
    payloadUrl: 'N/A',
    secret: '',
    prefix: '',
    contentType: 'application/json'
  };

  static propTypes = {
    payloadUrl: React.PropTypes.string,
    contentType: React.PropTypes.string,
    secret: React.PropTypes.string,
    prefix: React.PropTypes.string,
    repository: React.PropTypes.string,
    branch: React.PropTypes.string
  };

  render() {
    return templates[window.config.A0EXT_PROVIDER](this.props);
  }
}
