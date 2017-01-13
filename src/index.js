/**
 To have this oVirt external provider for Cockpit/machines working,
 the oVirt SSO token must be provided to the cockpit/machines plugin.

 Parameters to cockpit packages can't be provided via '?' in the URL, so the hash '#' sign is used as workaround.

 Example:
    https://[ENGINE_HOST]/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://[COCKPI_HOST]:9090/machines__hash__token=TOKEN

 General notes:
   - data are still retrieved from Libvirt, only the active operations are redirected to oVirt


 Installation:
  - copy src/* under /usr/share/cockpit/machines/provider
  - call
     /usr/share/cockpit/machines/provider [MY_ENGINE_URL]
     # example: /usr/share/cockpit/machines/provider https://engine.mydomain.com/ovirt-engine/
  - [root@engine]# engine-config -s CORSSupport=true # To turn on the CORS support for the REST API

  - WAIT TILL MERGE: Either https://gerrit.ovirt.org/#/c/68529/
    OR WORKAROUND [root@engine]# engine-config -s 'CORSAllowedOrigins=*' # or more particular

 TODO: since the web-ui/authorizedRedirect.jsp, ovirt-web-ui.0.1.1-2 (part of ovirt-engine 4.1) - considering moving similar code to enginess.war
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

var OVIRT_PROVIDER = {
  name: 'oVirt',
  token: null,
  CONFIG: {// TODO: read following configuration dynamically from provider's config file
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

    // TODO: Read the config file!

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
