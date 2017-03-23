import { getReact } from '../react.js';
import { logError } from '../helpers';
import { suspendVm } from '../actions';

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

  const VmProviderActions = ({ vm, providerState, dispatch }) => {
    const clusterVm = providerState.vms[vm.id];
    if (!clusterVm) { // not an oVirt-managed VM
      return null;
    }

    // TODO: add user confirmation
    return (
      <div className='btn-group'>
        <button className='btn btn-default' onClick={() => dispatch(suspendVm({id: clusterVm.id, name: clusterVm.name, connectionName: vm.connectionName}))}>
          {_("Suspend")}
        </button>
      </div>
    );
  };

  /**
   * Just a hook, so far there's no extension for it.
   */
  exportedComponents.VmProviderActions = ({ vm, providerState, dispatch }) => (<VmProviderActions vm={vm} providerState={providerState} dispatch={dispatch}/>);
}

export default exportedComponents;
