import { logDebug } from './helpers';

function hostsReducer (state, action) {
  state = state || {}; // object of 'hostId: host'

  switch (action.type) {
    case 'OVIRT_UPDATE_HOST':
    {
      const newState = Object.assign({}, state);
      newState[action.payload.id] = newState[action.payload.id] || {};
      Object.assign(newState[action.payload.id], action.payload); // merge instead of replace, is it as expected?
      return newState;
    }
    case 'OVIRT_REMOVE_UNLISTED_HOSTS':
    {
      logDebug(`OVIRT_REMOVE_UNLISTED_HOSTS: oldsState = ${JSON.stringify(state)}`);
      const newState = Object.assign({}, state);
      const allHostIds = action.payload.allHostIds;
      const toBeRemoved = Object.getOwnPropertyNames(newState).filter(hostId => (allHostIds.indexOf(hostId) < 0))
      toBeRemoved.forEach(hostId => delete newState[hostId]);
      logDebug(`OVIRT_REMOVE_UNLISTED_HOSTS: newState = ${JSON.stringify(newState)}`);
      return newState;
    }
    default:
      return state;
  }
}

export function ovirtReducer (state, action) {
  state = state || {
      hosts: {} // {id:host}
    };

  let newState = state;
  const newHosts = hostsReducer(newState.hosts, action);
  if (newState.hosts !== newHosts) {
    newState = Object.assign({}, newState, {hosts: newHosts});
  }

  return newState;
}

