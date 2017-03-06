/**
 To have this ovirt external provider for Cockpit:machines working,
 the oVirt SSO token must be provided to the cockpit/machines plugin.

 Parameters to cockpit packages can't be provided via '?' in the URL, so the hash '#' sign is used as workaround.

 Example:
    https://[ENGINE_HOST]/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://[COCKPI_HOST]:9090/machines__hash__token=TOKEN

 General notes:
   - data are still retrieved from Libvirt, only the active operations are redirected to oVirt
 https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines__hash__token=TOKEN

*/

import { logDebug, logError, ovirtApiPost, ovirtApiGet, fileDownload, loadCss } from './helpers.js'
import { readConfiguration } from './configFuncs.js'
import { doLogin } from './login.js'
import { vmActionFailed } from './actions';

import { registerReact } from './react.js';
import { lazyCreateReactComponents } from './reactComponents';
import { ovirtReducer }  from './reducers'
import OVirtTabComponents from './components/hostVmsTabs.jsx';
import VmDisksSubtab from './components/vmDisksSubtab.jsx';
import { appendClusterSwitch } from './components/topLevelViewSwitch.jsx';

import { pollOvirt } from './ovirt';

const _ = (m) => m; // TODO: add translation

const CONSOLE_TYPE_ID_MAP = { // TODO: replace by API call /vms/[ID]/graphicsconsoles for more flexibility, but it's hardcoded everywhere anyway ...
  'spice': '7370696365',
  'vnc': '766e63',
  'rdp': 'rdp_not_yet_supported',
};

const QEMU_SYSTEM = 'system'; // conforms connection name defined in parent's cockpit:machines/config.es6

function buildVmFailHandler ({dispatch, vmName, msg}) {
  return (data, exception) =>
    dispatch(vmActionFailed({
      name: vmName,
      connectionName: QEMU_SYSTEM,
      message: msg,
      detail: {
        data,
        exception: data ?
          (data.responseJSON && data.responseJSON.fault && data.responseJSON.fault.detail) ?
            data.responseJSON.fault.detail
            : exception
          : exception,
      }}));
}

/**
 * Implementation of cockpit:machines External Provider API for the oVirt
 */
