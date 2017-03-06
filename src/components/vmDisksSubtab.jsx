import { getReact } from '../react.js';
import { logError } from '../helpers';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components once the React context is available.
 */
export function lazyCreateVmDisksComponents() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateVmDisksComponents(): React not registered!`);
    return ;
  }

  const Dummy = ({ vm, diskTarget }) => { // For reference, extend if needed
    return (<strong>{vm.name}, {diskTarget}</strong>);
  };

  exportedComponents.DummyFactory = ({ vm, diskTarget }) => (<Dummy vm={vm} diskTarget={diskTarget} />);
  exportedComponents.DummyActionsFactory = ({ vm }) => [<button>{vm.name} action</button>];
}

export default exportedComponents;
