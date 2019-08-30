import React, { Component } from 'react';
import { Table, TableBody, TableCell, TableTextCell, TableHeader, TableColumn, TableRow, Alert } from 'auth0-extension-ui';

export default class ConfigurationTable extends Component {
  static propTypes = {
    type: React.PropTypes.string.isRequired,
    items: React.PropTypes.object.isRequired,
    loading: React.PropTypes.bool.isRequired,
    saveManualItems: React.PropTypes.func.isRequired,
    openNotification: React.PropTypes.func.isRequired,
    closeNotification: React.PropTypes.func.isRequired,
    showNotification: React.PropTypes.bool.isRequired,
    notificationType: React.PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      items: this.toArray(props.items)
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      items: this.toArray(nextProps.items)
    });
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.items !== this.props.items || this.props.showNotification !== nextProps.showNotification;
  }

  onChangeManual = () => {
    const manualItems = [];
    this.state.items.forEach((item) => {
      if (this.refs[item.name].checked) {
        manualItems.push(item.name);
      }
    });

    this.props.saveManualItems({ type: this.props.type, names: manualItems })
      .then(() => {
        this.props.openNotification();
        setTimeout(this.props.closeNotification, 10000);
      });
  }

  toArray(itemsMap) {
    const items = itemsMap && itemsMap.toJS();
    return Object.keys(items).map((itemName) => ({
      name: itemName,
      isManual: items[itemName]
    }));
  }

  render() {
    const { items } = this.state;

    return (
      <div>
        <Alert
          show={this.props.showNotification}
          onDismiss={this.props.closeNotification}
          type={this.props.notificationType}
          message={`Excluded ${this.props.type} have been saved.`}
        />
        <p>
          {`You can flag ${this.props.type} as excluded. Excluded ${this.props.type} will not be deleted, or updated.`}
        </p>
        <Table>
          <TableHeader>
            <TableColumn width="80%">Name</TableColumn>
            <TableColumn width="20%">Manual Item</TableColumn>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.name}>
                <TableTextCell>{item.name}</TableTextCell>
                <TableCell>
                  <div className="switch-animate">
                    <input
                      className="uiswitch isManualItem" value={item.name} defaultChecked={item.isManual} type="checkbox"
                      name="isManualItem" ref={item.name}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <button className="btn btn-success pull-right" onClick={this.onChangeManual}>{`Update excluded ${this.props.type}`}</button>
      </div>
    );
  }
}
