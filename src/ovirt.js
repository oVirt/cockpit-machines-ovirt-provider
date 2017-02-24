import { updateHost, removeUnlistedHosts, updateVm, removeUnlistedVms } from './actions';
import { callOncePerTimeperiod, logDebug, logError, ovirtApiGet } from './helpers';
import CONFIG from './config';

let lastOvirtPoll = -1; // timestamp
/**
 * Initiate polling of oVirt data.
 *
 * @param dispatch
 */
export function pollOvirt({dispatch}) {
  lastOvirtPoll = callOncePerTimeperiod({
    lastCall: lastOvirtPoll,
    delay: CONFIG.ovirt_polling_interval,
    lock: pollOvirtLock,
    call: () => {
      logDebug('Execution of oVirt polling');
      doRefreshHosts(dispatch);
      doRefreshVms(dispatch);
    }
  }).lastCall; // update the timestamp
}

let pollOvirtLocked = false;
function pollOvirtLock(toBeLocked) {
  if (toBeLocked) {
    if (pollOvirtLocked) {
      return false;
    }
    pollOvirtLocked = true;
  } else {
    pollOvirtLocked = false;
  }
  return true;
}

function doRefreshHosts(dispatch) {
  ovirtApiGet('hosts').done(result => {
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

//  dispatch(updateHost({id: '123', name: 'test1'}));
//  dispatch(updateHost({id: '456', name: 'test2'}));
}

function doRefreshVms(dispatch) { // TODO: consider paging; there might be thousands of vms
  ovirtApiGet('vms').done(result => {
    if (result && result.vm && (result.vm instanceof Array)) {
      const allVmsIds = [];
      result.vm.forEach( vm => {
        allVmsIds.push(vm.id);
        dispatch(updateVm({ // TODO: consider batching
          id: vm.id,
          name: vm.name,
          state: mapOvirtStatusToLibvirtState(vm.status),
          description: vm.description,
          highAvailability: vm.high_availability,
          icons: {
            largeId: vm.large_icon ? vm.large_icon.id : undefined,
            smallId: vm.small_icon ? vm.small_icon.id : undefined,
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
          stateless: vm.stateless,
          clusterId: vm.cluster.id,
          templateId: vm.template.id,
          host: vm.host ? vm.host.id : undefined,
        }));
      });
      dispatch(removeUnlistedVms({allVmsIds}));
    } else {
      logError(`doRefreshVms() failed, result: ${JSON.stringify(result)}`);
    }
  });
}

function mapOvirtStatusToLibvirtState(ovirtStatus) {
  switch (ovirtStatus) {// TODO finish
    case 'up': return 'running';
    case 'down': return 'shut off';
    default:
      return ovirtStatus
  }
}