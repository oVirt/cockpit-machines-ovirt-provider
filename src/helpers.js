import CONFIG, { CSS_FILE_URL } from './config.js'

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

export function ovirtApiGet (resource, custHeaders) {
  const headers = Object.assign({}, {
      'Accept': 'application/json',
      'Content-Type': 'application/xml',
      'Authorization': 'Bearer ' + CONFIG.token
    },
    custHeaders);

  return window.$.ajax({
    method: 'GET',
    headers,
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

export function getHostAddress() {
  const localHost = window.location.host;
  const localAddress = localHost.substring(0, localHost.indexOf(':'));
  return localAddress;
}

export function isSameHostAddress(hostAddress) { // TODO: check for all host addresses
  return getHostAddress() === hostAddress;
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
    if (lock(true)) { // acquire or skip
      try {
        result = call();
      } finally {
        lock(false); // release lock
      }
    } else {
      logDebug('callOncePerTimeperiod() skipped, lock is busy');
    }
  } else {
    logDebug(`Skipping callOncePerTimeperiod(), not a window: lastcall=${lastCall}, delay=${delay}, now=${now}`);
  }

  return {
    lastCall: Date.now(), // start counting after the call is finished
    result
  };
}

/**
 * Download given content as a file in the browser
 *
 * @param data Content of the file
 * @param fileName
 * @param mimeType
 * @returns {*}
 */
export function fileDownload ({ data, fileName = 'myFile.dat', mimeType = 'application/octet-stream' }) {
  if (data) {
    const a = document.createElement('a');

    if ('download' in a) { // html5 A[download]
      a.href = `data:${mimeType},${encodeURIComponent(data)}`;
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } else { // do iframe dataURL download (old ch+FF):
      const f = document.createElement('iframe');
      document.body.appendChild(f);
      f.src = `data:${mimeType},${encodeURIComponent(data)}`;
      window.setTimeout(() => document.body.removeChild(f), 333);
      return true;
    }
  }
}

/**
 * Dynamically loads cockpit-machines-ovirt-provider CSS
 */
export function loadCss () {
  const link = document.createElement( "link" );
  link.href = CSS_FILE_URL;
  link.type = "text/css";
  link.rel = "stylesheet";
  link.media = "screen,print";

  document.getElementsByTagName( "head" )[0].appendChild( link );
}

export function toGigaBytes (amount, currentUnit) {
  let result;
  switch (currentUnit) {
    case 'B':
      result = amount / 1024 / 1024 / 1024;
      break;
    case 'KiB':
      result = amount / 1024 / 1024;
      break;
    default:
      console.error(`toGigaBytes(): unknown unit: ${currentUnit}`);
      result = amount / 1;
  }

  if (result < 1) {
    result = result.toFixed(2);
  } else {
    const fixed1 = result.toFixed(1);
    result = (result - fixed1 === 0) ? result.toFixed(0) : fixed1;
  }

  return result;
}

export function valueOrDefault (value, def) {
  return (value === undefined || value === null) ?  def : value;
}
