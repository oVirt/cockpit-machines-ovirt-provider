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
/*
  const ConnectionDetails = ({ display, onDesktopConsole }) => {
    return (
      <td>
        <ul>
          <li>
            <a href='#' onClick={() => onDesktopConsole(display)}>
              {_("Download a helper file")}
            </a>
          </li>
        </ul>
      </td>
    )
  }
*/
  const ConsoleClientResources = () => {
    return (
      <div>
        {_("In case of trouble, please refer the ")}&nbsp;
        <a href={CONSOLE_CLIENT_RESOURCES_URL} target='_blank'>
          {_("oVirt's console client resources.")}
        </a>
      </div>
    )
  }
/*
  const ConsoleConnectionDetails = ({ displays, onDesktopConsole }) => {
    const isVNC = !!displays.vnc
    const isSPICE = !!displays.spice

    return (
      <tr>
        {isSPICE && <ConnectionDetails display={displays['spice']} onDesktopConsole={onDesktopConsole} />}
        {isVNC && <ConnectionDetails display={displays['vnc']} onDesktopConsole={onDesktopConsole} />}
      </tr>
    );
  }
*/
  exportedComponents.consoleClientResourcesFactory = (vm, providerState) => providerState.vms[vm.id] ?
    ConsoleClientResources
    : null; // not an oVirt-managed VM, so default cockpit:machines implementation of ConsoleClientResources will be used
/*
  exportedComponents.consoleConnectionDetailsFactory = (vm, providerState) => providerState.vms[vm.id] ?
    ConsoleConnectionDetails
    : null; // not an oVirt-managed VM, so default cockpit:machines implementation of ConnectionDetails will be used
    */
}

export default exportedComponents;
