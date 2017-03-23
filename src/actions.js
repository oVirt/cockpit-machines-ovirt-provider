import OVIRT_PROVIDER from './provider';
import { logDebug } from './helpers';

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

export function updateTemplate(template) {
  return {
    type: 'OVIRT_UPDATE_TEMPLATE',
    payload: template
  }
}

export function updateCluster(cluster) {
  return {
    type: 'OVIRT_UPDATE_CLUSTER',
    payload: cluster
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

export function removeUnlistedTemplates({allTemplateIds}) {
  return {
    type: 'OVIRT_REMOVE_UNLISTED_TEMPLATES',
    payload: {
      allTemplateIds
    }
  }
}

export function removeUnlistedClusters({allClusterIds}) {
  return {
    type: 'OVIRT_REMOVE_UNLISTED_CLUSTERS',
    payload: {
      allClusterIds
    }
  }
}

export function updateIcon(icon) {
  return {
    type: 'OVIRT_UPDATE_ICON',
    payload: icon
  };
}

export function migrateVm (vmId, vmName, hostId) {
  return OVIRT_PROVIDER.actions.virtMiddleware('MIGRATE_VM', { vmId, vmName, hostId });
}

export function createVm ({ templateName, clusterName, vm }) {
  return OVIRT_PROVIDER.actions.virtMiddleware('CREATE_VM', { templateName, clusterName, vm });
}

export function downloadIcons ({ iconIds, forceReload }) {
  return OVIRT_PROVIDER.actions.virtMiddleware('DOWNLOAD_ICONS', { iconIds, forceReload });
}

export function downloadIcon ({ iconId }) {
  return OVIRT_PROVIDER.actions.virtMiddleware('DOWNLOAD_ICON', { iconId });
}

export function switchToplevelVisibility (topLevelVisibleComponent, subview) {
  return {
    type: 'OVIRT_SWITCH_VISIBILITY',
    payload: {
      topLevelVisibleComponent,
      subview,
    }
  }
}

// --- Matching cockpit:machines action creators: --------------
export function startVm(vm, hostName) {
  const { virtMiddleware } = OVIRT_PROVIDER.actions;
  logDebug(`startVm() called for vmId=${vm.id}, hostId=${hostName}`);
  return virtMiddleware('START_VM', { name: vm.name, id: vm.id, connectionName: vm.connectionName, hostName });
}

export function vmActionFailed({ name, connectionName, message, detail, detailForNonexisting}) {
  return {
    type: 'VM_ACTION_FAILED',
    payload: {
      name,
      connectionName,
      message,
      detail,
      detailForNonexisting,
    }
  };
}
