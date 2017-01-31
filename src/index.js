/**
 To have this oVirt external provider for Cockpit/machines working,
 the oVirt SSO token must be provided to the cockpit/machines plugin.

 Future development: Use webpack + babel to generate this index.js file. Ensure the API is met.

 Parameters to cockpit packages can't be provided via '?' in the URL, so the hash '#' sign is used as workaround.

 Example:
    https://[ENGINE_HOST]/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://[COCKPI_HOST]:9090/machines__hash__token=TOKEN

 General notes:
   - data are still retrieved from Libvirt, only the active operations are redirected to oVirt
*/

// var _ = function (str) { return str; } // TODO: implement localization

if (typeof window.logDebug != 'function') {
  window.logDebug = function (msg) {
    if (OVIRT_PROVIDER.CONFIG.debug) {
      console.log('OVIRT_PROVIDER: ' + msg);
    }
  }
}

if (typeof window.logError != 'function') {
  window.logError = function (msg) {
    console.error('OVIRT_PROVIDER: ' + msg);
  }
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
//  INSTALL_SCRIPT: '/usr/share/cockpit/machines/provider/install.sh',
  INSTALL_SCRIPT: '/root/.local/share/cockpit/machines/provider/install.sh',
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

    if (!window.$) {
      logError('JQuery not found! The OVIRT_PROVIDER is not initialized, using default.');
      return ;
    }

    if (!window.cockpit) {
      logError('Cockpit not found! The OVIRT_PROVIDER is not initialized, using default.');
      return ;
    }

    return OVIRT_PROVIDER._readConfiguration(function () {
      return OVIRT_PROVIDER._login(OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL);
    });
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

  _readConfiguration: function (onConfigRead) {
    logDebug("_readConfiguration() called for configUrl=" + OVIRT_PROVIDER.CONFIG_FILE_URL);

    return window.$.ajax({
      url: OVIRT_PROVIDER.CONFIG_FILE_URL,
      type: 'GET',
      data: {},
      // async: true // Expected by next flow!
    }).then( // AJAX ok
      function (data) {
        logDebug('Configuration file retrieved.');
        var config = JSON.parse(data);
        Object.assign(OVIRT_PROVIDER.CONFIG, config);

        OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL = OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.trim();
        if (OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.charAt(OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.length - 1) === '/') {
          OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL = OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL
            .substring(0, OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL.length - 1);
        }

        logDebug('Configuration parsed, using merged result: ' + JSON.stringify(OVIRT_PROVIDER.CONFIG));
        return OVIRT_PROVIDER._deferFunctionCall(onConfigRead);
    }, function (e) { // AJAX failed
        if (e && e.status === 404) {
          logError('Configuration of cockpit-machines-ovirt-provider not found. It means, the install script has not been called yet.');
          return OVIRT_PROVIDER._showPluginInstallationDialog();
        }
        logError('Configuration failed to load: ' + JSON.stringify(e));
      });
  },

  _showPluginInstallationDialog: function () {
    $("body").append(getInstallationDialogHtml());

    var deferred = cockpit.defer();
    $("#ovirt-provider-install-dialog-cancel").on("click", function() {
      deferred.reject();
    });
    $("#ovirt-provider-install-dialog-install-button").on("click", function() {
      var engineUrl = $("#ovirt-provider-install-dialog-engine-url").val()
      window.cockpit.spawn([OVIRT_PROVIDER.INSTALL_SCRIPT, engineUrl], { "superuser": "try" })
        .done(function () {
          $("#ovirt-provider-install-dialog").modal("hide");
          logDebug('oVirt Provider installation script successful');
          window.top.location.reload(true);
          // window.location.reload(true);
          deferred.resolve()
        })
        .fail(function (ex, data) {
          logError('oVirt Provider installation script failed. Exception="'+JSON.stringify(ex)+'", output="'+JSON.stringify(data)+'"');
          deferred.reject();
        });
    });

    $("#ovirt-provider-install-dialog").modal({keyboard: false});
    return deferred.promise;
  },

  _deferFunctionCall: function( func ) {
    var deferred = cockpit.defer();
    if (func()) {
      return deferred.resolve().promise;
    }
    return deferred.reject().promise;
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

function initOvirtProvider () {
  console.log('Registering the oVirt provider');
  window.EXTERNAL_PROVIDER = OVIRT_PROVIDER;
}

initOvirtProvider();

// --------------------------------------
/*
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines__hash__token=TOKEN
 */
function getInstallationDialogHtml() {
    return '<div class="modal" id="ovirt-provider-install-dialog" tabindex="-1" role="dialog" data-backdrop="static">' +
       '<div class="modal-dialog">' +
          '<div class="modal-content">' +
              '<div class="modal-header">' +
                  '<h4 class="modal-title">Finish oVirt External Provider installation</h4>' +
              '</div>' +
              '<div class="modal-body">' +
                  '<p>The oVirt External provider is installed but not yet configured. Please enter Engine URL.</p>' +
                  '<table class="form-table-ct">' +
                      '<tr>' +
                          '<td class="top"><label class="control-label" for="ovirt-provider-install-dialog-engine-url">Engine URL: </label></td>' +
                          '<td><input id="ovirt-provider-install-dialog-engine-url" class="form-control" type="text" placeholder="https://engine.mydomain.com/ovirt-engine/"></td>' +
                      '</tr>' +
                  '</table>' +
              '</div>' +
              '<div class="modal-footer">' +
                  '<button class="btn btn-default" id="ovirt-provider-install-dialog-cancel" data-dismiss="modal">Not now</button>' +
                  '<button class="btn btn-primary" id="ovirt-provider-install-dialog-install-button">Install</button>' +
              '</div>' +
          '</div>' +
      '</div>' +
    '</div>';
}

