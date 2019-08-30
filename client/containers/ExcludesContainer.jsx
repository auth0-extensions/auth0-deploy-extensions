import React, { PropTypes, Component } from 'react';
import connectContainer from 'redux-static';
import { Error, LoadingPanel } from 'auth0-extension-ui';

import { excludesActions } from '../actions';

import ConfigurationTable from '../components/ConfigurationTable';

export default connectContainer(class extends Component {
  static stateToProps = (state) => ({
    showNotification: state.excludes.get('showNotification'),
    notificationType: state.excludes.get('notificationType')
  });

  static actionsToProps = {
    ...excludesActions
  }

  static propTypes = {
    type: PropTypes.string.isRequired,
    excludes: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object.isRequired,
    updateExcludes: PropTypes.func.isRequired
  }

  render() {
    const { type, loading, error, excludes } = this.props;
    const items = excludes.get(type);

    return (
      <div>
        <LoadingPanel show={loading} animationStyle={{ paddingTop: '5px', paddingBottom: '5px' }}>
          <div className="row">
            <div className="col-xs-12">
              <Error message={error} />
              <ConfigurationTable
                type={type}
                items={items}
                loading={loading}
                error={error}
                saveManualItems={this.props.updateExcludes}
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
