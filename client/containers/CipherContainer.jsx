import React, { PropTypes, Component } from 'react';
import connectContainer from 'redux-static';
import { Error, LoadingPanel } from 'auth0-extension-ui';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { cipherActions } from '../actions';

export default connectContainer(class extends Component {
  constructor(props) {
    super(props);
    this.state = { secret: '' };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static stateToProps = (state) => ({
    encrypted: state.cipher.get('record'),
    loading: state.cipher.get('loading'),
    error: state.cipher.get('error')
  });

  static actionsToProps = {
    ...cipherActions
  }

  static propTypes = {
    encrypted: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object.isRequired,
    encryptText: PropTypes.func.isRequired
  }

  handleChange(event) {
    this.setState({ secret: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.encryptText(this.state.secret);
  }

  render() {
    const encrypted = this.props.encrypted.get('result');
    const loading = this.props.loading;
    const error = this.props.error;

    return (
      <div>
        <LoadingPanel show={loading} animationStyle={{ paddingTop: '5px', paddingBottom: '5px' }}>
          <div className="row">
            <div className="col-xs-12">
              <Error message={error} />
              <form className="form-horizontal col-xs-12" onSubmit={this.handleSubmit}>
                <div className="form-group">
                  <label className="col-xs-2 control-label">Plain text secret</label>
                  <div className="col-xs-7">
                    <input type="text" className="form-control" value={this.state.secret} onChange={this.handleChange}/>
                  </div>
                  <div className="col-xs-2">
                    <input type="submit" className="form-control" value="Encrypt" />
                  </div>
                </div>
              </form>
              <form className="form-horizontal col-xs-12" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label className="col-xs-2 control-label">Encrypted secret</label>
                  <div className="col-xs-7">
                    <input type="text" readOnly="readonly" className="form-control" value={encrypted} />
                  </div>
                  <div className="col-xs-2">
                    <CopyToClipboard text={encrypted} >
                      <input type="submit" className="form-control" value="Copy" />
                    </CopyToClipboard>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </LoadingPanel>
      </div>
    );
  }
});
