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

// TODO: this will be replaced once cockpit:machines gets support for switching top-level components
function visibilityReducer (state, action) {
  state = state || {}; // object of clusterView:false, hostView:false, vdsmView:false

  switch (action.type) {
    case 'OVIRT_SWITCH_VISIBILITY':
    { // TODO: so far there are just three states, generalize if needed
      const newState = Object.assign({}, state);

      switch (action.payload.topLevelVisibleComponent) {
        case 'clusterView': {
          newState.clusterView = { subview: action.payload.subview };
          newState.hostView = false;
          newState.vdsmView = null; // replace by object, if finer granularity needed
          return newState;
        }
        case 'hostView': {
          newState.clusterView = null;
          newState.hostView = true;
          newState.vdsmView = null;
          return newState;
        }
        case 'vdsmView': {
          newState.clusterView = null;
          newState.hostView = false;
          newState.vdsmView = true;
          return newState;
        }
        default: // so far, this should not happen
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
    case 'VM_ACTION_FAILED': // this reducer seconds the implementation in cockpit:machines (see the 'vms' reducer there).
    { // If an action failed on a VM running on this host, the error will be recorded on two places - it's as expected.
      // If the VM is unknown for this host, the user needs to be still informed about the result
      // So far, the VM is identified by "name" only
      // See the templatesReducer() as well.
      const vmId =  Object.getOwnPropertyNames(state).filter(vmId => state[vmId].name === action.payload.name);
      if (!vmId) {
        return state;
      }

      const updatedVm = Object.assign({}, state[vmId],
        {lastMessage: action.payload.message, lastMessageDetail: action.payload.detail});
      const updatedPartOfState = {};
      updatedPartOfState[vmId] = updatedVm;
      const newState = Object.assign({}, state, updatedPartOfState);
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
    case 'VM_ACTION_FAILED': // this reducer seconds the implementation in cockpit:machines and the vmsReducer()
    {
      logDebug(`templateReducer() VM_ACTION_FAILED payload: ${JSON.stringify(action.payload)}`);
      if (action.payload.detailForNonexisting && action.payload.detailForNonexisting.templateName) {
        const templateId = Object.getOwnPropertyNames(state).filter(templateId => state[templateId].name === action.payload.detailForNonexisting.templateName);
        /*
         const newState = Object.assign({}, state);
         newState[templateId] = newState[templateId] || {};
         Object.assign(newState[templateId],
         { lastMessage: action.payload.message, lastMessageDetail: action.payload.detail });
         return newState;
         }
         return state;
         */
        const updatedTemplate = Object.assign({}, state[templateId],
          {lastMessage: action.payload.message, lastMessageDetail: action.payload.detail});
        const updatedPartOfState = {};
        updatedPartOfState[templateId] = updatedTemplate;
        const newState = Object.assign({}, state, updatedPartOfState);
        logDebug(`templateReducer() VM_ACTION_FAILED: ${JSON.stringify(newState)}`);
        return newState;
      }
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
