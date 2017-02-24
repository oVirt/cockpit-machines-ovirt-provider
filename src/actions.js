import OVIRT_PROVIDER from './provider';

export function updateHost(host) {
  return {
    type: 'OVIRT_UPDATE_HOST',
    payload: host
  }
}

export function updateVm(vm) {
  return {
    type: 'OVIRT_UPDATE_VM',
    payload: vm
  }
}

export function removeUnlistedHosts({allHostIds}) {
  return {
    type: 'OVIRT_REMOVE_UNLISTED_HOSTS',
    payload: {
      allHostIds
    }
  }
}

export function removeUnlistedVms({allVmsIds}) {
  return {
    type: 'OVIRT_REMOVE_UNLISTED_VMS',
    payload: {
      allVmsIds
    }
  }
}

export function migrateVm (vmId, hostId) {
  return OVIRT_PROVIDER.actions.virtMiddleware('MIGRATE_VM', { vmId, hostId });
}

export function switchToplevelVisibility (topLevelVisibleComponent) {
  return {
    type: 'OVIRT_SWITCH_VISIBILITY',
    payload: {
      topLevelVisibleComponent
    }
  }
}
