import React, { PropTypes, Component } from 'react';
import connectContainer from 'redux-static';
import { Error, LoadingPanel } from 'auth0-extension-ui';

import { resourceServerActions } from '../actions';
import ConfigurationTable from '../components/ConfigurationTable';

export default connectContainer(class extends Component {
  static stateToProps = (state) => ({
    resourceServers: state.resourceServers.get('records'),
    loading: state.resourceServers.get('loading'),
    error: state.resourceServers.get('error'),
    showNotification: state.resourceServers.get('showNotification'),
    notificationType: state.resourceServers.get('notificationType')
  });

  static actionsToProps = {
    ...resourceServerActions
  }

  static propTypes = {
    resourceServers: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object.isRequired,
    fetchAllResourceServers: PropTypes.func.isRequired,
    updateResourceServers: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.fetchAllResourceServers();
  }

  render() {
    const resourceServers = this.props.resourceServers;
    const loading = this.props.loading;
    const error = this.props.error;

    return (
      <div>
        <LoadingPanel show={loading} animationStyle={{ paddingTop: '5px', paddingBottom: '5px' }}>
          <div className="row">
            <div className="col-xs-12">
              <Error message={error} />
              <ConfigurationTable
                type="Resource Servers"
                items={resourceServers}
                loading={loading}
                error={error}
                saveManualItems={this.props.updateResourceServers}
                openNotification={this.props.openNotification}
                closeNotification={this.props.closeNotification}
                showNotification={this.props.showNotification}
                notificationType={this.props.notificationType}
              />
            </div>
          </div>
        </LoadingPanel>
      </div>
    );
  }
});
