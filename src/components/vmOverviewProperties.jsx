import { getReact } from '../react.js';
import { logError } from '../helpers';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components not before the React context is available.
 */
export function lazyCreateVmOverviewPropertiesComponents() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateVmOverviewPropertiesComponents(): React not registered!`);
    return ;
  }

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

  const VmOverviewProps = ({ vm, providerState }) => { // For reference, extend if needed
    const clusterVm = providerState.vms[vm.id];
    if (!clusterVm) { // not an oVirt-managed VM
      return null;
    }

    return (
      <td className='ovirt-provider-listing-top-column'>
        <table className='form-table-ct'>
          <VmProperty title={_("Description:")} value={clusterVm.description}/>
        </table>
      </td>
    );
  };

  /**
   * Just a hook, so far there's no extension for it.
   */
  exportedComponents.VmOverviewProps = ({ vm, providerState }) => (<VmOverviewProps vm={vm} providerState={providerState} />);
}

export default exportedComponents;
