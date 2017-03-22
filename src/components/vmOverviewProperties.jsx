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

  const VmOverviewProps = ({ vm, providerState }) => { // For reference, extend if needed
    if (!providerState.vms[vm.id]) { // not an oVirt-managed VM
      return null;
    }

    let content = null;
    if (true) { // Recently not used. Icon and addition props are planed.
      content = 'Hello from Provider';
    }

    return (
      <div>
        {content}
      </div>
    );
  };

  /**
   * Just a hook, so far there's no extension for it.
   */
  exportedComponents.VmOverviewProps = ({ vm, providerState }) => (<VmOverviewProps vm={vm} providerState={providerState} />);
}

export default exportedComponents;
