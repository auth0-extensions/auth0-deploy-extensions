import React, { Component } from 'react';

export default class Help extends Component {
  render() {
    return (
      <div>
        <h5>Usage</h5>
        <p>
          {`Pages, Rules and Database Connection scripts can automatically be deployed from a ${window.config.A0EXT_PROVIDER} repository to an Auth0 account by using a specific convention.`}
          The details are available in <a href="https://github.com/auth0-samples/github-source-control-integration">a repository with sample scripts</a>.
        </p>
      </div>
    );
  }
}
