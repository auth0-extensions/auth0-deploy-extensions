import React, { PropTypes, Component } from 'react';
import connectContainer from 'redux-static';
import { Error } from 'auth0-extension-ui';

import { configActions, closeNotification } from '../actions';

import Help from '../components/Help';
import WebhookSettings from '../components/WebhookSettings';
import NotificationDialog from '../components/NotificationDialog';

export default connectContainer(class extends Component {
  static stateToProps = (state) => ({
    config: state.config
  });

  static actionsToProps = {
    ...configActions,
    ...closeNotification
  }

  static propTypes = {
    config: PropTypes.object.isRequired,
    fetchConfiguration: PropTypes.func.isRequired,
    closeNotification: PropTypes.func.isRequired,
    confirmNotification: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.fetchConfiguration();
  }

  render() {
    const { error, record, showNotification } = this.props.config.toJS();

    return (
      <div>
        <NotificationDialog
          show={showNotification}
          onClose={this.props.closeNotification}
          onConfirm={this.props.confirmNotification}
        />
        <div className="row">
          <div className="col-xs-12">
            <Error message={error} />
            <WebhookSettings payloadUrl={`${window.config.BASE_URL}/webhooks/deploy`} repository={record.repository} branch={record.branch} secret={record.secret} prefix={record.prefix} />
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <Help />
          </div>
        </div>
      </div>
    );
  }
});
