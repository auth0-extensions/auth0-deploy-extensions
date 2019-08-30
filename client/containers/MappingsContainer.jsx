import React, { PropTypes, Component } from 'react';
import connectContainer from 'redux-static';
import { Error, LoadingPanel } from 'auth0-extension-ui';

import { mappingsActions } from '../actions';

import './MappingsContainer.css';

export default connectContainer(class extends Component {
  constructor(props) {
    super(props);
    this.state = { newMappings: {} };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static stateToProps = (state) => ({
    mappings: state.mappings.get('record'),
    loading: state.mappings.get('loading'),
    error: state.mappings.get('error')
  });

  static actionsToProps = {
    ...mappingsActions
  }

  static propTypes = {
    mappings: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object.isRequired,
    fetchMappings: PropTypes.func.isRequired,
    saveMappings: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.fetchMappings();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ newMappings: nextProps.mappings });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.saveMappings(this.state.newMappings);
  }

  handleChange(event) {
    this.setState({ newMappings: event.target.value });
  }

  render() {
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
                  <div className="col-xs-10">
                    <textarea type="text" className="mappings-input form-control" value={this.state.newMappings} onChange={this.handleChange}/>
                  </div>
                  <div className="col-xs-2">
                    <input type="submit" className="form-control" value="Save" />
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
