/**
 To have this oVirt external provider for Cockpit/machines working,
 the oVirt SSO token must be provided to the cockpit/machines plugin.

 Parameters to cockpit packages can't be provided via '?' in the URL, so the hash '#' sign is used as workaround.

 Example:
    https://[ENGINE_HOST]/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://[COCKPI_HOST]:9090/machines__hash__token=TOKEN

 General notes:
   - data are still retrieved from Libvirt, active operations only are redirected to oVirt


 WIP: there will be redirect to Engine SSO if the token is missing, but recently CSP is blocking it...
 WIP: since the web-ui/authorizedRedirect.jsp, ovirt-web-ui.0.1.1-2 (part of ovirt-engine 4.1) - considering moving similar code to enginess.war
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
  CONFIG: {// TODO: read dynamically from config file
    debug: true, // set to false to turn off debug logging
    OVIRT_BASE_URL: 'https://engine.local/ovirt-engine',
  },
  actions: { // this list is for reference only, it's expected to be replaced by init()
    delayRefresh: function () {},
    deleteUnlistedVMs: function (vmNames) {},
    updateOrAddVm: function (vm) {},
  },


  /**
   * Initialize the Provider
   */
  init: function (actionCreators, nextProvider) {
    logDebug('init() called');
    OVIRT_PROVIDER.actions = actionCreators;
    OVIRT_PROVIDER.nextProvider = nextProvider;
    OVIRT_PROVIDER.vmStateMap = nextProvider.vmStateMap; // reuse Libvirt since it is used for data retrieval

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

    /* Not needed, since Libvirt is used for data retrieval
        logDebug('GET_ALL_VMS() called');
        return function (dispatch) {
          OVIRT_PROVIDER._ovirtApiGet('vms')
            .done(function (data) { // data is demarshalled JSON
              logDebug('GET_ALL_VMS successful');

              var vmNames = [];
              data.vm.forEach(function (ovirtVm) {
                var vm = OVIRT_PROVIDER._adaptVm(ovirtVm);
                vmNames.push(vm.name);
                dispatch(OVIRT_PROVIDER.actions.updateOrAddVm(vm));
              });

              // remove undefined domains
              dispatch(OVIRT_PROVIDER.actions.deleteUnlistedVMs(vmNames));

              // keep polling AFTER all VM details have been read (avoid overlap)
              dispatch(OVIRT_PROVIDER.actions.delayRefresh());
            });
        };*/
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
  _renderDisclaimer: function (text) { // TODO: if only automatic redirect works ... But CSP
    text = text ? text : _('The oVirt External Provider is installed but default Libvirt is used instead since oVirt' +
      ' login token is missing.<br/>If you want otherwise, please');

    var style = "position: fixed; bottom: 0; left: 0; right: 0;"; // always visible footer

    var loc = window.location.href;
    var cockpitHost = loc.substring(0, loc.indexOf('/cockpit/'));
    var url = 'https://[ENGINE_HOST]/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=' + cockpitHost + '/machines__hash__token=TOKEN';

    var div = document.createElement('div');
    div.className = 'alert alert-danger';
    div.setAttribute('style', style);
    div.innerHTML = '<p><span class="pficon-warning-triangle-o" />' +
      '&nbsp;' + text +
      '<ul><li>either land to cockpit from oVirt User Portal</li>' +
      '<li>or specify ENGINE_HOST in following link: ' + url + '</li></ul>' +
      '</p>';
    document.body.insertBefore(div, document.body.firstChild);
    window.setTimeout(function () {document.body.removeChild(div);}, 10000);
  },

  _renderUnauthorized: function () { // TODO: if only automatic redirect works ... But CSP
    OVIRT_PROVIDER._renderDisclaimer(_('Authorization expired. Log in again, please'));
  },

  _login: function (baseUrl) {
    var location = window.location;
    var tokenStart = location.hash.indexOf("token=");
    var token = window.sessionStorage.getItem('OVIRT_PROVIDER_TOKEN'); // as default

    if (tokenStart >= 0) { // TOKEN received as a part of URL has precedence
      token = location.hash.substr(tokenStart + "token=".length);
      logDebug("_login(): token found in params: " + token);
      OVIRT_PROVIDER.token = token;
      window.sessionStorage.setItem('OVIRT_PROVIDER_TOKEN', token);
      return true;
    } else if (token) { // search sessionStorrage
      logDebug("_login(): token found in sessionStorrage: " + token);
      OVIRT_PROVIDER.token = token;
      return true;
    } else { // TODO: redirect to SSO is recently not working because of CSP
      // redirect to oVirt's SSO
      var url = baseUrl + '/web-ui/authorizedRedirect.jsp?redirectUrl=' + location + '#token=TOKEN';
      logDebug("_login(): missing oVirt SSO token, redirecting to SSO: " + url);

      // window.cockpit.location.replace(url);
      /*            var a = document.createElement('a');
       a.setAttribute('href', 'http://www.google.com');
       a.innerText = 'My Link';
       document.body.appendChild(a);
       */

      // window.location = url;
      logError('SSO token is not provided!');
      OVIRT_PROVIDER._renderDisclaimer();
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
      if (data.status === 401) { // Unauthorized
        OVIRT_PROVIDER._renderUnauthorized(); // TODO: or better redirect to SSO
      }
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
      if (data.status === 401) { // Unauthorized
        OVIRT_PROVIDER._renderUnauthorized(); // TODO: or better redirect to SSO
      }
    });
  },

  // -------------------------------------------------------
