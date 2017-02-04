import React/*, { registerReact } */from './react.js';
import { logDebug } from './helpers.js';

const _ = (m) => m; // TODO: add translation

export function oVirtTabFactory (React) {
  const MigrateTo = MigrateToFactory(React); // TODO: figure out better approach

  return React.createClass({
    render: function () {
      const { vm } = this.props.params;

      return (
        <table className='machines-width-max'>
          <tr className='machines-listing-ct-body-detail'>
            <td>
              <table>
                <MigrateTo />
              </table>
            </td>
            <td></td>
          </tr>
        </table>
      );
    }
  });
}

function MigrateToFactory (React) {
  class MigrateTo extends React.Component {
    constructor (props) {
      super(props)

      this.state = {
        confirmUnbind: false,
        selectedHost: null,
      };
    }

    render () {
      const hosts = [{name: 'TestHost1', id: '1'}, {name: 'TextHost2', id: '2'}]; // TODO: Change it to real data

      const onHostChange = e => {
        this.setState({selectedHost: e.target.value});
        logDebug(`MigrateTo: onHostChange: state: ${JSON.stringify(this.state)}`);
      };

      return (
        <tr>
          <td>
            <button className="btn btn-default btn-danger">{_("Migrate To:")}</button>
          </td>
          <td>
            <select className='combobox form-control' onChange={onHostChange}>
              <option value={null} selected={!this.state.selectedHost} disabled>
                <i>Automatically select host</i>
              </option>
              {hosts.map(host => (
                <option value={host} selected={host === this.state.selectedHost}>{host.name}</option>))}
            </select>
          </td>
        </tr>
      );
    }
  }

  return MigrateTo;
}
