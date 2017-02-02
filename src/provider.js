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

import { logDebug, logError, ovirtApiPost } from './helpers.js'
import { readConfiguration } from './configFuncs.js'
import { doLogin } from './login.js'

/**
 * Implementation of cockpit:machines External Provider API for the oVirt
 */
let OVIRT_PROVIDER = {};
OVIRT_PROVIDER = {
  name: 'oVirt',

  actions: { // OVIRT_PROVIDER.list is for reference only, it's expected to be replaced by init()
    delayRefresh: () => {},
    deleteUnlistedVMs: (vmNames) => {},
    updateOrAddVm: (vm) => {},
  },
  nextProvider: null,

  /**
   * Initialize the Provider
   */
  init: (actionCreators, _nextProvider) => {
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

    OVIRT_PROVIDER.actions = actionCreators;
    OVIRT_PROVIDER.nextProvider = _nextProvider;
    OVIRT_PROVIDER.vmStateMap = _nextProvider.vmStateMap; // reuse Libvirt since it is used for data retrieval

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
  GET_ALL_VMS: () => {
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
  SHUTDOWN_VM: (payload) => {
    logDebug(`SHUTDOWN_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    return (dispatch) => ovirtApiPost(`vms/${id}/shutdown`, '<action />');
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
    return (dispatch) => ovirtApiPost(`vms/${id}/stop`, '<action />');
  },

  REBOOT_VM: (payload) => {
    logDebug(`REBOOT_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    return (dispatch) => ovirtApiPost(`vms/${id}/reboot`, '<action />');
  },

  FORCEREBOOT_VM: (payload) => {
    logDebug(`FORCEREBOOT_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    return OVIRT_PROVIDER.REBOOT_VM(payload); // TODO: implement 'force'
  },

  START_VM: (payload) => {
    logDebug(`START_VM(payload: ${JSON.stringify(payload)})`);
    const id = payload.id;
    return (dispatch) => ovirtApiPost(`vms/${id}/start`, '<action />');
  },

};


export default OVIRT_PROVIDER;
