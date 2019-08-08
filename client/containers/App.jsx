import React, { Component } from 'react';
import { connect } from 'react-redux';

import { logout } from '../actions/auth';
import Header from '../components/Header';

import RequireAuthentication from './RequireAuthentication';
import { ConfigContainer, DeploymentsContainer, RulesContainer, ResourceServersContainer, MappingsContainer } from './';

class App extends Component {
  render() {
    const activeTab = this.props.activeTab;
    return (
      <div>
        <Header tenant={window.config.AUTH0_DOMAIN} onLogout={this.props.logout} />
        <div className="container">
          <div className="row">
            <section className="content-page current">
              <div className="col-xs-12">
                <div className="row">
                  <div className="col-xs-12 content-header">
                    <ol className="breadcrumb">
                      <li>
                        <a href={window.config.AUTH0_MANAGE_URL}>Auth0 Dashboard</a>
                      </li>
                      <li>
                        <a href={`${window.config.AUTH0_MANAGE_URL}/#/extensions`}>Extensions</a>
                      </li>
                    </ol>
                    <h1 className="pull-left" style={{ paddingTop: '10px', 'text-transform': 'capitalize' }}>{`${window.config.A0EXT_PROVIDER} integration`}</h1></div>
                </div>
                <div className="widget-title title-with-nav-bars">
                  <ul className="nav nav-tabs">
                    <li className={activeTab === 'config' ? 'active' : ''}>
                      <a data-toggle="tab" href="#config">
                        <span className="tab-title">
                          Configuration
                        </span>
                      </a>
                    </li>
                    <li className={activeTab === 'deployments' ? 'active' : ''}>
                      <a data-toggle="tab" href="#deployments">
                        <span className="tab-title">
                          Deployments
                        </span>
                      </a>
                    </li>
                    <li className={activeTab === 'rules' ? 'active' : ''}>
                      <a data-toggle="tab" href="#rules">
                        <span className="tab-title">
                          Rules Configuration
                        </span>
                      </a>
                    </li>
                    <li className={activeTab === 'resourceServers' ? 'active' : ''}>
                      <a data-toggle="tab" href="#resourceServers">
                        <span className="tab-title">
                          Resource Servers Configuration
                        </span>
                      </a>
                    </li>
                    <li className={activeTab === 'mappings' ? 'active' : ''}>
                      <a data-toggle="tab" href="#mappings">
                        <span className="tab-title">
                          Mappings
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>
                <div id="content-area" className="tab-content">
                  <div id="config" className={activeTab === 'config' ? 'tab-pane active' : 'tab-pane'}>
                    <ConfigContainer />
                  </div>
                  <div id="deployments" className={activeTab === 'deployments' ? 'tab-pane active' : 'tab-pane'}>
                    <DeploymentsContainer />
                  </div>
                  <div id="rules" className={activeTab === 'rules' ? 'tab-pane active' : 'tab-pane'}>
                    <RulesContainer />
                  </div>
                  <div id="resourceServers" className={activeTab === 'resourceServers' ? 'tab-pane active' : 'tab-pane'}>
                    <ResourceServersContainer />
                  </div>
                  <div id="mappings" className={activeTab === 'mappings' ? 'tab-pane active' : 'tab-pane'}>
                    <MappingsContainer />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }
}

function select(state) {
  return {
    user: state.auth.get('user'),
    issuer: state.auth.get('issuer'),
    activeTab: state.config.get('activeTab')
  };
}

export default RequireAuthentication(connect(select, { logout })(App));
