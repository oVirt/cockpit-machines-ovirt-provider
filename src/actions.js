import OVIRT_PROVIDER from './provider';

export function updateHost(host) {
  return {
    type: 'OVIRT_UPDATE_HOST',
    payload: host
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

export function migrateVm (vmId, hostId) {
  return OVIRT_PROVIDER.actions.virtMiddleware('MIGRATE_VM', { vmId, hostId });
}
