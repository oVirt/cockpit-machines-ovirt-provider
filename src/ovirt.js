import { updateHost, removeUnlistedHosts } from './actions';
import { callOncePerTimeperiod, logDebug, logError, ovirtApiGet } from './helpers';
import CONFIG from './config';

/**
 * Initiate polling of oVirt data.
 *
 * @param dispatch
 */
let lastOvirtPoll = -1;
export function pollOvirt({dispatch}) {
  lastOvirtPoll = callOncePerTimeperiod({
    lastCall: lastOvirtPoll,
    delay: CONFIG.ovirt_polling_interval,
    lock: pollOvirtLock,
    call: () => {
      logDebug('Execution of oVirt polling');
      doRefreshHosts(dispatch);
    }
  }).lastCall;
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

  dispatch(updateHost({id: '123', name: 'test1'}));
  dispatch(updateHost({id: '456', name: 'test2'}));
}
