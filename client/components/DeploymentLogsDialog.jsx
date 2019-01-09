import React, { Component } from 'react';
import { Button, ButtonToolbar, Modal } from 'react-bootstrap';

import './DeploymentLogsDialog.css';

export default class DeploymentLogsDialog extends Component {
  static propTypes = {
    deployment: React.PropTypes.object,
    onClose: React.PropTypes.func.isRequired
  };

  renderReport() {
    const { error, logs } = this.props.deployment;

    if (error) {
      return (<div><h4>Error:</h4><pre>{error}</pre></div>);
    }

    if (logs) {
      return (<div><h4>Report:</h4><pre>{JSON.stringify(logs, null, ' ')}</pre></div>);
    }

    return (<div><h4>No data available</h4></div>);
  }

  renderWarnings() {
    const { warnings } = this.props.deployment;

    if (warnings && warnings.length) {
      return (<div><h4>Warnings:</h4><pre>{JSON.stringify(warnings, null, ' ')}</pre></div>);
    }

    return '';
  }

  render() {
    if (!this.props.deployment) {
      return <div />;
    }

    const { id, date_relative } = this.props.deployment;

    return (
      <Modal dialogClassName="deployment-logs-dialog" show={this.props.deployment !== null} onHide={this.props.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{id} - <span>{date_relative}</span></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderReport()}
          {this.renderWarnings()}
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar>
            <Button bsSize="small" onClick={this.props.onClose}>
              <i className="icon icon-budicon-501"></i> Close
            </Button>
          </ButtonToolbar>
        </Modal.Footer>
      </Modal>
    );
  }
}
