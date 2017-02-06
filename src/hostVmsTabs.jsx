import { getReact } from './react.js';
import { logDebug, logError, isSameHostAddress } from './helpers.js';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components once the React context is available.
 */
export function lazyCreateOVirtTab () {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateOVirtTab(): React not registered!`);
    return ;
  }

  class MigrateTo extends React.Component { // not exported
    constructor (props) {
      super(props)

      this.state = {
        confirmUnbind: false,
        selectedHostId: null,
      };
    }

    render () {
      const { hosts } = this.props;

      const onHostChange = e => {
        this.setState({selectedHostId: e.target.value});
      };

      return (
        <tr>
          <td>
            <button className="btn btn-default btn-danger">{_("Migrate To:")}</button>
          </td>
          <td>
            <select className='combobox form-control' onChange={onHostChange}>
              <option value={null} selected={!this.state.selectedHostId}>
                <i>{_("Automatically selected host")}</i>
              </option>
              {Object.getOwnPropertyNames(hosts).map(hostId => (
                <option value={hostId}
                        selected={hostId === this.state.selectedHostId}
                        disabled={isSameHostAddress(hosts[hostId].address)}>
                  {hosts[hostId].name}
                </option>
              ))}
            </select>
          </td>
        </tr>
      );
    }
  }

  // -------------------------------------------------------------------------------
  exportedComponents.OVirtTab = React.createClass({ // exported component
    render: function () {
      const { vm, providerState } = this.props;

      return (
        <table className='machines-width-max'>
          <tr className='machines-listing-ct-body-detail'>
            <td>
              <h1>{providerState.test}</h1>
              <table>
                <MigrateTo hosts={providerState.hosts} />
              </table>
            </td>
            <td></td>
          </tr>
        </table>
      );
    }
  });
}

export default exportedComponents;
