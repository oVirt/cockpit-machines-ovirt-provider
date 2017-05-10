import { getReact } from '../react.js';
import { logError } from '../helpers';
import { CONSOLE_CLIENT_RESOURCES_URL } from '../config.js';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components not before the React context is available.
 */
export function lazyCreateVmConsoleComponents() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateVmConsoleComponents(): React not registered!`);
    return ;
  }

  const ConsoleClientResources = ({ vm, providerState }) => {
    return (
      <div>
        {_("In case of trouble, please refer the ")}&nbsp;
        <a href={CONSOLE_CLIENT_RESOURCES_URL} target='_blank'>
          {_("console client resources.")}
        </a>
      </div>
    );
  };

  const ConsoleConnectionDetails = () => {
    return null ; // recently not used, render nothing
  }

  exportedComponents.consoleClientResourcesFactory = (vm, providerState) => providerState.vms[vm.id] ?
    ConsoleClientResources
    : null; // not an oVirt-managed VM, so default cockpit:machines implementation of ConsoleClientResources will be used

  exportedComponents.consoleConnectionDetailsFactory = (vm, providerState) => providerState.vms[vm.id] ?
    ConsoleConnectionDetails
    : null; // not an oVirt-managed VM, so default cockpit:machines implementation of ConnectionDetails will be used
}

export default exportedComponents;
