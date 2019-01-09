import React, { PropTypes, Component } from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';
import connectContainer from 'redux-static';
import { Error, LoadingPanel } from 'auth0-extension-ui';

import { deploymentActions } from '../actions';

import DeploymentsTable from '../components/DeploymentsTable';
import DeploymentLogsDialog from '../components/DeploymentLogsDialog';

export default connectContainer(class extends Component {
  static stateToProps = (state) => ({
    deployments: state.deployments
  });

  static actionsToProps = {
    ...deploymentActions
  }

  static propTypes = {
    deployments: PropTypes.object.isRequired,
    fetchDeployments: PropTypes.func.isRequired,
    runDeployment: PropTypes.func.isRequired,
    openDeployment: PropTypes.func.isRequired,
    clearDeployment: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.fetchDeployments();
  }

  runDeployment = (sha) => {
    this.props.runDeployment(sha)
      .then(() => this.props.fetchDeployments())
      .catch(() => this.props.fetchDeployments());
  }

  render() {
    const { error, records, loading, activeRecord } = this.props.deployments.toJS();

    return (
      <div>
        <LoadingPanel show={loading} animationStyle={{ paddingTop: '5px', paddingBottom: '5px' }}>
          <div className="row">
            <div className="col-xs-12">
              <ButtonToolbar className="pull-right">
                <Button bsSize="small" className="btn-primary" onClick={() => this.runDeployment()}>
                  <i className="icon icon-budicon-356" /> Deploy
                </Button>
                <Button bsSize="small" className="btn-default" onClick={this.props.fetchDeployments}>
                  <i className="icon icon-budicon-257" /> Reload
                </Button>
              </ButtonToolbar>
            </div>
            <div className="col-xs-12">
              <Error message={error} />
              <DeploymentsTable error={error} records={records} showLogs={this.props.openDeployment} deployChange={this.runDeployment} />
              <DeploymentLogsDialog deployment={activeRecord} onClose={this.props.clearDeployment} />
            </div>
          </div>
        </LoadingPanel>
      </div>
    );
  }
});
