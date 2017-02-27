import { logDebug, logError } from './helpers';

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
      const newState = Object.assign({}, state);
      const allHostIds = action.payload.allHostIds;
      const toBeRemoved = Object.getOwnPropertyNames(newState).filter(hostId => (allHostIds.indexOf(hostId) < 0))
      toBeRemoved.forEach(hostId => delete newState[hostId]);
      return newState;
    }
    default:
      return state;
  }
}

function visibilityReducer (state, action) {
  state = state || {}; // object of clusterView:false, hostView:false

  switch (action.type) {
    case 'OVIRT_SWITCH_VISIBILITY':
    { // TODO: so far there are just two states, generalize if needed
      const newState = Object.assign({}, state);

      switch (action.payload.topLevelVisibleComponent) {
        case 'clusterView': {
          newState.clusterView = true; // replace by object, if finer granularity needed
          newState.hostView = false;
          return newState;
        }
        case 'hostView': {
          newState.clusterView = null;
          newState.hostView = true;
          return newState;
        }
        default: // so far, it should not happen
          logError(`visibilityReducer: unknown topLevelVisibleComponent: ${JSON.stringify(action)}`);
          return newState;
      }
    }
    default:
      return state;
  }
}

function vmsReducer (state, action) {
  state = state || {}; // object of 'vmId: vm'

  switch (action.type) {
    case 'OVIRT_UPDATE_VM':
    {
      const newState = Object.assign({}, state);
      newState[action.payload.id] = newState[action.payload.id] || {};
      Object.assign(newState[action.payload.id], action.payload); // merge instead of replace, is it as expected?
      return newState;
    }
    case 'OVIRT_REMOVE_UNLISTED_VMS':
    {
      const newState = Object.assign({}, state);
      const allVmsIds = action.payload.allVmsIds;
      const toBeRemoved = Object.getOwnPropertyNames(newState).filter(vmId => (allVmsIds.indexOf(vmId) < 0))
      toBeRemoved.forEach(vmId => delete newState[vmId]);
      return newState;
    }
    default:
      return state;
  }
}

function templatesReducer (state, action) {
  state = state || {}; // object of 'templateId: template'

  switch (action.type) {
    case 'OVIRT_UPDATE_TEMPLATE':
    {
      const newState = Object.assign({}, state);
      newState[action.payload.id] = newState[action.payload.id] || {};
      Object.assign(newState[action.payload.id], action.payload); // merge instead of replace, is it as expected?
      return newState;
    }
    case 'OVIRT_REMOVE_UNLISTED_TEMPLATES':
    {
      const newState = Object.assign({}, state);
      const allTemplateIds = action.payload.allTemplateIds;
      const toBeRemoved = Object.getOwnPropertyNames(newState).filter(id => (allTemplateIds.indexOf(id) < 0))
      toBeRemoved.forEach(id => delete newState[id]);
      return newState;
    }
    default:
      return state;
  }
}

function callSubReducer (newState, action, subreducer, substateName) {
  const newSubstate = subreducer(newState[substateName], action);
  if (newState[substateName] !== newSubstate) {
    const temp = {};
    temp[substateName] = newSubstate;
    newState = Object.assign({}, newState, temp);
  }
  return newState;
}

export function ovirtReducer (state, action) {
  state = state || {
      hosts: {}, // {id:host}
      visibility: {}, // {clusterView:false, hostView:false}
    };

  let newState = state;
  newState = callSubReducer(newState, action, hostsReducer, 'hosts');
  newState = callSubReducer(newState, action, visibilityReducer, 'visibility');
  newState = callSubReducer(newState, action, vmsReducer, 'vms');
  newState = callSubReducer(newState, action, templatesReducer, 'templates');

  return newState;
}
