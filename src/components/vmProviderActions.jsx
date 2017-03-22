import { getReact } from '../react.js';
import { logError } from '../helpers';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components not before the React context is available.
 */
export function lazyCreateVmProviderComponents() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateVmProviderComponents(): React not registered!`);
    return ;
  }

  const VmProviderActions = ({ vm, providerState }) => { // For reference, extend if needed
    if (!providerState.vms[vm.id]) { // not an oVirt-managed VM
      return null;
    }

    let button = null;
    if (false) { // TODO: change it once needed
      button = <button className='btn btn-default'>Some Provider Action</button>;
    }

    return (
      <div className='btn-group'>
        {button}
      </div>
    );
  };

  /**
   * Just a hook, so far there's no extension for the VM Disks subtab needed.
   */
  exportedComponents.VmProviderActions = ({ vm, providerState }) => (<VmProviderActions vm={vm} providerState={providerState} />);
}

export default exportedComponents;
