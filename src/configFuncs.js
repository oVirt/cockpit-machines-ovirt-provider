import { deferFunctionCall, logDebug, logError } from './helpers.js'
import { showPluginInstallationDialog } from './installDialog.js'
import CONFIG, { CONFIG_FILE_URL } from './config.js'

export function readConfiguration (onConfigRead) {
  logDebug(`readConfiguration() called for configUrl='${CONFIG_FILE_URL}'`);

  return window.$.ajax({
    url: CONFIG_FILE_URL,
    type: 'GET',
    data: {},
  }).then( // AJAX ok
    (data) => {
      logDebug(`Configuration file retrieved from server.`);
      const config = JSON.parse(data);
      Object.assign(CONFIG, config);

      let baseUrl = CONFIG.OVIRT_BASE_URL.trim();
      if (baseUrl.charAt(baseUrl.length - 1) === '/') {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
      }
      CONFIG.OVIRT_BASE_URL = baseUrl;

      logDebug(`Configuration parsed, using merged result: ${JSON.stringify(CONFIG)}`);
      return deferFunctionCall(onConfigRead);
    }, (e) => { // AJAX failed
      if (e && e.status === 404) {
        logError(`Configuration of cockpit-machines-ovirt-provider not found. It means, the install script has not been called yet.`);
        return showPluginInstallationDialog();
      }
      logError(`Configuration failed to load: ${JSON.stringify(e)}`);
    });
}