/*
  // Not needed anymore, since Libvirt is used for data retrieval.
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
  vmStateMap: { // TODO: localization needed
    unassigned: undefined,
    down: {className: 'fa fa-arrow-circle-o-down icon-1x-vms', title: 'The VM is down.'},
    up: {className: 'pficon pficon-ok icon-1x-vms', title: _("The VM is running.")},
    powering_up: {className: 'glyphicon glyphicon-wrench icon-1x-vms', title: _('The VM is going up.')},
    paused: {className: 'pficon pficon-pause icon-1x-vms', title: _('The VM is paused.')},
    migrating: {className: 'pficon pficon-route icon-1x-vms', title: _('The VM is migrating.')},
    unknown: undefined,
    not_responding: {className: 'pficon pficon-error-circle-o icon-1x-vms', title: _("The VM is not responding.")},
    wait_for_launch: {className: 'fa fa-clock-o icon-1x-vms', title: _('The VM is scheduled for launch.')},
    reboot_in_progress: undefined, // TODO
    saving_state: undefined,
    restoring_state: undefined,
    suspended: {className: 'pficon pficon-pause icon-1x-vms', title: _('The VM is suspended.')},
    image_locked: {className: 'fa fa-lock icon-1x-vms', title: _("The VM's image is locked.")},
    powering_down: {className: 'glyphicon glyphicon-wrench icon-1x-vms', title: _('The VM is going down.')},
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
*/
};

function init () {
  console.log('Registering oVirt provider');
  window.EXTERNAL_PROVIDER = OVIRT_PROVIDER;
}

init();

// --------------------------------------
/*
 [root@engine engine-config]# engine-config -s CORSSupport=true
 [root@engine engine-config]# engine-config -s 'CORSAllowedOrigins=*' # or more particular

 ovirt-engine: CORS filter: use dynamic list of hosts (https://gerrit.ovirt.org/#/c/68529/ )

 replace in manifest.json: "content-security-policy": "default-src * 'unsafe-inline' 'unsafe-eval';connect-src https://engine.local;"
 connect-src 'self';   -->   connect-src [ENGINE_URL];
 implement check here in provider about content of cockpit/machines/manifest.json -- reinstallation
 - maybe script updating it, rpm|user can call it

 encoded url:
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines__hash__token=TOKEN
 */
