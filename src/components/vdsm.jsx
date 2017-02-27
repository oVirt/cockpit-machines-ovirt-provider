import { getReact } from '../react.js';
import { logError } from '../helpers.js';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components once the React context is available.
 */
export function lazyCreateVdsmView() {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateVdsmView(): React not registered!`);
    return;
  }


  // TODO: components
  const VdsmView = ({}) => {
    return (<div>Hello from VDSM</div>);
  };

  exportedComponents.VdsmView = VdsmView;
}

export default exportedComponents;
