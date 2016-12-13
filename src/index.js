/*
TODO:
 [root@engine engine-config]# engine-config -s CORSSupport=true
 [root@engine engine-config]# engine-config -s 'CORSAllowedOrigins=*' # or more particular

  ovirt-engine: CORS filter: use dynamic list of hosts

  replace in manifest.json: "content-security-policy": "default-src * 'unsafe-inline' 'unsafe-eval';connect-src https://engine.local;"

 https://192.168.122.101:9090/machines#token=TOKEN
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines#token=TOKEN

 encoded url:
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https%3A%2F%2F192.168.122.101%3A9090%2Fmachines%23token%3DTOKEN

 check error status code: 401 - remove token and reissue login
 */

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
    CONFIG: {// TODO: read dynamically from config file
      debug: true, // set to false to turn off debug logging
      OVIRT_BASE_URL: 'https://engine.local/ovirt-engine',
    },
    actions: { //  this list is for reference only, it's expected to be replaced by init()
      delayRefresh: function () {}, // delayPolling(getAllVms())
      deleteUnlistedVMs: function (vmNames) {},
      updateOrAddVm: function (vm) {},
    },

    _login: function (baseUrl) {
        var location = window.location;
        var tokenStart = location.hash.indexOf("token=");
        if (tokenStart >= 0) {
            var token = location.hash.substr(tokenStart + "token=".length);
            logDebug("_login(): token found in params: " + token);
            OVIRT_PROVIDER.token = token;
            return true;
        } else { // TODO: redirect to SSO is recently not working because of CSP
/*            // redirect to oVirt's SSO
            var url = baseUrl + '/web-ui/authorizedRedirect.jsp?redirectUrl=' + location + '#token=TOKEN';
            logDebug("_login(): missing oVirt SSO token, redirecting to SSO: " + url);
            window.location = url;
            */
            logError('SSO token is not provided!');
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
    });
  },

    _adaptVm: function (ovirtVm) {
      var vcpus = function (ovirtCpu) {
        var t = ovirtCpu.topology;
        return t.sockets * t.cores * t.threads;
      };
      var currentMemory = function (ovirtMem) {
        return ovirtMem / 1024; // to KiB
      };
      var state = function (ovirtStatus) {
        return ovirtStatus;
      };

      return {
        id: ovirtVm.id,
        name: ovirtVm.name,
        state: state(ovirtVm.status),
        osType: ovirtVm.os.type,
        fqdn: ovirtVm.fqdn,
        uptime: -1, // TODO
        currentMemory: currentMemory(ovirtVm.memory),
        rssMemory: undefined, // TODO
        vcpus: vcpus(ovirtVm.cpu),
        autostart: undefined,
        actualTimeInMs: undefined, // TODO
        cpuTime: undefined // TODO
      };
    },
    /**
     * Initialize the Provider
     */
    init: function (actionCreators) {
        logDebug('init() called');
      OVIRT_PROVIDER.actions = actionCreators;
      return OVIRT_PROVIDER._login(OVIRT_PROVIDER.CONFIG.OVIRT_BASE_URL);
    },
/*
  UNASSIGNED,
  DOWN,
  UP,
  POWERING_UP,
  PAUSED,
  MIGRATING,
  UNKNOWN,
  NOT_RESPONDING,
  WAIT_FOR_LAUNCH,
  REBOOT_IN_PROGRESS,
  SAVING_STATE,
  RESTORING_STATE,
  SUSPENDED,
  IMAGE_LOCKED,
  POWERING_DOWN */
  canReset: function (state) {
    return state && (state === 'up' || state === 'migrating');
  },
  canShutdown: function (state) {
    return OVIRT_PROVIDER.canReset(state) || (state === 'reboot_in_progress' || state === 'paused' || state === 'powering_up');
  },
  isRunning: function (state) {
    return OVIRT_PROVIDER.canReset(state);
  },
  canRun: function (state) {
    return state && (state === 'down' || state === 'paused' || state === 'suspended');
  },

  /**
   * Get single VM
   * @param payload { lookupId: name }
   * @constructor
   */
    GET_VM: function ( payload ) {
      logDebug('GET_VM() called');
      logError('OVIRT_PROVIDER.GET_VM() is not implemented'); // should not be needed
      return function (dispatch) {};
    },

    /**
     * Initiate read of all VMs
     */
    GET_ALL_VMS: function () {
        logDebug('GET_ALL_VMS() called');
        return function (dispatch) {
          OVIRT_PROVIDER._ovirtApiGet('vms')
            .done( function (data) { // data is demarshalled JSON
              logDebug('GET_ALL_VMS successful');

              var vmNames = [];
              data.vm.forEach( function (ovirtVm) {
                var vm = OVIRT_PROVIDER._adaptVm(ovirtVm);
                vmNames.push(vm.name);
                dispatch(OVIRT_PROVIDER.actions.updateOrAddVm(vm));
              });

              // remove undefined domains
              dispatch(OVIRT_PROVIDER.actions.deleteUnlistedVMs(vmNames));

              // keep polling AFTER all VM details have been read (avoid overlap)
              dispatch(OVIRT_PROVIDER.actions.delayRefresh());
            }).fail(function (data) {
            logError('GET_ALL_VMS failed: ' + data);
          });
      };
    },

  /**
   * Call `shut down` on the VM
   * @param payload { name, id }
   * @constructor
   */
    SHUTDOWN_VM: function (payload) {
      var name = payload.name;
      var id = payload.id;
      logDebug('OVIRT_PROVIDER.SHUTDOWN_VM(name="' + name + '", id="' + id + '")');
      return OVIRT_PROVIDER._ovirtApiPost('vms/'+id+'/shutdown', '<action />');
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
      return OVIRT_PROVIDER._ovirtApiPost('vms/'+id+'/stop', '<action />');
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
    }
};

function init () {
    console.log('Registering oVirt provider');
    window.EXTERNAL_PROVIDER = OVIRT_PROVIDER;
}

init();
