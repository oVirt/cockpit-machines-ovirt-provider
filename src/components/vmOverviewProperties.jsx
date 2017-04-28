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
          <label className='control-label'>
            {title}
          </label>
        </td>
        <td>
          {value}
        </td>
      </tr>
    );
  };

  const VmIcon = ({ icons, iconId }) => {
    if (!iconId || !icons || !icons[iconId] || !icons[iconId].data) {
      return null;
    }

    const icon = icons[iconId];
    const src = `data:${icon.type};base64,${icon.data}`;

    return (
      <img src={src} className='ovirt-provider-overview-icon' alt={_("VM icon")} />
    );
  };

  const VmOverviewProps = ({ vm, providerState }) => { // For reference, extend if needed
    const clusterVm = providerState.vms[vm.id];
    if (!clusterVm) { // not an oVirt-managed VM
      return null;
    }

    return (
      <td className='ovirt-provider-listing-top-column'>
        <div className='ovirt-provider-columns-container'>
            <div className='ovirt-provider-columns-one'>
              <table className='form-table-ct'>
                <VmProperty title={_("Description:")} value={clusterVm.description} />
              </table>
            </div>
            <div className='ovirt-provider-columns-two'>
              <VmIcon icons={providerState.icons} iconId={clusterVm.icons.largeId} />
            </div>
        </div>
      </td>
    );
  };

  exportedComponents.VmOverviewProps = VmOverviewProps;
}

export default exportedComponents;
