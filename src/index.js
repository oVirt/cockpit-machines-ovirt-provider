/**
 To have this oVirt external provider for Cockpit/machines working,
 the oVirt SSO token must be provided to the cockpit/machines plugin.

 Parameters to cockpit packages can't be provided via '?' in the URL, so the hash '#' sign is used as workaround.

 Example:
    https://[ENGINE_HOST]/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://[COCKPI_HOST]:9090/machines__hash__token=TOKEN

 General notes:
   - data are still retrieved from Libvirt, only the active operations are redirected to oVirt
*/

var _ = function (str) { return str; } // TODO: implement localization

function logDebug (msg) {
  if (OVIRT_PROVIDER.CONFIG.debug) {
    console.log('OVIRT_PROVIDER: ' + msg);
  }
}

function logError (msg) {
  console.error('OVIRT_PROVIDER: ' + msg);
}

// --- Start of Polyfill ---
if (typeof Object.assign != 'function') {
  Object.assign = function (target, varArgs) { // .length of function is 2
    'use strict';
    if (target == null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}
// --- End of Polyfill ---
var OVIRT_PROVIDER = {
  name: 'oVirt',
  token: null,
  CONFIG_FILE_URL: 'provider/machines-ovirt.config',
  CONFIG: { // will be dynamically replaced by content of CONFIG_FILE_URL in init()
    debug: true, // set to false to turn off the debug logging
    OVIRT_BASE_URL: 'https://engine.local/ovirt-engine',
  },
  actions: { // this list is for reference only, it's expected to be replaced by init()
    delayRefresh: function () {},
    deleteUnlistedVMs: function (vmNames) {},
    updateOrAddVm: function (vm) {},
  },
  // ---------------------------------------------------------

  /**
   * Initialize the Provider
   */
  init: function (actionCreators, nextProvider) {
    logDebug('init() called');
    OVIRT_PROVIDER.actions = actionCreators;
    OVIRT_PROVIDER.nextProvider = nextProvider;
    OVIRT_PROVIDER.vmStateMap = nextProvider.vmStateMap; // reuse Libvirt since it is used for data retrieval

    OVIRT_PROVIDER._readConfiguration();
    return OVIRT_PROVIDER._login(OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL);
  },

  vmStateMap: null, // see init()
  canReset: function (state) {
    return OVIRT_PROVIDER.nextProvider.canReset(state);
  },
  canShutdown: function (state) {
    return OVIRT_PROVIDER.nextProvider.canShutdown(state);
  },
  isRunning: function (state) {
    return OVIRT_PROVIDER.nextProvider.isRunning(state);
  },
  canRun: function (state) {
    return OVIRT_PROVIDER.nextProvider.canRun(state);
  },

  /**
   * Get a single VM
   *
   * Redirected to Libvirt provider.
   */
  GET_VM: function (payload) {
    logDebug('GET_VM: redirecting to Libvirt provider');
    return OVIRT_PROVIDER.nextProvider.GET_VM(payload);
  },

  /**
   * Initiate read of all VMs
   *
   * Redirected to Libvirt provider.
   */
  GET_ALL_VMS: function () {
    logDebug('GET_ALL_VMS: redirecting to Libvirt provider');
    return OVIRT_PROVIDER.nextProvider.GET_ALL_VMS();
  },

  /**
   * Call `shut down` on the VM.
   *
   * Redirected to Libvirt provider.
   *
   * @param payload { name, id }
   * @constructor
   */
  SHUTDOWN_VM: function (payload) {
    var name = payload.name;
    var id = payload.id;
    logDebug('OVIRT_PROVIDER.SHUTDOWN_VM(name="' + name + '", id="' + id + '")');
    return function (dispatch) {
      return OVIRT_PROVIDER._ovirtApiPost('vms/' + id + '/shutdown', '<action />');
    };
  },

  /**
   * Force shut down on the VM.
   *
   * @param payload { name, id }
   * @constructor
   */
  FORCEOFF_VM: function (payload) {
    var name = payload.name;
    var id = payload.id;
    logDebug('OVIRT_PROVIDER.FORCEOFF_VM(name="' + name + '", id="' + id + '")');
    return function (dispatch) {
      return OVIRT_PROVIDER._ovirtApiPost('vms/' + id + '/stop', '<action />');
    };
  },

  REBOOT_VM: function (payload) {
    var name = payload.name;
    var id = payload.id;
    logDebug('OVIRT_PROVIDER.REBOOT_VM(name="' + name + '", id="' + id + '")');

    return function (dispatch) {
      return OVIRT_PROVIDER._ovirtApiPost('vms/' + id + '/reboot', '<action />');
    };
  },

  FORCEREBOOT_VM: function (payload) {
    return OVIRT_PROVIDER.REBOOT_VM(payload); // TODO: implement 'force'
  },

  START_VM: function (payload) {
    var name = payload.name;
    var id = payload.id;
    logDebug('OVIRT_PROVIDER.START_VM(name="' + name + '", id="' + id + '")');

    return function (dispatch) {
      return OVIRT_PROVIDER._ovirtApiPost('vms/' + id + '/start', '<action />');
    };
  },

  // --- End of API, private functions follow -------
  _login: function (baseUrl) {
    logDebug('OVIRT_PROVIDER._login() called');

    var location = window.top.location;
    var tokenStart = location.hash.indexOf("token=");
    var token = window.sessionStorage.getItem('OVIRT_PROVIDER_TOKEN'); // as default

    logDebug('location: ' + location.toString() + '\ntokenStart=' + tokenStart + '\ntoken=' + token);

    if (tokenStart >= 0) {
      // TOKEN received as a part of URL has precedence
      token = location.hash.substr(tokenStart + "token=".length);
      logDebug("_login(): token found in params: " + token);
      OVIRT_PROVIDER.token = token;
      window.sessionStorage.setItem('OVIRT_PROVIDER_TOKEN', token);
      logDebug("_login(): token from params stored to sessionStorage, now removing the token hash from the url");
      window.top.location.hash = '';
      return true;
    } else if (token) {
      // search the sessionStorrage
      logDebug("_login(): token found in sessionStorrage: " + token);
      OVIRT_PROVIDER.token = token;
      return true;
    } else {
      // redirect to oVirt's SSO
      location = 'https://' + window.location.host;
      var url = baseUrl + '/web-ui/authorizedRedirect.jsp?redirectUrl=' + location + '/machines/__hash__token=TOKEN';
      logDebug("_login(): missing oVirt SSO token, redirecting to SSO: " + url);

      window.top.location = url;
    }
    return false;
  },

  _readConfiguration: function () {
    if (!window.$) {
      logError('JQuery not found! The configuration is not read, using default.');
      return ;
    }
    var configUrl = 'provider/machines-ovirt.config';
    window.$.ajax({
      url: OVIRT_PROVIDER.CONFIG_FILE_URL,
      type: 'GET',
      data: {},
      async: true // Expected by next flow!
    }).done( function (data) {
      var config = JSON.parse(data);
      Object.assign(OVIRT_PROVIDER.CONFIG, config);

      OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL = OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.trim();
      if (OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.charAt(OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.length - 1) === '/') {
        OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL = OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL
          .substring(0, OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.length - 1);
      }

      logDebug('Configuration retrieved, result: ' + JSON.stringify(OVIRT_PROVIDER.CONFIG));
    }).fail( function (e) {
        if (e && e.status === 404) {
          logError('Configuration of cockpit-machines-ovirt-provider not found. It means, the install script has not been called yet.');
          // TODO: dialog to gather the engine url and call the "provider/install.sh [URL]"
          return ;
        }
        logError('Configuration failed to load: ' + JSON.stringify(e));
      });
  },

  _ovirtApiGet: function (resource) {
    return $.ajax({
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/xml',
        'Authorization': 'Bearer ' + OVIRT_PROVIDER.token
      },
      url: OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL + '/api/' + resource
    }).fail(function (data) {
      logError('HTTP GET failed: ' + JSON.stringify(data));
      // TODO: clear token from sessionStorage and refresh --> SSO will pass again
    });
  },

  _ovirtApiPost: function (resource, input) {
    logDebug('Post, token: ' + OVIRT_PROVIDER.token);
    return $.ajax({
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/xml',
        'Authorization': 'Bearer ' + OVIRT_PROVIDER.token
      },
      url: OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL + '/api/' + resource,
      data: input
    }).fail(function (data) {
      logError('HTTP POST failed: ' + JSON.stringify(data));
      // TODO: clear token from sessionStorage and refresh --> SSO will pass again
    });
  },
};

function init () {
  console.log('Registering the oVirt provider');
  window.EXTERNAL_PROVIDER = OVIRT_PROVIDER;
}

init();

// --------------------------------------
/*
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines__hash__token=TOKEN
 */
