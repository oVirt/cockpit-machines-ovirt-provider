
// export const INSTALL_SCRIPT = '/usr/share/cockpit/machines/provider/install.sh'
export const INSTALL_SCRIPT = '/root/.local/share/cockpit/machines/provider/install.sh' // TODO: change it!

export const CONFIG_FILE_URL = 'provider/machines-ovirt.config'

const CONFIG = { // will be dynamically replaced by content of CONFIG_FILE_URL within OVIRT_PROVIDER.init()
  debug: true, // set to false to turn off the debug logging
  OVIRT_BASE_URL: 'https://engine.local/ovirt-engine',

  // TODO: add ovirt_polling_interval to external config file
  ovirt_polling_interval: 5000, // in ms, oVirt polling is not called more then once per this time period. Single execution can be in progress at a time.

  token: null,
}

export default CONFIG
