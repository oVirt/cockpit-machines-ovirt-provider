import { updateHost, removeUnlistedHosts, updateVm, removeUnlistedVms, updateTemplate, removeUnlistedTemplates } from './actions';
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
      doRefreshTemplates(dispatch);
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
          type: vm.type, // server, desktop
          stateless: vm.stateless,
          clusterId: vm.cluster.id,
          templateId: vm.template.id,
          hostId: vm.host ? vm.host.id : undefined,
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

function doRefreshTemplates(dispatch) { // TODO: consider paging; there might be thousands of templates
  ovirtApiGet('templates').done(result => {
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
