import { getReact } from '../react.js';
import { logDebug, logError, isSameHostAddress } from '../helpers.js';
import { migrateVm } from '../actions';
import CommonComponents from './commonComponents.jsx';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components not before the React context is available.
 */
export function lazyCreateOVirtTab () {
  logDebug('lazyCreateOVirtTab()');
  const React = getReact();
  if (!React) {
    logError(`lazyCreateOVirtTab(): React not registered!`);
    return ;
  }

  const { ConfirmButtons } = CommonComponents;

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
        dispatch(migrateVm(vm.id, vm.name, this.state.selectedHostId));
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
            <select className='combobox form-control ovirt-provider-migrateto-combo' onChange={onHostChange} disabled={this.state.confirmAction}>
              <option value={null} selected={!this.state.selectedHostId}>
                <i>{_("Automatically selected host")}</i>
              </option>
              {Object.getOwnPropertyNames(hosts)
                .filter( hostId => canVmMigrateToHost({host: hosts[hostId]}))
                .map(hostId => (
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

  const VmTemplate = ({ clusterVm, templates }) => {
    if (!templates || !clusterVm) {
      return null;
    }

    const template = templates[clusterVm.templateId];
    const version = template.version;
    return (
      <VmProperty title={_("Base template:")}
                  value={version.name ?
                          (`${version.name} (${template.name})`)
                        : template.name}
      />
    );
  };

  const VmProperty = ({ title, value }) => {
    return (
      <tr>
        <td>
          {title}
        </td>
        <td>
          {value}
        </td>
      </tr>
    );
  };

  const VmHA = ({ clusterVm }) => {
    let value = _("disabled");
    if (clusterVm.highAvailability && clusterVm.highAvailability.enabled === 'true') {
      value = _("enabled");
    }

    return (<VmProperty title={_("HA:")} value={value} />);
  };
  // -------------------------------------------------------------------------------
  exportedComponents.OVirtTab = React.createClass({ // exported component
    render: function () {
      const { vm, providerState, dispatch } = this.props;

      const clusterVm = providerState.vms[vm.id]; // 'vm' is from Libvirt, 'clusterVm' is from oVirt

      if (!clusterVm) {
        return (<div>{_("This virtual machine is not managed by oVirt")}</div>);
      }

      return (
        <table className='machines-width-max'>
          <tr className='machines-listing-ct-body-detail'>
            <td className='ovirt-provider-listing-top-column'>
              <table className='form-table-ct'>
                <VmProperty title={_("Description:")} value={clusterVm.description} />
                <VmTemplate clusterVm={clusterVm} templates={providerState.templates} />
                <VmProperty title={_("OS Type:")} value={clusterVm.os.type} />
              </table>
            </td>
            <td className='ovirt-provider-listing-top-column'>
              <table className='form-table-ct'>
                <VmHA clusterVm={clusterVm} />
                <VmProperty title={_("Stateless:")} value={clusterVm.stateless} />
                <VmProperty title={_("Optimized for:")} value={clusterVm.type} />
              </table>
            </td>
            <td className='ovirt-provider-listing-top-column'>
              <table className='form-table-ct'>
                <MigrateTo vm={vm} hosts={providerState.hosts} dispatch={dispatch}/>
              </table>
            </td>
          </tr>
        </table>
      );
    }
  });
}

function canVmMigrateToHost ({ host }) {
  return host.status === 'up';
}

export default exportedComponents;