let OVIRT_PROVIDER = {};
OVIRT_PROVIDER = {
  name: 'oVirt',

  actions: { // OVIRT_PROVIDER.actions is for reference only, it's expected to be replaced by init()
    virtMiddleware: (method, action) => {},

    delayRefresh: () => {},
    deleteUnlistedVMs: (vmNames) => {},
    updateOrAddVm: (vm) => {},
  },
  parentReactComponents: {}, // to reuse look&feel, see init()
  nextProvider: null,

  /**
   * Initialize the Provider
   */
  init: ({
    defaultProvider,
    React,
    reduxStore,
    exportedActionCreators,
    exportedReactComponents,
  }) => {
    logDebug(`init() called`);

    // The external provider is loaded into context of cockpit:machines plugin
    // So, JQuery and Cockpit are available
    if (!window.$) {
      logError('JQuery not found! The OVIRT_PROVIDER is not initialized, using default.');
      return ;
    }
    if (!window.cockpit) {
      logError('Cockpit not found! The OVIRT_PROVIDER is not initialized, using default.');
      return ;
    }

    OVIRT_PROVIDER.actions = exportedActionCreators;
    OVIRT_PROVIDER.parentReactComponents = exportedReactComponents;
    OVIRT_PROVIDER.nextProvider = defaultProvider;
    OVIRT_PROVIDER.vmStateMap = { // TODO: list oVirt specific states, compare to ovirt.js:mapOvirtStatusToLibvirtState()
    }; // reuse map for Libvirt (defaultProvider.vmStateMap) since it is used for data retrieval

    loadCss();
    registerReact(React);
    lazyCreateReactComponents();
    appendClusterSwitch(reduxStore);

    return readConfiguration( doLogin );
  },

  vmStateMap: null, // see init()

  /**
   * Redirect state functions back to Libvirt provider
   */
  canReset: state => OVIRT_PROVIDER.nextProvider.canReset(state),
  canShutdown: state => OVIRT_PROVIDER.nextProvider.canShutdown(state),
  isRunning: state => OVIRT_PROVIDER.nextProvider.isRunning(state),
  canRun: state => OVIRT_PROVIDER.nextProvider.canRun(state),
  canConsole: state => OVIRT_PROVIDER.nextProvider.canConsole(state),

  /**
   * Get a single VM
   *
   * Redirected to Libvirt provider.
   */
  GET_VM: (payload) => {
    logDebug('GET_VM: redirecting to Libvirt provider');
    return OVIRT_PROVIDER.nextProvider.GET_VM(payload);
  },

  /**
   * Initiate read of all VMs
   *
   * Redirected to Libvirt provider.
   */
  GET_ALL_VMS: (payload) => {
    logDebug('OVIRT_PROVIDER.GET_ALL_VMS() called');

    logDebug('GET_ALL_VMS: redirecting to Libvirt provider');
    return (dispatch) => {
      pollOvirt({dispatch});

      const delegate = OVIRT_PROVIDER.nextProvider.GET_ALL_VMS(payload);
      if (delegate.done || delegate.then) {
        logError(`Expectation not met: nextProvider.GET_ALL_VMS() shall return 'function (dispatch) {}' and not a Premise. TODO: extend OVIRT_PROVIDER!`);
        return ;
      }

      return delegate(dispatch);
    }
  },

  /**
   * Call `shut down` on the VM.
   *
   * Redirected to Libvirt provider.
   *
   * @param payload { name, id }
   * @constructor
   */
  SHUTDOWN_VM: (payload) => {
    logDebug(`SHUTDOWN_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    const vmName = payload.name;
    return (dispatch) => ovirtApiPost(
      `vms/${id}/shutdown`,
      '<action />',
      buildVmFailHandler({dispatch, vmName, msg: _("SHUTDOWN action failed")})
    );
  },

  /**
   * Force shut down on the VM.
   *
   * @param payload { name, id }
   * @constructor
   */
  FORCEOFF_VM: (payload) => {
    logDebug(`FORCEOFF_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    const vmName = payload.name;
    return (dispatch) => ovirtApiPost(
      `vms/${id}/stop`,
      '<action />',
      buildVmFailHandler({dispatch, vmName, msg: _("FORCEOFF action failed")})
    );
  },

  REBOOT_VM: (payload) => {
    logDebug(`REBOOT_VM(payload: ${JSON.stringify(payload)})`);
    const vmName = payload.name;
    const id = payload.id;
    return (dispatch) => ovirtApiPost(
      `vms/${id}/reboot`,
      '<action />',
      buildVmFailHandler({dispatch, vmName, msg: _("REBOOT action failed")})
    );
  },

  FORCEREBOOT_VM: (payload) => {
    logDebug(`FORCEREBOOT_VM(payload: ${JSON.stringify(payload)})`);
    return OVIRT_PROVIDER.REBOOT_VM(payload); // TODO: implement 'force'
  },

  START_VM: (payload) => {
    logDebug(`START_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    const vmName = payload.name;
    const hostName = payload.hostName; // optional

    const actionXml = hostName ?
      `<action><vm><placement_policy><hosts><host><name>${hostName}</name></host></hosts></placement_policy></vm></action>`
      : '<action />';

    logDebug(`actionXml: ${actionXml}`);
    return (dispatch) => ovirtApiPost(
      `vms/${id}/start`,
      actionXml,
      buildVmFailHandler({dispatch, vmName, msg: _("START action failed")})
    );
  },

  MIGRATE_VM: ({ vmId, vmName, hostId }) => {
    logDebug(`MIGRATE_VM(payload: {vmId: "${vmId}", hostId: "${hostId}"}`);
    const action = hostId ?
      `<action><host id="${hostId}"/></action>` :
      '<action/>'
    return (dispatch) => ovirtApiPost(
      `vms/${vmId}/migrate`,
      action,
      buildVmFailHandler({dispatch, vmName, msg: _("MIGRATE action failed")})
    );
  },

  CONSOLE_VM (payload) {
    const type = payload.consoleDetail.type; // spice, vnc, rdp
    const vmId = payload.id;
    logDebug(`CONSOLE_VM: requesting .vv file from oVirt for vmId: ${vmId}, type: ${type}`);

    // TODO: console ID is so far considered as a constant in oVirt for particular console type. Anyway, cleaner (but slower) approach would be to query 'vms/${vmId}/graphicsconsoles' first to get full list
    const consoleId = CONSOLE_TYPE_ID_MAP[type];

    if (!consoleId) {
      logError(`CONSOLE_VM: unable to map console type to id. Payload: ${JSON.stringify(payload)}`);
      return ;
    }

    return (dispatch) => ovirtApiGet(
      `vms/${vmId}/graphicsconsoles/${consoleId}`,
      { Accept: 'application/x-virt-viewer' }).then(vvFile => {
        fileDownload({ data: vvFile,
          fileName: `${type}Console.vv`,
          mimeType: 'application/x-virt-viewer'});
    });
  },

  reducer: ovirtReducer,

  vmTabRenderers: [
    {
      name: _("Cluster"),
      componentFactory: () => OVirtTabComponents.OVirtTab
    },
  ],

  vmDisksActionsFactory: undefined,
  vmDisksColumns: undefined,
/* Not needed now, keeping as an example
  vmDisksActionsFactory: ({vm}) => VmDisksSubtab.DummyActionsFactory({vm}), // listing-wide actions, see cockpit-components-listing.jsx
  vmDisksColumns: [
    {
      title: _("oVirt"),
      index: 3,
      valueProvider: ({ vm, diskTarget }) => `vm: ${vm.name}, diskTarget: ${diskTarget}}`,
    },
    {
      title: _("Foo"),
      index: 5,
      valueProvider: ({ vm, diskTarget }) => VmDisksSubtab.DummyFactory({ vm, diskTarget }),
    },
  ],
*/

};

export default OVIRT_PROVIDER;
