import CONFIG from './config.js'

export function logDebug (msg) {
  if (CONFIG.debug) {
    console.log(`OVIRT_PROVIDER: ${msg}`);
  }
}

export function logError (msg) {
  console.error(`OVIRT_PROVIDER ERROR: ${msg}`);
}

export function logInfo (msg) {
  console.info(`OVIRT_PROVIDER: ${msg}`);
}

export function deferFunctionCall ( func ) {
  const deferred = window.cockpit.defer();
  if (func()) {
    return deferred.resolve().promise;
  }
  return deferred.reject().promise;
}

export function ovirtApiGet (resource) {
  return window.$.ajax({
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/xml',
      'Authorization': 'Bearer ' + CONFIG.token
    },
    url: `${CONFIG.OVIRT_BASE_URL}/api/${resource}`,
  }).fail( data => {
    logError(`HTTP GET failed: ${JSON.stringify(data)}`);
    // TODO: clear token from sessionStorage and refresh --> SSO will pass again
  });
}

export function ovirtApiPost (resource, input) {
  logDebug(`ovirtApiPost(), token: ${CONFIG.token}`);
  return window.$.ajax({
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/xml',
      'Authorization': 'Bearer ' + CONFIG.token
    },
    url: `${CONFIG.OVIRT_BASE_URL}/api/${resource}`,
    data: input
  }).fail(function (data) {
    logError(`HTTP POST failed: ${JSON.stringify(data)}`);
    // TODO: clear token from sessionStorage and refresh --> SSO will pass again
  });
}

export function isSameHostAddress(hostAddress) { // TODO: check for all host addresses
  logDebug(`isSameHostAddress(), hostAddress='${hostAddress}', local='${window.location.host}'`);
  const localHost = window.location.host;
  const localAddress = localHost.substring(0, localHost.indexOf(':'));
  return localAddress === hostAddress;
}

/**
 * Ensure, the function 'call()' is not executed more then once per timeperiod.
 *
 * @param call
 * @param delay
 * @param lastCall
 * @param lock(boolean toBeLocked)
 * @returns {{lastCall: *, result: *}}
 */
export function callOncePerTimeperiod({call, delay, lastCall, lock}) {
  const now = Date.now();
  let result;

  if (lastCall + delay <= now) {
    lastCall = now;
    if (lock(true)) { // acquire or skip
      result = call();
      lock(false); // release lock
    } else {
      logDebug('callOncePerTimeperiod() skipped, lock is busy');
    }
  }

  return {
    lastCall,
    result
  };
}
