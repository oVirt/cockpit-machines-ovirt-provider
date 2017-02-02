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
