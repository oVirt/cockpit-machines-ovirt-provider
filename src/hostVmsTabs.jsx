import { getReact } from './react.js';
import { logDebug, logError, isSameHostAddress } from './helpers.js';
import { migrateVm } from './actions';

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

  const ConfirmButtons = ({ confirmText, dismissText, onYes, onNo }) => { // not exported
    return (
      <span>
        <button className='btn btn-danger btn-xs' type='button' onClick={onYes}>{confirmText}</button>
        &nbsp;
        <button className='btn btn-primary btn-xs' type='button' onClick={onNo}>{dismissText}</button>
      </span>
    );
  };

  class MigrateTo extends React.Component { // not exported
    constructor (props) {
      super(props)

      this.state = {
        confirmAction: false,
        selectedHostId: null,
      };
    }

    render () {
      const { vm, hosts, dispatch } = this.props;

      const onHostChange = e => { this.setState({selectedHostId: e.target.value}); };
      const onAction = () => { this.setState({ confirmAction: true }); };
      const onActionCanceled = () => { this.setState({ confirmAction: false }); };
      const onActionConfirmed = () => {
        this.setState({ confirmAction: false });
        dispatch(migrateVm(vm.id, this.state.selectedHostId));
      };

      return (
        <tr>
          <td>
            {this.state.confirmAction ?
              (<ConfirmButtons confirmText={_("Confirm migration")}
                               dismissText={_('Cancel')}
                               onYes={onActionConfirmed}
                               onNo={onActionCanceled}/>) :
              (<button className="btn btn-default btn-danger" onClick={onAction}>{_("Migrate To:")}</button>)
            }
          </td>
          <td>
            <select className='combobox form-control' onChange={onHostChange} disabled={this.state.confirmAction}>
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
      const { vm, providerState, dispatch } = this.props;

      return (
        <table className='machines-width-max'>
          <tr className='machines-listing-ct-body-detail'>
            <td>
              <table>
                <MigrateTo vm={vm} hosts={providerState.hosts} dispatch={dispatch}/>
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
