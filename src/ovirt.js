import { updateHost, removeUnlistedHosts, updateVm, removeUnlistedVms,
  updateTemplate, removeUnlistedTemplates, updateCluster, removeUnlistedClusters, downloadIcons } from './actions';
import { callOncePerTimeperiod, logDebug, logError, ovirtApiGet } from './helpers';
import CONFIG from './config';
import { isOvirtApiCheckPassed } from './provider'

let lastOvirtPoll = -1; // timestamp
/**
 * Initiate polling of oVirt data.
 *
 * @param dispatch
 */
export function pollOvirt({dispatch}) {
  if (!isOvirtApiCheckPassed()) {
    logDebug(`Skipping oVirt poling due to failed/unfinished oVirt API check`);
    return ;
  }

  callOncePerTimeperiod({
    lastCall: lastOvirtPoll,
    delay: CONFIG.ovirt_polling_interval,
    call: () => {
      logDebug('Execution of oVirt polling');
      lastOvirtPoll = Infinity; // avoid parallel execution
      const promises = [];
      promises.push( doRefreshHosts(dispatch) );
      promises.push( doRefreshVms(dispatch) );
      promises.push( doRefreshTemplates(dispatch) );
      promises.push( doRefreshClusters(dispatch) );

      return Promise.all(promises).then( () => { // update the timestamp
        lastOvirtPoll = Date.now();
        logDebug(`pollOvirt(): setting lastOvirtPoll to: ${lastOvirtPoll}`);
      });
    }
  });
}

/**
 * Shortens the period for next oVirt polling, so it will be executed at next earliest opportunity.
 *
 * Useful to shorten polling delay after user action.
 */
export function forceNextOvirtPoll() {
  lastOvirtPoll = -1;
}

function doRefreshHosts(dispatch) {
  logDebug(`doRefreshHosts() called`);
  return ovirtApiGet('hosts').done(result => {
    if (result && result.host && (result.host instanceof Array)) {
      const allHostIds = [];
      result.host.forEach( host => {
        allHostIds.push(host.id);
        dispatch(updateHost({
          id: host.id,
          name: host.name,
          address: host.address,
          clusterId: host.cluster ? host.cluster.id : undefined,
          status: host.status,
          memory: host.memory,
          cpu: host.cpu ? {
            name: host.cpu.name,
            speed: host.cpu.speed,
            topology: host.cpu.topology ? {
              sockets: host.cpu.topology.sockets,
              cores: host.cpu.topology.cores,
              threads: host.cpu.topology.threads
            } : undefined
          } : undefined,
          // summary
          // vdsm version
          // libvirt_version
        }));
      });
      dispatch(removeUnlistedHosts({allHostIds}));
    } else {
      logError(`doRefreshHosts() failed, result: ${JSON.stringify(result)}`);
    }
  });
}

function doRefreshVms(dispatch) { // TODO: consider paging; there might be thousands of vms
  logDebug(`doRefreshVms() called`);
  return ovirtApiGet('vms').done(result => {
    if (result && result.vm && (result.vm instanceof Array)) {
      const allVmsIds = [];
      const allIconIds = {}; // used as a set
      result.vm.forEach( vm => {
        allVmsIds.push(vm.id);

        let largeIconId, smallIconId;
        if (vm.large_icon) {
          largeIconId = vm.large_icon.id;
          allIconIds[largeIconId] = true;
        }
        if (vm.small_icon) {
          smallIconId = vm.small_icon.id;
          allIconIds[smallIconId] = true;
        }

        dispatch(updateVm({ // TODO: consider batching
          id: vm.id,
          name: vm.name,
          state: mapOvirtStatusToLibvirtState(vm.status),
          description: vm.description,
          highAvailability: vm.high_availability,
          icons: {
            largeId: largeIconId,
            smallId: smallIconId,
          },
          memory: vm.memory,
          cpu: {
            architecture: vm.cpu.architecture,
            topology: {
              sockets: vm.cpu.topology.sockets,
              cores: vm.cpu.topology.cores,
              threads: vm.cpu.topology.threads
            }
          },
          origin: vm.origin,
          os: {
            type: vm.os.type
          },
          type: vm.type, // server, desktop
          stateless: vm.stateless,
          clusterId: vm.cluster.id,
          templateId: vm.template.id,
          hostId: vm.host ? vm.host.id : undefined,
        }));
      });
      dispatch(removeUnlistedVms({allVmsIds}));
      dispatch(downloadIcons({ iconIds: allIconIds, forceReload: false }));
    } else {
      logError(`doRefreshVms() failed, result: ${JSON.stringify(result)}`);
    }
  });
}

function mapOvirtStatusToLibvirtState(ovirtStatus) {
  switch (ovirtStatus) {// TODO: finish - add additional states
    case 'up': return 'running';
    case 'down': return 'shut off';
    default:
      return ovirtStatus
  }
}

function doRefreshTemplates(dispatch) { // TODO: consider paging; there might be thousands of templates
  logDebug(`doRefreshTemplates() called`);
  return ovirtApiGet('templates').done(result => {
    if (result && result.template && (result.template instanceof Array)) {
      const allTemplateIds = [];
      result.template.forEach( template => {
        allTemplateIds.push(template.id);
        dispatch(updateTemplate({ // TODO: consider batching
          id: template.id,
          name: template.name,
          description: template.description,
          cpu: {
            architecture: template.cpu.architecture,
            topology: {
              sockets: template.cpu.topology.sockets,
              cores: template.cpu.topology.cores,
              threads: template.cpu.topology.threads
            }
          },
          memory: template.memory,
          creationTime: template.creation_time,

          highAvailability: template.high_availability,
          icons: {
            largeId: template.large_icon ? template.large_icon.id : undefined,
            smallId: template.small_icon ? template.small_icon.id : undefined,
          },
          os: {
            type: template.os.type
          },
          stateless: template.stateless,
          type: template.type, // server, desktop
          version: {
            name: template.version ? template.version.name : undefined,
            number: template.version ? template.version.number : undefined,
            baseTemplateId: template.version && template.version.base_template ? template.version.base_template.id : undefined,
          },

          // bios
          // display
          // migration
          // memory_policy
          // os.boot
          // start_paused
          // usb
        }));
      });
      dispatch(removeUnlistedTemplates({allTemplateIds}));
    } else {
      logError(`doRefreshTemplates() failed, result: ${JSON.stringify(result)}`);
    }
  });
}

function doRefreshClusters(dispatch) {
  logDebug(`doRefreshClusters() called`);
  return ovirtApiGet('clusters').done(result => {
    if (result && result.cluster && (result.cluster instanceof Array)) {
      const allClusterIds  = [];
      result.cluster.forEach( cluster => {
        allClusterIds.push(cluster.id);
        dispatch(updateCluster({
          id: cluster.id,
          name: cluster.name,
          // TODO: add more, if needed
        }));
      });
      dispatch(removeUnlistedClusters({allClusterIds}));
    } else {
      logError(`doRefreshClusters() failed, result: ${JSON.stringify(result)}`);
    }
  });
}

export function oVirtIconToInternal(ovirtIcon) {
  return {
    id: ovirtIcon.id,
    type: ovirtIcon['media_type'],
    data: ovirtIcon.data,
  };
}
