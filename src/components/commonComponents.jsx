import { getReact } from '../react.js';
import { logError } from '../helpers';

const _ = (m) => m; // TODO: add translation

const exportedComponents = {}; // to be filled by lazy created and exported components

/**
 * Build React components not before the React context is available.
 */
export function lazyCreateCommonComponents () {
  const React = getReact();
  if (!React) {
    logError(`lazyCreateCommonComponents(): React not registered!`);
    return;
  }

  exportedComponents.ConfirmButtons = ({ confirmText, dismissText, onYes, onNo }) => { // not exported
    return (
      <span>
        <button className='btn btn-danger btn-xs' type='button' onClick={onYes}>{confirmText}</button>
        &nbsp;
        <button className='btn btn-primary btn-xs' type='button' onClick={onNo}>{dismissText}</button>
      </span>
    );
  };

}

export default exportedComponents;
